import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * CompetencyMappingService
 * Manages lesson-to-criteria mappings for EC alignment
 */
@Injectable()
export class CompetencyMappingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all available criteria for a course
   * Returns the full hierarchy: Standards -> Elements -> Criteria
   */
  async getAvailableCriteria(tenantId: string, courseId: string) {
    const tenantClient = this.prisma.forTenant(tenantId);

    // Get course with its standards
    const course = await tenantClient.course.findUnique({
      where: { id: courseId },
      include: {
        standards: {
          include: {
            elements: {
              include: {
                criteria: true,
              },
              orderBy: { index: 'asc' },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    return {
      courseId: course.id,
      courseTitle: course.title,
      standards: course.standards.map((standard) => ({
        id: standard.id,
        code: standard.code,
        title: standard.title,
        elements: standard.elements.map((element) => ({
          id: element.id,
          index: element.index,
          title: element.title,
          criteria: element.criteria.map((criterion) => ({
            id: criterion.id,
            type: criterion.type,
            code: criterion.code,
            text: criterion.text,
          })),
        })),
      })),
    };
  }

  /**
   * Get current mappings for a lesson
   * Returns array of criterion IDs that are mapped to this lesson
   */
  async getLessonMapping(tenantId: string, lessonId: string) {
    const tenantClient = this.prisma.forTenant(tenantId);

    const lesson = await tenantClient.lesson.findUnique({
      where: { id: lessonId },
      include: {
        criteria: {
          include: {
            criterion: {
              include: {
                element: {
                  include: {
                    standard: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    return {
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      mappedCriteria: lesson.criteria.map((lc) => ({
        id: lc.criterion.id,
        code: lc.criterion.code,
        text: lc.criterion.text,
        type: lc.criterion.type,
        element: {
          id: lc.criterion.element.id,
          title: lc.criterion.element.title,
        },
        standard: {
          id: lc.criterion.element.standard.id,
          code: lc.criterion.element.standard.code,
        },
      })),
      criteriaIds: lesson.criteria.map((lc) => lc.criterion.id),
    };
  }

  /**
   * Toggle a criterion mapping for a lesson
   * If mapping exists, removes it. If not, adds it.
   */
  async toggleMapping(
    tenantId: string,
    lessonId: string,
    criterionId: string,
  ) {
    const tenantClient = this.prisma.forTenant(tenantId);

    // Verify lesson exists
    const lesson = await tenantClient.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    // Verify criterion exists
    const criterion = await tenantClient.criterion.findUnique({
      where: { id: criterionId },
    });

    if (!criterion) {
      throw new NotFoundException(`Criterion with ID ${criterionId} not found`);
    }

    // Check if mapping already exists
    const existing = await tenantClient.lessonCriterion.findFirst({
      where: {
        lessonId,
        criterionId,
      },
    });

    if (existing) {
      // Remove mapping
      await tenantClient.lessonCriterion.delete({
        where: { id: existing.id },
      });
      return {
        action: 'removed',
        lessonId,
        criterionId,
      };
    } else {
      // Add mapping
      await tenantClient.lessonCriterion.create({
        data: {
          lessonId,
          criterionId,
        },
      });
      return {
        action: 'added',
        lessonId,
        criterionId,
      };
    }
  }

  /**
   * Set multiple mappings for a lesson at once
   * Replaces all existing mappings with the new set
   */
  async setLessonMappings(
    tenantId: string,
    lessonId: string,
    criteriaIds: string[],
  ) {
    const tenantClient = this.prisma.forTenant(tenantId);

    // Verify lesson exists
    const lesson = await tenantClient.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    // Use transaction to delete old and create new mappings
    await tenantClient.$transaction([
      // Delete all existing mappings
      tenantClient.lessonCriterion.deleteMany({
        where: { lessonId },
      }),
      // Create new mappings
      ...criteriaIds.map((criterionId) =>
        tenantClient.lessonCriterion.create({
          data: {
            lessonId,
            criterionId,
          },
        }),
      ),
    ]);

    return {
      lessonId,
      criteriaIds,
      count: criteriaIds.length,
    };
  }

  /**
   * Get mapping statistics for a course
   * Shows how many lessons are mapped to each criterion
   */
  async getCourseMappingStats(tenantId: string, courseId: string) {
    const tenantClient = this.prisma.forTenant(tenantId);

    const course = await tenantClient.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: {
              include: {
                criteria: {
                  include: {
                    criterion: true,
                  },
                },
              },
            },
          },
        },
        standards: {
          include: {
            elements: {
              include: {
                criteria: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    // Count total lessons
    const totalLessons = course.modules.reduce(
      (sum, m) => sum + m.lessons.length,
      0,
    );

    // Count lessons with mappings
    const mappedLessons = course.modules.reduce(
      (sum, m) =>
        sum + m.lessons.filter((l) => l.criteria.length > 0).length,
      0,
    );

    // Count total criteria available
    const totalCriteria = course.standards.reduce(
      (sum, s) =>
        sum + s.elements.reduce((eSum, e) => eSum + e.criteria.length, 0),
      0,
    );

    // Count mapped criteria (unique)
    const mappedCriteriaSet = new Set<string>();
    course.modules.forEach((m) => {
      m.lessons.forEach((l) => {
        l.criteria.forEach((lc) => {
          mappedCriteriaSet.add(lc.criterion.id);
        });
      });
    });

    const coveragePercentage =
      totalCriteria > 0
        ? Math.round((mappedCriteriaSet.size / totalCriteria) * 100)
        : 0;

    return {
      courseId,
      totalLessons,
      mappedLessons,
      unmappedLessons: totalLessons - mappedLessons,
      totalCriteria,
      mappedCriteria: mappedCriteriaSet.size,
      unmappedCriteria: totalCriteria - mappedCriteriaSet.size,
      coveragePercentage,
    };
  }
}
