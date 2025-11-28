import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { SearchEntityType, SearchResultItemDto } from '../dto/search.dto';
import { BaseSearchStrategy, SearchOptions } from './search-strategy.interface';

@Injectable()
export class UserSearchStrategy extends BaseSearchStrategy {
  readonly entityType = SearchEntityType.USER;

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
        { firstName: { contains: normalizedQuery, mode: 'insensitive' } },
        { lastName: { contains: normalizedQuery, mode: 'insensitive' } },
        { email: { contains: normalizedQuery, mode: 'insensitive' } },
      ],
    };
    if (tenantId) where.tenantId = tenantId;

    const users = await this.prisma.user.findMany({
      where,
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const results = users.map((user) => {
      const fullName =
        [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
      return {
        id: user.id,
        entityType: this.entityType,
        title: fullName,
        description: `${user.role} - ${user.email}`,
        score: this.calculateScore(normalizedQuery, [
          user.firstName || '',
          user.lastName || '',
          user.email,
        ]),
        metadata: { role: user.role },
        url: `/admin/users/${user.id}`,
        createdAt: user.createdAt,
      };
    });

    return this.applyDateFilter(results, options?.dateFilter);
  }
}
