import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { SearchEntityType, SearchResultItemDto } from '../dto/search.dto';
import { BaseSearchStrategy, SearchOptions } from './search-strategy.interface';

@Injectable()
export class ECEnrollmentSearchStrategy extends BaseSearchStrategy {
  readonly entityType = SearchEntityType.EC_ENROLLMENT;

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async search(
    query: string,
    tenantId?: string,
    options?: SearchOptions,
  ): Promise<SearchResultItemDto[]> {
    const normalizedQuery = query.toLowerCase().trim();
    const limit = options?.limit || 20;

    const where: Record<string, unknown> = {
      OR: [
        { ec: { code: { contains: normalizedQuery, mode: 'insensitive' } } },
        { ec: { title: { contains: normalizedQuery, mode: 'insensitive' } } },
      ],
    };
    if (tenantId) where.tenantId = tenantId;

    const enrollments = await this.prisma.eCEnrollment.findMany({
      where,
      take: limit,
      include: {
        ec: { select: { id: true, code: true, title: true } },
      },
    });

    const results = enrollments.map((enrollment) => ({
      id: enrollment.id,
      entityType: this.entityType,
      title: `Enrollment - ${enrollment.ec?.code}`,
      description: enrollment.ec?.title,
      score: this.calculateScore(normalizedQuery, [
        enrollment.ec?.code || '',
        enrollment.ec?.title || '',
      ]),
      metadata: {
        userId: enrollment.userId,
        ecId: enrollment.ecId,
        status: enrollment.status,
        progress: enrollment.overallProgress,
      },
      url: `/enrollments/${enrollment.id}`,
      createdAt: enrollment.enrolledAt,
    }));

    return this.applyDateFilter(results, options?.dateFilter);
  }
}
