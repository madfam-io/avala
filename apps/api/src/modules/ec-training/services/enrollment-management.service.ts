import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma, ECEnrollmentStatus } from '@avala/db';
import {
  CreateECEnrollmentDto,
  ECEnrollmentQueryDto,
  UserEnrollmentQueryDto,
} from '../dto/ec-enrollment.dto';

@Injectable()
export class EnrollmentManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async enrollUser(dto: CreateECEnrollmentDto) {
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

    const enrollment = await this.prisma.eCEnrollment.create({
      data: {
        userId: dto.userId,
        ecId: ec.id,
        tenantId: dto.tenantId,
        status: 'IN_PROGRESS',
        overallProgress: 0,
      },
    });

    await this.initializeProgress(enrollment.id, ec.modules);

    return this.findEnrollmentById(enrollment.id);
  }

  private async initializeProgress(
    enrollmentId: string,
    modules: Array<{ id: string; lessons: Array<{ id: string }> }>,
  ) {
    const moduleProgressData = modules.map((module) => ({
      enrollmentId,
      moduleId: module.id,
      progress: 0,
      status: 'NOT_STARTED' as const,
    }));

    if (moduleProgressData.length > 0) {
      await this.prisma.eCModuleProgress.createMany({
        data: moduleProgressData,
      });
    }

    const lessonProgressData: Prisma.ECLessonProgressCreateManyInput[] = [];
    for (const module of modules) {
      for (const lesson of module.lessons) {
        lessonProgressData.push({
          enrollmentId,
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
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    if (enrollment.status === 'CERTIFIED') {
      throw new BadRequestException('Cannot reset a certified enrollment');
    }

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
