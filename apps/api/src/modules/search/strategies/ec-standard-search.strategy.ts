import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { SearchEntityType, SearchResultItemDto } from '../dto/search.dto';
import { BaseSearchStrategy, SearchOptions } from './search-strategy.interface';

@Injectable()
export class ECStandardSearchStrategy extends BaseSearchStrategy {
  readonly entityType = SearchEntityType.EC_STANDARD;

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
        { code: { contains: normalizedQuery, mode: 'insensitive' } },
        { title: { contains: normalizedQuery, mode: 'insensitive' } },
        { description: { contains: normalizedQuery, mode: 'insensitive' } },
      ],
    };
    if (tenantId) where.tenantId = tenantId;

    const standards = await this.prisma.eCStandard.findMany({
      where,
      take: limit,
    });

    const results = standards.map((standard) => ({
      id: standard.id,
      entityType: this.entityType,
      title: `${standard.code} - ${standard.title}`,
      description: standard.description || undefined,
      score: this.calculateScore(normalizedQuery, [
        standard.code,
        standard.title,
        standard.description || '',
      ]),
      metadata: {
        code: standard.code,
        sector: standard.sector,
        status: standard.status,
      },
      url: `/ec-standards/${standard.id}`,
      createdAt: standard.createdAt,
    }));

    return this.applyDateFilter(results, options?.dateFilter);
  }
}
