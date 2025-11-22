import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CourseEnrollmentStatus } from '@prisma/client';
import { MailService } from '../mail/mail.service';

/**
 * EnrollmentsService
 * Phase 3-A: Manages direct User-to-Course enrollments
 */
@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Enroll a user in a course (idempotent)
   * If already enrolled, returns existing enrollment
   */
  async enroll(tenantId: string, userId: string, courseId: string) {
    const tenantClient = this.prisma.forTenant(tenantId);

    // Verify course exists and is published
    const course = await tenantClient.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    // Check if already enrolled
    const existing = await tenantClient.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      include: {
        progress: true,
      },
    });

    if (existing) {
      return {
        enrollment: existing,
        isNew: false,
      };
    }

    // Create new enrollment
    const enrollment = await tenantClient.courseEnrollment.create({
      data: {
        userId,
        courseId,
        status: CourseEnrollmentStatus.IN_PROGRESS,
      },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: true,
              },
            },
          },
        },
      },
    });

    // Create initial progress records for all lessons (NOT_STARTED)
    const allLessons = course.modules.flatMap((module) => module.lessons);

    if (allLessons.length > 0) {
      await tenantClient.lessonProgress.createMany({
        data: allLessons.map((lesson) => ({
          enrollmentId: enrollment.id,
          lessonId: lesson.id,
        })),
      });
    }

    // Fetch complete enrollment with progress
    const completeEnrollment = await tenantClient.courseEnrollment.findUnique({
      where: { id: enrollment.id },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
          },
        },
        progress: {
          include: {
            lesson: {
              include: {
                module: true,
              },
            },
          },
        },
      },
    });

    // Send enrollment email (Phase 5: Production Readiness)
    try {
      await this.mailService.sendEnrollmentEmail({
        email: completeEnrollment.user.email,
        firstName: completeEnrollment.user.firstName || 'Usuario',
        courseTitle: course.title,
        courseCode: course.code,
        durationHours: course.durationHours || 0,
      });
    } catch (error) {
      // Log email error but don't fail enrollment
      console.error('Failed to send enrollment email:', error);
    }

    return {
      enrollment: completeEnrollment,
      isNew: true,
    };
  }

  /**
   * Get all courses a user is enrolled in
   * Returns with progress percentage and status
   */
  async getMyCourses(tenantId: string, userId: string) {
    const tenantClient = this.prisma.forTenant(tenantId);

    const enrollments = await tenantClient.courseEnrollment.findMany({
      where: {
        userId,
      },
      include: {
        course: {
          include: {
            modules: {
              include: {
                _count: {
                  select: { lessons: true },
                },
              },
            },
            _count: {
              select: { modules: true },
            },
          },
        },
        progress: {
          include: {
            lesson: true,
          },
        },
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    });

    return enrollments.map((enrollment) => {
      const totalLessons = enrollment.progress.length;
      const completedLessons = enrollment.progress.filter(
        (p) => p.status === 'COMPLETED',
      ).length;
      const inProgressLessons = enrollment.progress.filter(
        (p) => p.status === 'IN_PROGRESS',
      ).length;

      const progressPercentage =
        totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      return {
        enrollmentId: enrollment.id,
        courseId: enrollment.course.id,
        courseCode: enrollment.course.code,
        courseTitle: enrollment.course.title,
        courseDescription: enrollment.course.description,
        courseDurationHours: enrollment.course.durationHours,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
        progress: {
          totalLessons,
          completedLessons,
          inProgressLessons,
          notStartedLessons: totalLessons - completedLessons - inProgressLessons,
          percentage: progressPercentage,
        },
      };
    });
  }

  /**
   * Get detailed progress for a specific enrollment
   * Returns module/lesson hierarchy with completion status
   */
  async getEnrollmentProgress(tenantId: string, enrollmentId: string) {
    const tenantClient = this.prisma.forTenant(tenantId);

    const enrollment = await tenantClient.courseEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: {
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
        },
        progress: {
          include: {
            lesson: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException(
        `Enrollment with ID ${enrollmentId} not found`,
      );
    }

    // Create a map of lessonId -> progress
    const progressMap = new Map(
      enrollment.progress.map((p) => [p.lessonId, p]),
    );

    const modules = enrollment.course.modules.map((module) => {
      const lessons = module.lessons.map((lesson) => {
        const lessonProgress = progressMap.get(lesson.id);
        return {
          id: lesson.id,
          title: lesson.title,
          order: lesson.order,
          contentRef: lesson.contentRef,
          videoUrl: lesson.videoUrl,
          durationMin: lesson.durationMin,
          progress: lessonProgress
            ? {
                status: lessonProgress.status,
                completedAt: lessonProgress.completedAt,
                viewedAt: lessonProgress.viewedAt,
              }
            : {
                status: 'NOT_STARTED',
                completedAt: null,
                viewedAt: null,
              },
        };
      });

      const totalLessons = lessons.length;
      const completedLessons = lessons.filter(
        (l) => l.progress.status === 'COMPLETED',
      ).length;

      return {
        id: module.id,
        title: module.title,
        order: module.order,
        lessons,
        progress: {
          totalLessons,
          completedLessons,
          percentage:
            totalLessons > 0
              ? Math.round((completedLessons / totalLessons) * 100)
              : 0,
        },
      };
    });

    const totalLessons = enrollment.progress.length;
    const completedLessons = enrollment.progress.filter(
      (p) => p.status === 'COMPLETED',
    ).length;

    return {
      enrollmentId: enrollment.id,
      courseId: enrollment.course.id,
      courseTitle: enrollment.course.title,
      courseCode: enrollment.course.code,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
      progress: {
        totalLessons,
        completedLessons,
        percentage:
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0,
      },
      modules,
    };
  }

  /**
   * Unenroll a user from a course
   * This will cascade delete all lesson progress
   */
  async unenroll(tenantId: string, enrollmentId: string) {
    const tenantClient = this.prisma.forTenant(tenantId);

    const enrollment = await tenantClient.courseEnrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      throw new NotFoundException(
        `Enrollment with ID ${enrollmentId} not found`,
      );
    }

    await tenantClient.courseEnrollment.delete({
      where: { id: enrollmentId },
    });

    return {
      success: true,
      enrollmentId,
    };
  }
}
