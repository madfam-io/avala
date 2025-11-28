import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, ProgressStatus, ECEnrollmentStatus } from '@avala/db';
import {
  CreateECEnrollmentDto,
  ECEnrollmentQueryDto,
  UserEnrollmentQueryDto,
  UpdateLessonProgressDto,
  UpdateModuleProgressDto,
  VideoProgressDto,
} from './dto/ec-enrollment.dto';

@Injectable()
export class ECTrainingService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // ENROLLMENTS
  // ============================================

  async enrollUser(dto: CreateECEnrollmentDto) {
    // Find the EC standard
    const ec = await this.prisma.eCStandard.findUnique({
      where: { code: dto.ecCode },
      include: {
        modules: {
          include: { lessons: true },
        },
      },
    });

    if (!ec) {
      throw new NotFoundException(`EC Standard ${dto.ecCode} not found`);
    }

    if (ec.status !== 'PUBLISHED') {
      throw new BadRequestException(`EC Standard ${dto.ecCode} is not published`);
    }

    // Check for existing enrollment
    const existing = await this.prisma.eCEnrollment.findUnique({
      where: {
        userId_ecId: {
          userId: dto.userId,
          ecId: ec.id,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`User is already enrolled in ${dto.ecCode}`);
    }

    // Create enrollment with progress records
    const enrollment = await this.prisma.eCEnrollment.create({
      data: {
        userId: dto.userId,
        ecId: ec.id,
        tenantId: dto.tenantId,
        status: 'IN_PROGRESS',
        overallProgress: 0,
      },
    });

    // Initialize module progress
    const moduleProgressData = ec.modules.map((module) => ({
      enrollmentId: enrollment.id,
      moduleId: module.id,
      progress: 0,
      status: 'NOT_STARTED' as ProgressStatus,
    }));

    if (moduleProgressData.length > 0) {
      await this.prisma.eCModuleProgress.createMany({
        data: moduleProgressData,
      });
    }

    // Initialize lesson progress
    const lessonProgressData: Prisma.ECLessonProgressCreateManyInput[] = [];
    for (const module of ec.modules) {
      for (const lesson of module.lessons) {
        lessonProgressData.push({
          enrollmentId: enrollment.id,
          lessonId: lesson.id,
          status: 'NOT_STARTED',
          videoProgress: 0,
        });
      }
    }

    if (lessonProgressData.length > 0) {
      await this.prisma.eCLessonProgress.createMany({
        data: lessonProgressData,
      });
    }

    return this.findEnrollmentById(enrollment.id);
  }

  async findAllEnrollments(query: ECEnrollmentQueryDto) {
    const { ecCode, tenantId, status, page = 1, limit = 20 } = query;

    const where: Prisma.ECEnrollmentWhereInput = {};

    if (ecCode) {
      const ec = await this.prisma.eCStandard.findUnique({
        where: { code: ecCode },
      });
      if (ec) {
        where.ecId = ec.id;
      }
    }

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (status) {
      where.status = status as ECEnrollmentStatus;
    }

    const [data, total] = await Promise.all([
      this.prisma.eCEnrollment.findMany({
        where,
        include: {
          ec: {
            select: {
              code: true,
              title: true,
              description: true,
              estimatedHours: true,
            },
          },
        },
        orderBy: { enrolledAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.eCEnrollment.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findUserEnrollments(userId: string, query: UserEnrollmentQueryDto) {
    const { status, includeProgress } = query;

    const where: Prisma.ECEnrollmentWhereInput = { userId };

    if (status) {
      where.status = status as ECEnrollmentStatus;
    }

    return this.prisma.eCEnrollment.findMany({
      where,
      include: {
        ec: {
          select: {
            code: true,
            title: true,
            description: true,
            thumbnailUrl: true,
            estimatedHours: true,
            _count: {
              select: {
                modules: true,
                templates: true,
                assessments: true,
              },
            },
          },
        },
        moduleProgress: includeProgress
          ? {
              include: {
                module: {
                  select: {
                    code: true,
                    title: true,
                    icon: true,
                  },
                },
              },
            }
          : false,
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  async findEnrollmentById(enrollmentId: string) {
    const enrollment = await this.prisma.eCEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        ec: {
          select: {
            code: true,
            title: true,
            description: true,
            thumbnailUrl: true,
            estimatedHours: true,
          },
        },
        moduleProgress: {
          include: {
            module: {
              select: {
                code: true,
                title: true,
                icon: true,
                orderIndex: true,
                estimatedMinutes: true,
              },
            },
          },
          orderBy: {
            module: {
              orderIndex: 'asc',
            },
          },
        },
        lessonProgress: {
          include: {
            lesson: {
              select: {
                code: true,
                title: true,
                videoId: true,
                orderIndex: true,
                estimatedMinutes: true,
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return enrollment;
  }

  async findEnrollmentByUserAndEC(userId: string, ecCode: string) {
    const ec = await this.prisma.eCStandard.findUnique({
      where: { code: ecCode },
    });

    if (!ec) {
      throw new NotFoundException(`EC Standard ${ecCode} not found`);
    }

    const enrollment = await this.prisma.eCEnrollment.findUnique({
      where: {
        userId_ecId: {
          userId,
          ecId: ec.id,
        },
      },
      include: {
        ec: true,
        moduleProgress: {
          include: {
            module: {
              include: {
                lessons: true,
              },
            },
          },
        },
        lessonProgress: {
          include: {
            lesson: true,
          },
        },
        documents: true,
        assessmentAttempts: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException(`User is not enrolled in ${ecCode}`);
    }

    return enrollment;
  }

  // ============================================
  // LESSON PROGRESS
  // ============================================

  async updateLessonProgress(
    enrollmentId: string,
    lessonId: string,
    dto: UpdateLessonProgressDto,
  ) {
    const progress = await this.prisma.eCLessonProgress.findUnique({
      where: {
        enrollmentId_lessonId: {
          enrollmentId,
          lessonId,
        },
      },
    });

    if (!progress) {
      throw new NotFoundException('Lesson progress not found');
    }

    const updateData: Prisma.ECLessonProgressUpdateInput = {};

    if (dto.status) {
      updateData.status = dto.status as ProgressStatus;
      if (dto.status === 'IN_PROGRESS' && !progress.startedAt) {
        updateData.startedAt = new Date();
      }
      if (dto.status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }
    }

    if (dto.videoProgress !== undefined) {
      updateData.videoProgress = dto.videoProgress;
      if (dto.videoProgress > 0 && !progress.startedAt) {
        updateData.startedAt = new Date();
        updateData.status = 'IN_PROGRESS';
      }
      // Auto-complete if video is >= 90% watched
      if (dto.videoProgress >= 90 && progress.status !== 'COMPLETED') {
        updateData.status = 'COMPLETED';
        updateData.completedAt = new Date();
      }
    }

    if (dto.markCompleted) {
      updateData.status = 'COMPLETED';
      updateData.completedAt = new Date();
      updateData.videoProgress = 100;
    }

    const updated = await this.prisma.eCLessonProgress.update({
      where: {
        enrollmentId_lessonId: {
          enrollmentId,
          lessonId,
        },
      },
      data: updateData,
    });

    // Recalculate module and overall progress
    await this.recalculateProgress(enrollmentId);

    return updated;
  }

  async trackVideoProgress(
    enrollmentId: string,
    lessonId: string,
    dto: VideoProgressDto,
  ) {
    return this.updateLessonProgress(enrollmentId, lessonId, {
      videoProgress: dto.progress,
    });
  }

  async completeLesson(enrollmentId: string, lessonId: string) {
    return this.updateLessonProgress(enrollmentId, lessonId, {
      markCompleted: true,
    });
  }

  // ============================================
  // MODULE PROGRESS
  // ============================================

  async updateModuleProgress(
    enrollmentId: string,
    moduleId: string,
    dto: UpdateModuleProgressDto,
  ) {
    const progress = await this.prisma.eCModuleProgress.findUnique({
      where: {
        enrollmentId_moduleId: {
          enrollmentId,
          moduleId,
        },
      },
    });

    if (!progress) {
      throw new NotFoundException('Module progress not found');
    }

    const updateData: Prisma.ECModuleProgressUpdateInput = {};

    if (dto.status) {
      updateData.status = dto.status as ProgressStatus;
      if (dto.status === 'IN_PROGRESS' && !progress.startedAt) {
        updateData.startedAt = new Date();
      }
      if (dto.status === 'COMPLETED') {
        updateData.completedAt = new Date();
        updateData.progress = 100;
      }
    }

    if (dto.progress !== undefined) {
      updateData.progress = dto.progress;
    }

    return this.prisma.eCModuleProgress.update({
      where: {
        enrollmentId_moduleId: {
          enrollmentId,
          moduleId,
        },
      },
      data: updateData,
    });
  }

  async startModule(enrollmentId: string, moduleId: string) {
    return this.updateModuleProgress(enrollmentId, moduleId, {
      status: 'IN_PROGRESS',
    });
  }

  // ============================================
  // PROGRESS CALCULATION
  // ============================================

  async recalculateProgress(enrollmentId: string) {
    const enrollment = await this.prisma.eCEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        ec: {
          include: {
            modules: {
              include: {
                lessons: true,
              },
            },
          },
        },
        moduleProgress: true,
        lessonProgress: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    // Recalculate each module's progress based on lessons
    for (const module of enrollment.ec.modules) {
      const moduleLessons = module.lessons;
      const moduleProgress = enrollment.lessonProgress.filter(
        (lp) => moduleLessons.some((l) => l.id === lp.lessonId),
      );

      const completedLessons = moduleProgress.filter(
        (lp) => lp.status === 'COMPLETED',
      ).length;

      const progress =
        moduleLessons.length > 0
          ? Math.round((completedLessons / moduleLessons.length) * 100)
          : 0;

      const status: ProgressStatus =
        progress === 100
          ? 'COMPLETED'
          : progress > 0
            ? 'IN_PROGRESS'
            : 'NOT_STARTED';

      await this.prisma.eCModuleProgress.update({
        where: {
          enrollmentId_moduleId: {
            enrollmentId,
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

    // Recalculate overall progress
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

    // Check if enrollment should be marked complete
    let enrollmentStatus = enrollment.status;
    if (overallProgress === 100 && enrollmentStatus === 'IN_PROGRESS') {
      enrollmentStatus = 'COMPLETED';
    }

    await this.prisma.eCEnrollment.update({
      where: { id: enrollmentId },
      data: {
        overallProgress,
        status: enrollmentStatus as ECEnrollmentStatus,
        completedAt:
          enrollmentStatus === 'COMPLETED' ? new Date() : enrollment.completedAt,
      },
    });

    return { overallProgress, status: enrollmentStatus };
  }

  async getProgressSummary(enrollmentId: string) {
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
      throw new NotFoundException('Enrollment not found');
    }

    // Count totals
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

    // Calculate time estimates
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

    // Find next lesson to continue
    let nextLesson = null;
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
          nextLesson = {
            id: incompleteLessons[0].id,
            moduleId: module.id,
            title: incompleteLessons[0].title,
          };
          break;
        }
      }
    }

    // Check certification readiness
    const certificationReady =
      modulesCompleted === modulesTotal &&
      assessmentsPassed >= assessmentsTotal * 0.8 &&
      documentsCompleted >= documentsTotal * 0.8;

    return {
      enrollmentId,
      ecCode: enrollment.ec.code,
      overallProgress: enrollment.overallProgress,
      status: enrollment.status,
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
      estimatedTimeRemaining: totalMinutes - completedMinutes,
      timeSpent: completedMinutes,
      nextLesson,
      certificationReady,
    };
  }

  // ============================================
  // LEADERBOARD & ANALYTICS
  // ============================================

  async getECLeaderboard(ecCode: string, tenantId?: string, limit = 10) {
    const ec = await this.prisma.eCStandard.findUnique({
      where: { code: ecCode },
    });

    if (!ec) {
      throw new NotFoundException(`EC Standard ${ecCode} not found`);
    }

    const where: Prisma.ECEnrollmentWhereInput = { ecId: ec.id };
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const enrollments = await this.prisma.eCEnrollment.findMany({
      where,
      orderBy: { overallProgress: 'desc' },
      take: limit,
      include: {
        moduleProgress: true,
      },
    });

    // Get user details (in real app, would join with User table)
    return enrollments.map((e, index) => ({
      rank: index + 1,
      userId: e.userId,
      displayName: `User ${e.userId.slice(0, 8)}`, // Placeholder
      progress: e.overallProgress,
      modulesCompleted: e.moduleProgress.filter((mp) => mp.status === 'COMPLETED')
        .length,
    }));
  }

  async getRecentActivity(enrollmentId: string, limit = 10) {
    const [lessonActivity, documentActivity, assessmentActivity] =
      await Promise.all([
        this.prisma.eCLessonProgress.findMany({
          where: {
            enrollmentId,
            OR: [
              { startedAt: { not: null } },
              { completedAt: { not: null } },
            ],
          },
          include: {
            lesson: {
              select: {
                title: true,
                code: true,
              },
            },
          },
          orderBy: { completedAt: 'desc' },
          take: limit,
        }),
        this.prisma.eCDocument.findMany({
          where: { enrollmentId },
          include: {
            template: {
              select: {
                title: true,
                code: true,
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
          take: limit,
        }),
        this.prisma.eCAssessmentAttempt.findMany({
          where: { enrollmentId },
          include: {
            assessment: {
              select: {
                title: true,
                code: true,
              },
            },
          },
          orderBy: { completedAt: 'desc' },
          take: limit,
        }),
      ]);

    // Combine and sort by date
    const activities = [
      ...lessonActivity.map((l) => ({
        type: 'lesson',
        title: l.lesson.title,
        code: l.lesson.code,
        status: l.status,
        timestamp: l.completedAt || l.startedAt,
      })),
      ...documentActivity.map((d) => ({
        type: 'document',
        title: d.template.title,
        code: d.template.code,
        status: d.status,
        timestamp: d.updatedAt,
      })),
      ...assessmentActivity.map((a) => ({
        type: 'assessment',
        title: a.assessment.title,
        code: a.assessment.code,
        status: a.status,
        score: a.score,
        passed: a.passed,
        timestamp: a.completedAt || a.startedAt,
      })),
    ].sort(
      (a, b) =>
        (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0),
    );

    return activities.slice(0, limit);
  }

  // ============================================
  // ENROLLMENT MANAGEMENT
  // ============================================

  async withdrawEnrollment(enrollmentId: string) {
    const enrollment = await this.prisma.eCEnrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    if (enrollment.status === 'CERTIFIED') {
      throw new BadRequestException('Cannot withdraw a certified enrollment');
    }

    await this.prisma.eCEnrollment.update({
      where: { id: enrollmentId },
      data: { status: 'EXPIRED' },
    });

    return { message: 'Enrollment withdrawn successfully' };
  }

  async resetEnrollmentProgress(enrollmentId: string) {
    const enrollment = await this.prisma.eCEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        moduleProgress: true,
        lessonProgress: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    if (enrollment.status === 'CERTIFIED') {
      throw new BadRequestException('Cannot reset a certified enrollment');
    }

    // Reset all progress
    await Promise.all([
      this.prisma.eCModuleProgress.updateMany({
        where: { enrollmentId },
        data: {
          progress: 0,
          status: 'NOT_STARTED',
          startedAt: null,
          completedAt: null,
        },
      }),
      this.prisma.eCLessonProgress.updateMany({
        where: { enrollmentId },
        data: {
          status: 'NOT_STARTED',
          videoProgress: 0,
          startedAt: null,
          completedAt: null,
        },
      }),
      this.prisma.eCEnrollment.update({
        where: { id: enrollmentId },
        data: {
          overallProgress: 0,
          status: 'IN_PROGRESS',
          completedAt: null,
        },
      }),
    ]);

    return { message: 'Progress reset successfully' };
  }
}
