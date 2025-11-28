import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { ProgressStatus, CourseEnrollmentStatus } from "@avala/db";

/**
 * ProgressService
 * Phase 3-A: Manages lesson progress tracking
 */
@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mark a lesson as viewed/in-progress
   * Sets viewedAt timestamp if not already set
   */
  async markLessonInProgress(
    tenantId: string,
    enrollmentId: string,
    lessonId: string,
  ) {
    const tenantClient = this.prisma.forTenant(tenantId);

    // Verify enrollment exists
    const enrollment = await tenantClient.courseEnrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      throw new NotFoundException(
        `Enrollment with ID ${enrollmentId} not found`,
      );
    }

    // Find or create progress record
    let progress = await tenantClient.lessonProgress.findUnique({
      where: {
        enrollmentId_lessonId: {
          enrollmentId,
          lessonId,
        },
      },
    });

    if (!progress) {
      // Create progress record if it doesn't exist
      progress = await tenantClient.lessonProgress.create({
        data: {
          enrollmentId,
          lessonId,
          status: ProgressStatus.IN_PROGRESS,
          viewedAt: new Date(),
        },
      });
    } else if (progress.status === ProgressStatus.NOT_STARTED) {
      // Update to IN_PROGRESS and set viewedAt
      progress = await tenantClient.lessonProgress.update({
        where: {
          enrollmentId_lessonId: {
            enrollmentId,
            lessonId,
          },
        },
        data: {
          status: ProgressStatus.IN_PROGRESS,
          viewedAt: progress.viewedAt || new Date(),
        },
      });
    } else if (!progress.viewedAt) {
      // Just set viewedAt if not already set
      progress = await tenantClient.lessonProgress.update({
        where: {
          enrollmentId_lessonId: {
            enrollmentId,
            lessonId,
          },
        },
        data: {
          viewedAt: new Date(),
        },
      });
    }

    return progress;
  }

  /**
   * Mark a lesson as completed
   * Automatically marks enrollment as COMPLETED if all lessons are done
   */
  async markLessonComplete(
    tenantId: string,
    enrollmentId: string,
    lessonId: string,
  ) {
    const tenantClient = this.prisma.forTenant(tenantId);

    // Verify enrollment exists
    const enrollment = await tenantClient.courseEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        progress: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException(
        `Enrollment with ID ${enrollmentId} not found`,
      );
    }

    // Update lesson progress to COMPLETED
    const progress = await tenantClient.lessonProgress.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId,
          lessonId,
        },
      },
      update: {
        status: ProgressStatus.COMPLETED,
        completedAt: new Date(),
      },
      create: {
        enrollmentId,
        lessonId,
        status: ProgressStatus.COMPLETED,
        completedAt: new Date(),
        viewedAt: new Date(),
      },
    });

    // Check if all lessons are now complete
    const allProgress = await tenantClient.lessonProgress.findMany({
      where: { enrollmentId },
    });

    const allComplete = allProgress.every(
      (p) => p.status === ProgressStatus.COMPLETED,
    );

    // Auto-complete enrollment if all lessons are done
    if (allComplete && enrollment.status !== CourseEnrollmentStatus.COMPLETED) {
      await tenantClient.courseEnrollment.update({
        where: { id: enrollmentId },
        data: {
          status: CourseEnrollmentStatus.COMPLETED,
          completedAt: new Date(),
        },
      });
    }

    return {
      progress,
      enrollmentCompleted: allComplete,
    };
  }

  /**
   * Mark a lesson as not started (reset progress)
   */
  async resetLessonProgress(
    tenantId: string,
    enrollmentId: string,
    lessonId: string,
  ) {
    const tenantClient = this.prisma.forTenant(tenantId);

    const progress = await tenantClient.lessonProgress.findUnique({
      where: {
        enrollmentId_lessonId: {
          enrollmentId,
          lessonId,
        },
      },
    });

    if (!progress) {
      throw new NotFoundException(
        `Progress record for lesson ${lessonId} in enrollment ${enrollmentId} not found`,
      );
    }

    return tenantClient.lessonProgress.update({
      where: {
        enrollmentId_lessonId: {
          enrollmentId,
          lessonId,
        },
      },
      data: {
        status: ProgressStatus.NOT_STARTED,
        completedAt: null,
        viewedAt: null,
      },
    });
  }

  /**
   * Get progress for a specific lesson
   */
  async getLessonProgress(
    tenantId: string,
    enrollmentId: string,
    lessonId: string,
  ) {
    const tenantClient = this.prisma.forTenant(tenantId);

    const progress = await tenantClient.lessonProgress.findUnique({
      where: {
        enrollmentId_lessonId: {
          enrollmentId,
          lessonId,
        },
      },
      include: {
        lesson: {
          include: {
            module: true,
          },
        },
      },
    });

    if (!progress) {
      throw new NotFoundException(
        `Progress record for lesson ${lessonId} in enrollment ${enrollmentId} not found`,
      );
    }

    return progress;
  }

  /**
   * Get next lesson to study
   * Returns the first NOT_STARTED or IN_PROGRESS lesson in order
   */
  async getNextLesson(tenantId: string, enrollmentId: string) {
    const tenantClient = this.prisma.forTenant(tenantId);

    const enrollment = await tenantClient.courseEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: {
                  orderBy: { order: "asc" },
                },
              },
              orderBy: { order: "asc" },
            },
          },
        },
        progress: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException(
        `Enrollment with ID ${enrollmentId} not found`,
      );
    }

    // Create progress map
    const progressMap = new Map(
      enrollment.progress.map((p) => [p.lessonId, p]),
    );

    // Find first incomplete lesson
    for (const module of enrollment.course.modules) {
      for (const lesson of module.lessons) {
        const progress = progressMap.get(lesson.id);
        if (
          !progress ||
          progress.status === ProgressStatus.NOT_STARTED ||
          progress.status === ProgressStatus.IN_PROGRESS
        ) {
          return {
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            moduleId: module.id,
            moduleTitle: module.title,
            progress: progress || null,
          };
        }
      }
    }

    // All lessons complete
    return null;
  }
}
