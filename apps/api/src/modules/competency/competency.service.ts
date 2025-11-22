import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CompetencyStandard } from '@avala/db';

/**
 * CompetencyService
 * Manages EC (Estándares de Competencia) with tenant isolation
 */
@Injectable()
export class CompetencyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Search competency standards by code or title
   */
  async search(tenantId: string, query: string): Promise<CompetencyStandard[]> {
    const tenantClient = this.prisma.forTenant(tenantId);

    return tenantClient.competencyStandard.findMany({
      where: {
        OR: [
          { code: { contains: query, mode: 'insensitive' } },
          { title: { contains: query, mode: 'insensitive' } },
        ],
        status: 'ACTIVE',
      },
      include: {
        elements: {
          include: {
            criteria: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  /**
   * Get competency standard by code
   */
  async findByCode(
    tenantId: string,
    code: string,
    version?: string,
  ): Promise<CompetencyStandard> {
    const tenantClient = this.prisma.forTenant(tenantId);

    const where: any = {
      code,
      status: 'ACTIVE',
    };

    if (version) {
      where.version = version;
    }

    const standard = await tenantClient.competencyStandard.findFirst({
      where,
      include: {
        elements: {
          include: {
            criteria: true,
          },
          orderBy: { index: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' }, // Get latest version if not specified
    });

    if (!standard) {
      throw new NotFoundException(
        `Competency Standard ${code}${version ? ` v${version}` : ''} not found`,
      );
    }

    return standard;
  }

  /**
   * Get all competency standards for tenant
   */
  async findAll(tenantId: string): Promise<CompetencyStandard[]> {
    const tenantClient = this.prisma.forTenant(tenantId);

    return tenantClient.competencyStandard.findMany({
      where: { status: 'ACTIVE' },
      include: {
        _count: {
          select: {
            elements: true,
            courses: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  /**
   * Get coverage analysis for a standard
   * Returns criteria coverage across all courses
   */
  async getCoverage(tenantId: string, standardId: string) {
    const tenantClient = this.prisma.forTenant(tenantId);

    const standard = await tenantClient.competencyStandard.findUnique({
      where: { id: standardId },
      include: {
        elements: {
          include: {
            criteria: {
              include: {
                lessons: true,
              },
            },
          },
        },
      },
    });

    if (!standard) {
      throw new NotFoundException(`Standard with ID ${standardId} not found`);
    }

    // Calculate coverage
    const totalCriteria = standard.elements.reduce(
      (sum, element) => sum + element.criteria.length,
      0,
    );

    const coveredCriteria = standard.elements.reduce(
      (sum, element) =>
        sum + element.criteria.filter((c) => c.lessons.length > 0).length,
      0,
    );

    const coveragePercentage =
      totalCriteria > 0 ? (coveredCriteria / totalCriteria) * 100 : 0;

    return {
      standardId,
      code: standard.code,
      title: standard.title,
      totalCriteria,
      coveredCriteria,
      coveragePercentage: Math.round(coveragePercentage * 100) / 100,
      gaps: standard.elements.flatMap((element) =>
        element.criteria
          .filter((c) => c.lessons.length === 0)
          .map((c) => ({
            criterionId: c.id,
            code: c.code,
            text: c.text,
            elementTitle: element.title,
          })),
      ),
    };
  }
}
