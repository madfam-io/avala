import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { SearchEntityType, SearchResultItemDto } from '../dto/search.dto';
import { BaseSearchStrategy, SearchOptions } from './search-strategy.interface';

@Injectable()
export class LessonSearchStrategy extends BaseSearchStrategy {
  readonly entityType = SearchEntityType.LESSON;

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
        { content: { contains: normalizedQuery, mode: 'insensitive' } },
      ],
    };
    if (tenantId) {
      where.module = { course: { tenantId } };
    }

    const lessons = await this.prisma.lesson.findMany({
      where,
      take: limit,
      include: {
        module: {
          select: {
            title: true,
            course: { select: { id: true, title: true } },
          },
        },
      },
    });

    const results = lessons.map((lesson) => ({
      id: lesson.id,
      entityType: this.entityType,
      title: lesson.title,
      description: lesson.content?.substring(0, 200) || undefined,
      score: this.calculateScore(normalizedQuery, [
        lesson.title,
        lesson.content || '',
      ]),
      metadata: {
        moduleTitle: lesson.module?.title,
        courseId: lesson.module?.course?.id,
        courseTitle: lesson.module?.course?.title,
      },
      url: `/courses/${lesson.module?.course?.id}/lessons/${lesson.id}`,
      createdAt: lesson.createdAt,
    }));

    return this.applyDateFilter(results, options?.dateFilter);
  }
}
