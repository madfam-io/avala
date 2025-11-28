import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { SearchEntityType, SearchResultItemDto } from '../dto/search.dto';
import { BaseSearchStrategy, SearchOptions } from './search-strategy.interface';

@Injectable()
export class CertificationSearchStrategy extends BaseSearchStrategy {
  readonly entityType = SearchEntityType.CERTIFICATION;

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
      OR: [{ serial: { contains: normalizedQuery, mode: 'insensitive' } }],
    };
    if (tenantId) where.tenantId = tenantId;

    const certs = await this.prisma.dC3.findMany({
      where,
      take: limit,
      include: {
        course: { select: { title: true, code: true } },
      },
    });

    const results = certs.map((cert) => ({
      id: cert.id,
      entityType: this.entityType,
      title: cert.serial,
      description: cert.course?.title,
      score: this.calculateScore(normalizedQuery, [
        cert.serial,
        cert.course?.title || '',
      ]),
      metadata: {
        status: cert.status,
        courseCode: cert.course?.code,
      },
      url: `/certifications/${cert.id}`,
      createdAt: cert.issuedAt,
    }));

    return this.applyDateFilter(results, options?.dateFilter);
  }
}

@Injectable()
export class SimulationSearchStrategy extends BaseSearchStrategy {
  readonly entityType = SearchEntityType.SIMULATION_SCENARIO;

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async search(
    query: string,
    _tenantId?: string,
    options?: SearchOptions,
  ): Promise<SearchResultItemDto[]> {
    const normalizedQuery = query.toLowerCase().trim();
    const limit = options?.limit || 20;

    const simulations = await this.prisma.eCSimulation.findMany({
      where: {
        OR: [
          { title: { contains: normalizedQuery, mode: 'insensitive' } },
          { code: { contains: normalizedQuery, mode: 'insensitive' } },
        ],
      },
      take: limit,
      include: {
        ec: { select: { code: true, title: true } },
      },
    });

    const results = simulations.map((sim) => ({
      id: sim.id,
      entityType: this.entityType,
      title: sim.title,
      description: sim.ec?.title,
      score: this.calculateScore(normalizedQuery, [sim.title, sim.code || '']),
      metadata: {
        type: sim.type,
        ecCode: sim.ec?.code,
      },
      url: `/simulations/${sim.id}`,
      createdAt: sim.createdAt,
    }));

    return this.applyDateFilter(results, options?.dateFilter);
  }
}

@Injectable()
export class DocumentSearchStrategy extends BaseSearchStrategy {
  readonly entityType = SearchEntityType.DOCUMENT;

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
      OR: [{ title: { contains: normalizedQuery, mode: 'insensitive' } }],
    };
    if (tenantId) where.tenantId = tenantId;

    const documents = await this.prisma.document.findMany({
      where,
      take: limit,
    });

    const results = documents.map((doc) => ({
      id: doc.id,
      entityType: this.entityType,
      title: doc.title || `Document ${doc.id.slice(0, 8)}`,
      description: undefined,
      score: this.calculateScore(normalizedQuery, [doc.title || '']),
      metadata: {
        status: doc.status,
      },
      url: `/documents/${doc.id}`,
      createdAt: doc.createdAt,
    }));

    return this.applyDateFilter(results, options?.dateFilter);
  }
}
