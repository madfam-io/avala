import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Course, CourseStatus, Prisma } from '@avala/db';

export interface CreateCourseDto {
  code: string;
  title: string;
  description?: string;
  durationHours: number;
  competencyStandardIds?: string[];
  ownerId: string;
}

export interface UpdateCourseDto {
  code?: string;
  title?: string;
  description?: string;
  durationHours?: number;
  status?: CourseStatus;
  competencyStandardIds?: string[];
}

/**
 * CoursesService
 * Manages courses with EC alignment and DC-3 compliance
 */
@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new course
   */
  async create(tenantId: string, dto: CreateCourseDto): Promise<Course> {
    const tenantClient = this.prisma.forTenant(tenantId);

    // Check if course code already exists
    const existing = await tenantClient.course.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`Course with code ${dto.code} already exists`);
    }

    // Prepare course data
    const courseData: Prisma.CourseCreateInput = {
      code: dto.code,
      title: dto.title,
      description: dto.description,
      durationHours: dto.durationHours,
      tenant: {
        connect: { id: tenantId },
      },
      owner: {
        connect: { id: dto.ownerId },
      },
    };

    // Connect to competency standards if provided
    if (dto.competencyStandardIds && dto.competencyStandardIds.length > 0) {
      courseData.standards = {
        connect: dto.competencyStandardIds.map((id) => ({ id })),
      };
    }

    return tenantClient.course.create({
      data: courseData,
      include: {
        standards: true,
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get all courses for tenant
   */
  async findAll(tenantId: string): Promise<Course[]> {
    const tenantClient = this.prisma.forTenant(tenantId);

    return tenantClient.course.findMany({
      where: {
        status: {
          not: 'ARCHIVED',
        },
      },
      include: {
        standards: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            modules: true,
            assessments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get course by ID
   */
  async findById(tenantId: string, id: string): Promise<Course> {
    const tenantClient = this.prisma.forTenant(tenantId);

    const course = await tenantClient.course.findUnique({
      where: { id },
      include: {
        standards: {
          select: {
            id: true,
            code: true,
            title: true,
            version: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        modules: {
          include: {
            lessons: true,
          },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            assessments: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    return course;
  }

  /**
   * Get course by code
   */
  async findByCode(tenantId: string, code: string): Promise<Course> {
    const tenantClient = this.prisma.forTenant(tenantId);

    const course = await tenantClient.course.findUnique({
      where: { code },
      include: {
        standards: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with code ${code} not found`);
    }

    return course;
  }

  /**
   * Update course
   */
  async update(
    tenantId: string,
    id: string,
    dto: UpdateCourseDto,
  ): Promise<Course> {
    const tenantClient = this.prisma.forTenant(tenantId);

    // Check if course exists
    const existing = await tenantClient.course.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    // If updating code, check for conflicts
    if (dto.code && dto.code !== existing.code) {
      const codeConflict = await tenantClient.course.findUnique({
        where: { code: dto.code },
      });

      if (codeConflict) {
        throw new ConflictException(`Course with code ${dto.code} already exists`);
      }
    }

    // Prepare update data
    const updateData: Prisma.CourseUpdateInput = {
      ...(dto.code && { code: dto.code }),
      ...(dto.title && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.durationHours && { durationHours: dto.durationHours }),
      ...(dto.status && { status: dto.status }),
    };

    // Handle competency standards update
    if (dto.competencyStandardIds !== undefined) {
      updateData.standards = {
        set: dto.competencyStandardIds.map((id) => ({ id })),
      };
    }

    // Update publishedAt when status changes to PUBLISHED
    if (dto.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
      updateData.publishedAt = new Date();
    }

    return tenantClient.course.update({
      where: { id },
      data: updateData,
      include: {
        standards: true,
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Delete (archive) course
   */
  async delete(tenantId: string, id: string): Promise<Course> {
    const tenantClient = this.prisma.forTenant(tenantId);

    const course = await tenantClient.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    return tenantClient.course.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }

  /**
   * Search courses by title or code
   */
  async search(tenantId: string, query: string): Promise<Course[]> {
    const tenantClient = this.prisma.forTenant(tenantId);

    return tenantClient.course.findMany({
      where: {
        AND: [
          {
            status: {
              not: 'ARCHIVED',
            },
          },
          {
            OR: [
              { code: { contains: query, mode: 'insensitive' } },
              { title: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      include: {
        standards: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get course curriculum (modules and lessons tree)
   */
  async getCurriculum(tenantId: string, courseId: string) {
    const tenantClient = this.prisma.forTenant(tenantId);

    const course = await tenantClient.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: {
              orderBy: { order: 'asc' },
            },
            _count: {
              select: { lessons: true },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    return {
      courseId: course.id,
      courseTitle: course.title,
      moduleCount: course.modules.length,
      lessonCount: course.modules.reduce((sum, m) => sum + m.lessons.length, 0),
      modules: course.modules,
    };
  }
}
