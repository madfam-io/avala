import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Module, Prisma } from '@avala/db';

export interface CreateModuleDto {
  title: string;
  order?: number;
}

export interface UpdateModuleDto {
  title?: string;
  order?: number;
}

/**
 * ModulesService
 * Manages course modules (chapters/sections) with ordering
 */
@Injectable()
export class ModulesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new module in a course
   * Auto-assigns order if not provided
   */
  async create(
    tenantId: string,
    courseId: string,
    dto: CreateModuleDto,
  ): Promise<Module> {
    const tenantClient = this.prisma.forTenant(tenantId);

    // Verify course exists and belongs to tenant
    const course = await tenantClient.course.findUnique({
      where: { id: courseId },
      include: { _count: { select: { modules: true } } },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    // Auto-assign order to end if not provided
    const order = dto.order !== undefined ? dto.order : course._count.modules;

    return tenantClient.module.create({
      data: {
        title: dto.title,
        order,
        courseId,
      },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  /**
   * Get all modules for a course
   */
  async findByCourse(tenantId: string, courseId: string): Promise<Module[]> {
    const tenantClient = this.prisma.forTenant(tenantId);

    // Verify course exists
    const course = await tenantClient.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    return tenantClient.module.findMany({
      where: { courseId },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { lessons: true },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Get a single module by ID
   */
  async findById(tenantId: string, moduleId: string): Promise<Module> {
    const tenantClient = this.prisma.forTenant(tenantId);

    const module = await tenantClient.module.findUnique({
      where: { id: moduleId },
      include: {
        course: true,
        lessons: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    return module;
  }

  /**
   * Update a module
   */
  async update(
    tenantId: string,
    moduleId: string,
    dto: UpdateModuleDto,
  ): Promise<Module> {
    const tenantClient = this.prisma.forTenant(tenantId);

    // Verify module exists
    const existing = await tenantClient.module.findUnique({
      where: { id: moduleId },
    });

    if (!existing) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    return tenantClient.module.update({
      where: { id: moduleId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.order !== undefined && { order: dto.order }),
      },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  /**
   * Delete a module (cascade deletes lessons)
   */
  async delete(tenantId: string, moduleId: string): Promise<Module> {
    const tenantClient = this.prisma.forTenant(tenantId);

    const module = await tenantClient.module.findUnique({
      where: { id: moduleId },
      include: {
        _count: { select: { lessons: true } },
      },
    });

    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    // Delete will cascade to lessons due to schema
    return tenantClient.module.delete({
      where: { id: moduleId },
    });
  }

  /**
   * Reorder modules in a course
   */
  async reorder(
    tenantId: string,
    courseId: string,
    moduleOrders: { id: string; order: number }[],
  ): Promise<Module[]> {
    const tenantClient = this.prisma.forTenant(tenantId);

    // Verify course exists
    const course = await tenantClient.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    // Update each module's order in a transaction
    await tenantClient.$transaction(
      moduleOrders.map(({ id, order }) =>
        tenantClient.module.update({
          where: { id },
          data: { order },
        }),
      ),
    );

    // Return updated modules
    return this.findByCourse(tenantId, courseId);
  }
}
