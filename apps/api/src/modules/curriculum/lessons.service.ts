import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Lesson } from '@avala/db';

export interface CreateLessonDto {
  title: string;
  order?: number;
  content?: string;
  videoUrl?: string;
  contentRef?: string;
  durationMin?: number;
}

export interface UpdateLessonDto {
  title?: string;
  order?: number;
  content?: string;
  videoUrl?: string;
  contentRef?: string;
  durationMin?: number;
}

export interface UpdateLessonContentDto {
  title?: string;
  content?: string;
  videoUrl?: string;
  durationMin?: number;
}

/**
 * LessonsService
 * Manages lessons within modules with ordering
 */
@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new lesson in a module
   * Auto-assigns order if not provided
   */
  async create(
    tenantId: string,
    moduleId: string,
    dto: CreateLessonDto,
  ): Promise<Lesson> {
    const tenantClient = this.prisma.forTenant(tenantId);

    // Verify module exists and get lesson count
    const module = await tenantClient.module.findUnique({
      where: { id: moduleId },
      include: {
        _count: { select: { lessons: true } },
      },
    });

    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    // Auto-assign order to end if not provided
    const order = dto.order !== undefined ? dto.order : module._count.lessons;

    return tenantClient.lesson.create({
      data: {
        title: dto.title,
        order,
        content: dto.content,
        videoUrl: dto.videoUrl,
        contentRef: dto.contentRef,
        durationMin: dto.durationMin,
        moduleId,
      },
    });
  }

  /**
   * Get all lessons for a module
   */
  async findByModule(tenantId: string, moduleId: string): Promise<Lesson[]> {
    const tenantClient = this.prisma.forTenant(tenantId);

    // Verify module exists
    const module = await tenantClient.module.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    return tenantClient.lesson.findMany({
      where: { moduleId },
      include: {
        _count: {
          select: { criteria: true },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Get a single lesson by ID
   */
  async findById(tenantId: string, lessonId: string): Promise<Lesson> {
    const tenantClient = this.prisma.forTenant(tenantId);

    const lesson = await tenantClient.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: true,
          },
        },
        _count: {
          select: { criteria: true },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    return lesson;
  }

  /**
   * Update a lesson
   */
  async update(
    tenantId: string,
    lessonId: string,
    dto: UpdateLessonDto,
  ): Promise<Lesson> {
    const tenantClient = this.prisma.forTenant(tenantId);

    // Verify lesson exists
    const existing = await tenantClient.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!existing) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    return tenantClient.lesson.update({
      where: { id: lessonId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.videoUrl !== undefined && { videoUrl: dto.videoUrl }),
        ...(dto.contentRef !== undefined && { contentRef: dto.contentRef }),
        ...(dto.durationMin !== undefined && { durationMin: dto.durationMin }),
      },
    });
  }

  /**
   * Update lesson content (title, content, videoUrl, duration)
   * Specialized method for content editing
   */
  async updateContent(
    tenantId: string,
    lessonId: string,
    dto: UpdateLessonContentDto,
  ): Promise<Lesson> {
    const tenantClient = this.prisma.forTenant(tenantId);

    // Verify lesson exists
    const existing = await tenantClient.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!existing) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    return tenantClient.lesson.update({
      where: { id: lessonId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.videoUrl !== undefined && { videoUrl: dto.videoUrl }),
        ...(dto.durationMin !== undefined && { durationMin: dto.durationMin }),
      },
      include: {
        _count: {
          select: { criteria: true },
        },
      },
    });
  }

  /**
   * Delete a lesson
   */
  async delete(tenantId: string, lessonId: string): Promise<Lesson> {
    const tenantClient = this.prisma.forTenant(tenantId);

    const lesson = await tenantClient.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    return tenantClient.lesson.delete({
      where: { id: lessonId },
    });
  }

  /**
   * Reorder lessons in a module
   */
  async reorder(
    tenantId: string,
    moduleId: string,
    lessonOrders: { id: string; order: number }[],
  ): Promise<Lesson[]> {
    const tenantClient = this.prisma.forTenant(tenantId);

    // Verify module exists
    const module = await tenantClient.module.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    // Update each lesson's order in a transaction
    await tenantClient.$transaction(
      lessonOrders.map(({ id, order }) =>
        tenantClient.lesson.update({
          where: { id },
          data: { order },
        }),
      ),
    );

    // Return updated lessons
    return this.findByModule(tenantId, moduleId);
  }
}
