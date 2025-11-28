import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { Portfolio, Artifact } from "@avala/db";

/**
 * PortfolioService
 * Manages evidence portfolios with tenant isolation
 */
@Injectable()
export class PortfolioService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all portfolios for a trainee
   */
  async findByTrainee(
    tenantId: string,
    traineeId: string,
  ): Promise<Portfolio[]> {
    const tenantClient = this.prisma.forTenant(tenantId);

    return tenantClient.portfolio.findMany({
      where: { traineeId },
      include: {
        artifacts: {
          include: {
            artifact: true,
          },
          orderBy: { order: "asc" },
        },
        trainee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get portfolio by ID
   */
  async findById(tenantId: string, portfolioId: string): Promise<Portfolio> {
    const tenantClient = this.prisma.forTenant(tenantId);

    const portfolio = await tenantClient.portfolio.findUnique({
      where: { id: portfolioId },
      include: {
        artifacts: {
          include: {
            artifact: {
              include: {
                trainee: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
                signer: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                  },
                },
              },
            },
          },
          orderBy: { order: "asc" },
        },
        trainee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    return portfolio;
  }

  /**
   * Create artifact with hash for integrity
   */
  async createArtifact(
    _tenantId: string,
    traineeId: string,
    data: {
      type: string;
      ref: string;
      hash: string;
      assessmentId?: string;
      signerId?: string;
      metadata?: any;
    },
  ): Promise<Artifact> {
    // Note: In production, hash should be calculated server-side
    // from the actual file content for security
    return this.prisma.artifact.create({
      data: {
        traineeId,
        type: data.type as any,
        ref: data.ref,
        hash: data.hash,
        assessmentId: data.assessmentId,
        signerId: data.signerId,
        signedAt: data.signerId ? new Date() : undefined,
        metadata: data.metadata || {},
      },
    });
  }

  /**
   * Add artifact to portfolio
   */
  async addArtifactToPortfolio(
    tenantId: string,
    portfolioId: string,
    artifactId: string,
    notes?: string,
  ) {
    const tenantClient = this.prisma.forTenant(tenantId);

    // Verify portfolio exists and belongs to tenant
    await this.findById(tenantId, portfolioId);

    // Get current max order
    const lastItem = await tenantClient.portfolioArtifact.findFirst({
      where: { portfolioId },
      orderBy: { order: "desc" },
    });

    const order = lastItem ? lastItem.order + 1 : 0;

    return tenantClient.portfolioArtifact.create({
      data: {
        portfolioId,
        artifactId,
        order,
        notes,
      },
      include: {
        artifact: true,
      },
    });
  }

  /**
   * Get portfolio export (for DC-3 or ECE/OC dictamen)
   */
  async exportPortfolio(tenantId: string, portfolioId: string) {
    // findById includes artifacts relation
    const portfolio = (await this.findById(tenantId, portfolioId)) as any;

    const artifacts = portfolio.artifacts || [];
    return {
      portfolio: {
        id: portfolio.id,
        title: portfolio.title,
        status: portfolio.status,
        trainee: portfolio.trainee,
        createdAt: portfolio.createdAt,
        updatedAt: portfolio.updatedAt,
      },
      artifacts: artifacts.map((pa: any) => ({
        id: pa.artifact.id,
        type: pa.artifact.type,
        ref: pa.artifact.ref,
        hash: pa.artifact.hash,
        signedBy: pa.artifact.signer,
        signedAt: pa.artifact.signedAt,
        metadata: pa.artifact.metadata,
        notes: pa.notes,
        order: pa.order,
      })),
      integrity: {
        totalArtifacts: artifacts.length,
        signedArtifacts: artifacts.filter((pa: any) => pa.artifact.signedAt)
          .length,
        exportedAt: new Date().toISOString(),
      },
    };
  }
}
