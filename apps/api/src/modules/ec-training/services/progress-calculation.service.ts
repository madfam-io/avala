import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ProgressStatus, ECEnrollmentStatus } from '@avala/db';
import { ErrorFactory } from '../../../common/errors';

export interface ProgressResult {
  overallProgress: number;
  status: string;
}

export interface ProgressSummary {
  enrollmentId: string;
  ecCode: string;
  overallProgress: number;
  status: string;
  modulesCompleted: number;
  modulesTotal: number;
  lessonsCompleted: number;
  lessonsTotal: number;
  videosWatched: number;
  videosTotal: number;
  assessmentsPassed: number;
  assessmentsTotal: number;
  documentsCompleted: number;
  documentsTotal: number;
  estimatedTimeRemaining: number;
  timeSpent: number;
  nextLesson: { id: string; moduleId: string; title: string } | null;
  certificationReady: boolean;
}

/**
 * ProgressCalculationService
 * Handles all progress calculation logic for EC enrollments
 */
@Injectable()
export class ProgressCalculationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Recalculate all progress for an enrollment
   */
  async recalculateProgress(enrollmentId: string): Promise<ProgressResult> {
    const enrollment = await this.prisma.eCEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        ec: {
          include: {
            modules: {
              include: { lessons: true },
            },
          },
        },
        moduleProgress: true,
        lessonProgress: true,
      },
    });

    if (!enrollment) {
      throw ErrorFactory.enrollmentNotFound(enrollmentId);
    }

    // Recalculate each module's progress
    await this.recalculateModuleProgress(enrollment);

    // Recalculate overall progress
    return this.recalculateOverallProgress(enrollment);
  }

  /**
   * Recalculate progress for each module based on lesson completion
   */
  private async recalculateModuleProgress(enrollment: {
    id: string;
    ec: {
      modules: Array<{
        id: string;
        lessons: Array<{ id: string }>;
      }>;
    };
    lessonProgress: Array<{
      lessonId: string;
      status: ProgressStatus;
    }>;
  }): Promise<void> {
    for (const module of enrollment.ec.modules) {
      const moduleLessons = module.lessons;
      const moduleProgress = enrollment.lessonProgress.filter((lp) =>
        moduleLessons.some((l) => l.id === lp.lessonId),
      );

      const completedLessons = moduleProgress.filter(
        (lp) => lp.status === 'COMPLETED',
      ).length;

      const progress =
        moduleLessons.length > 0
          ? Math.round((completedLessons / moduleLessons.length) * 100)
          : 0;

      const status: ProgressStatus = this.calculateStatus(progress);

      await this.prisma.eCModuleProgress.update({
        where: {
          enrollmentId_moduleId: {
            enrollmentId: enrollment.id,
            moduleId: module.id,
          },
        },
        data: {
          progress,
          status,
          completedAt: status === 'COMPLETED' ? new Date() : undefined,
        },
      });
    }
  }

  /**
   * Recalculate overall enrollment progress
   */
  private async recalculateOverallProgress(enrollment: {
    id: string;
    status: ECEnrollmentStatus;
    completedAt: Date | null;
    ec: {
      modules: Array<{ lessons: Array<{ id: string }> }>;
    };
    lessonProgress: Array<{ status: ProgressStatus }>;
  }): Promise<ProgressResult> {
    const totalLessons = enrollment.ec.modules.reduce(
      (acc, m) => acc + m.lessons.length,
      0,
    );
    const completedLessons = enrollment.lessonProgress.filter(
      (lp) => lp.status === 'COMPLETED',
    ).length;

    const overallProgress =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

    let enrollmentStatus = enrollment.status;
    if (overallProgress === 100 && enrollmentStatus === 'IN_PROGRESS') {
      enrollmentStatus = 'COMPLETED';
    }

    await this.prisma.eCEnrollment.update({
      where: { id: enrollment.id },
      data: {
        overallProgress,
        status: enrollmentStatus,
        completedAt:
          enrollmentStatus === 'COMPLETED' ? new Date() : enrollment.completedAt,
      },
    });

    return { overallProgress, status: enrollmentStatus };
  }

  /**
   * Get comprehensive progress summary
   */
  async getProgressSummary(enrollmentId: string): Promise<ProgressSummary> {
    const enrollment = await this.prisma.eCEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        ec: {
          include: {
            modules: {
              include: {
                lessons: true,
                assessments: true,
              },
            },
            templates: true,
          },
        },
        moduleProgress: true,
        lessonProgress: true,
        documents: true,
        assessmentAttempts: true,
      },
    });

    if (!enrollment) {
      throw ErrorFactory.enrollmentNotFound(enrollmentId);
    }

    const counts = this.calculateCounts(enrollment);
    const timeEstimates = this.calculateTimeEstimates(enrollment);
    const nextLesson = this.findNextLesson(enrollment);
    const certificationReady = this.checkCertificationReadiness(counts);

    return {
      enrollmentId,
      ecCode: enrollment.ec.code,
      overallProgress: enrollment.overallProgress,
      status: enrollment.status,
      ...counts,
      ...timeEstimates,
      nextLesson,
      certificationReady,
    };
  }

  /**
   * Calculate all completion counts
   */
  private calculateCounts(enrollment: {
    ec: {
      modules: Array<{
        id: string;
        lessons: Array<{ id: string; videoId: string | null }>;
        assessments: Array<{ id: string }>;
      }>;
      templates: Array<{ id: string }>;
    };
    moduleProgress: Array<{ status: ProgressStatus }>;
    lessonProgress: Array<{
      lessonId: string;
      status: ProgressStatus;
      videoProgress: number;
    }>;
    documents: Array<{ isComplete: boolean }>;
    assessmentAttempts: Array<{ passed: boolean | null }>;
  }) {
    const modulesTotal = enrollment.ec.modules.length;
    const modulesCompleted = enrollment.moduleProgress.filter(
      (mp) => mp.status === 'COMPLETED',
    ).length;

    const lessonsTotal = enrollment.ec.modules.reduce(
      (acc, m) => acc + m.lessons.length,
      0,
    );
    const lessonsCompleted = enrollment.lessonProgress.filter(
      (lp) => lp.status === 'COMPLETED',
    ).length;

    const videosTotal = enrollment.ec.modules.reduce(
      (acc, m) => acc + m.lessons.filter((l) => l.videoId).length,
      0,
    );
    const videosWatched = enrollment.lessonProgress.filter(
      (lp) =>
        lp.videoProgress >= 90 &&
        enrollment.ec.modules.some((m) =>
          m.lessons.some((l) => l.id === lp.lessonId && l.videoId),
        ),
    ).length;

    const assessmentsTotal = enrollment.ec.modules.reduce(
      (acc, m) => acc + m.assessments.length,
      0,
    );
    const assessmentsPassed = enrollment.assessmentAttempts.filter(
      (a) => a.passed === true,
    ).length;

    const documentsTotal = enrollment.ec.templates.length;
    const documentsCompleted = enrollment.documents.filter(
      (d) => d.isComplete,
    ).length;

    return {
      modulesCompleted,
      modulesTotal,
      lessonsCompleted,
      lessonsTotal,
      videosWatched,
      videosTotal,
      assessmentsPassed,
      assessmentsTotal,
      documentsCompleted,
      documentsTotal,
    };
  }

  /**
   * Calculate time estimates
   */
  private calculateTimeEstimates(enrollment: {
    ec: {
      modules: Array<{ id: string; estimatedMinutes: number }>;
    };
    moduleProgress: Array<{
      moduleId: string;
      status: ProgressStatus;
    }>;
  }) {
    const totalMinutes = enrollment.ec.modules.reduce(
      (acc, m) => acc + m.estimatedMinutes,
      0,
    );

    const completedMinutes = enrollment.moduleProgress
      .filter((mp) => mp.status === 'COMPLETED')
      .reduce((acc, mp) => {
        const module = enrollment.ec.modules.find((m) => m.id === mp.moduleId);
        return acc + (module?.estimatedMinutes || 0);
      }, 0);

    return {
      estimatedTimeRemaining: totalMinutes - completedMinutes,
      timeSpent: completedMinutes,
    };
  }

  /**
   * Find the next lesson to continue
   */
  private findNextLesson(enrollment: {
    ec: {
      modules: Array<{
        id: string;
        lessons: Array<{ id: string; title: string }>;
      }>;
    };
    moduleProgress: Array<{
      moduleId: string;
      status: ProgressStatus;
    }>;
    lessonProgress: Array<{
      lessonId: string;
      status: ProgressStatus;
    }>;
  }): { id: string; moduleId: string; title: string } | null {
    for (const module of enrollment.ec.modules) {
      const moduleProgress = enrollment.moduleProgress.find(
        (mp) => mp.moduleId === module.id,
      );

      if (moduleProgress?.status !== 'COMPLETED') {
        const incompleteLessons = module.lessons.filter((lesson) => {
          const lessonProgress = enrollment.lessonProgress.find(
            (lp) => lp.lessonId === lesson.id,
          );
          return lessonProgress?.status !== 'COMPLETED';
        });

        if (incompleteLessons.length > 0) {
          return {
            id: incompleteLessons[0].id,
            moduleId: module.id,
            title: incompleteLessons[0].title,
          };
        }
      }
    }

    return null;
  }

  /**
   * Check if user is ready for certification
   */
  private checkCertificationReadiness(counts: {
    modulesCompleted: number;
    modulesTotal: number;
    assessmentsPassed: number;
    assessmentsTotal: number;
    documentsCompleted: number;
    documentsTotal: number;
  }): boolean {
    return (
      counts.modulesCompleted === counts.modulesTotal &&
      counts.assessmentsPassed >= counts.assessmentsTotal * 0.8 &&
      counts.documentsCompleted >= counts.documentsTotal * 0.8
    );
  }

  /**
   * Helper to calculate status from progress percentage
   */
  private calculateStatus(progress: number): ProgressStatus {
    if (progress === 100) return 'COMPLETED';
    if (progress > 0) return 'IN_PROGRESS';
    return 'NOT_STARTED';
  }
}
