import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { SearchEntityType, SearchResultItemDto } from '../dto/search.dto';
import { BaseSearchStrategy, SearchOptions } from './search-strategy.interface';

@Injectable()
export class CourseSearchStrategy extends BaseSearchStrategy {
  readonly entityType = SearchEntityType.COURSE;

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
        { title: { contains: normalizedQuery, mode: 'insensitive' } },
        { description: { contains: normalizedQuery, mode: 'insensitive' } },
        { code: { contains: normalizedQuery, mode: 'insensitive' } },
      ],
    };
    if (tenantId) where.tenantId = tenantId;

    const courses = await this.prisma.course.findMany({
      where,
      take: limit,
      include: {
        standards: { select: { code: true, title: true }, take: 1 },
      },
    });

    const results = courses.map((course) => ({
      id: course.id,
      entityType: this.entityType,
      title: course.title,
      description: course.description || undefined,
      score: this.calculateScore(normalizedQuery, [
        course.title,
        course.description || '',
        course.code || '',
      ]),
      metadata: {
        code: course.code,
        ecStandard: course.standards?.[0]?.code,
        status: course.status,
      },
      url: `/courses/${course.id}`,
      createdAt: course.createdAt,
    }));

    return this.applyDateFilter(results, options?.dateFilter);
  }
}
