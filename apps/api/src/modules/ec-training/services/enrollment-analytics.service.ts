import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma } from '@avala/db';

interface ActivityItem {
  type: 'lesson' | 'document' | 'assessment';
  title: string;
  code: string;
  status: string;
  timestamp: Date | null;
  score?: number | null;
  passed?: boolean | null;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  progress: number;
  modulesCompleted: number;
}

@Injectable()
export class EnrollmentAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getECLeaderboard(
    ecCode: string,
    tenantId?: string,
    limit = 10,
  ): Promise<LeaderboardEntry[]> {
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

    return enrollments.map((e, index) => ({
      rank: index + 1,
      userId: e.userId,
      displayName: `User ${e.userId.slice(0, 8)}`,
      progress: e.overallProgress,
      modulesCompleted: e.moduleProgress.filter((mp) => mp.status === 'COMPLETED')
        .length,
    }));
  }

  async getRecentActivity(
    enrollmentId: string,
    limit = 10,
  ): Promise<ActivityItem[]> {
    const [lessonActivity, documentActivity, assessmentActivity] =
      await Promise.all([
        this.fetchLessonActivity(enrollmentId, limit),
        this.fetchDocumentActivity(enrollmentId, limit),
        this.fetchAssessmentActivity(enrollmentId, limit),
      ]);

    const activities: ActivityItem[] = [
      ...this.mapLessonActivity(lessonActivity),
      ...this.mapDocumentActivity(documentActivity),
      ...this.mapAssessmentActivity(assessmentActivity),
    ];

    return activities
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }

  private async fetchLessonActivity(enrollmentId: string, limit: number) {
    return this.prisma.eCLessonProgress.findMany({
      where: {
        enrollmentId,
        OR: [{ startedAt: { not: null } }, { completedAt: { not: null } }],
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
    });
  }

  private async fetchDocumentActivity(enrollmentId: string, limit: number) {
    return this.prisma.eCDocument.findMany({
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
    });
  }

  private async fetchAssessmentActivity(enrollmentId: string, limit: number) {
    return this.prisma.eCAssessmentAttempt.findMany({
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
    });
  }

  private mapLessonActivity(
    lessons: Array<{
      lesson: { title: string; code: string };
      status: string;
      completedAt: Date | null;
      startedAt: Date | null;
    }>,
  ): ActivityItem[] {
    return lessons.map((l) => ({
      type: 'lesson' as const,
      title: l.lesson.title,
      code: l.lesson.code,
      status: l.status,
      timestamp: l.completedAt || l.startedAt,
    }));
  }

  private mapDocumentActivity(
    documents: Array<{
      template: { title: string; code: string };
      status: string;
      updatedAt: Date;
    }>,
  ): ActivityItem[] {
    return documents.map((d) => ({
      type: 'document' as const,
      title: d.template.title,
      code: d.template.code,
      status: d.status,
      timestamp: d.updatedAt,
    }));
  }

  private mapAssessmentActivity(
    assessments: Array<{
      assessment: { title: string; code: string };
      status: string;
      score: number | null;
      passed: boolean | null;
      completedAt: Date | null;
      startedAt: Date | null;
    }>,
  ): ActivityItem[] {
    return assessments.map((a) => ({
      type: 'assessment' as const,
      title: a.assessment.title,
      code: a.assessment.code,
      status: a.status,
      score: a.score,
      passed: a.passed,
      timestamp: a.completedAt || a.startedAt,
    }));
  }

  async getEnrollmentStats(ecCode: string, tenantId?: string) {
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

    const [total, inProgress, completed, certified] = await Promise.all([
      this.prisma.eCEnrollment.count({ where }),
      this.prisma.eCEnrollment.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      this.prisma.eCEnrollment.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.eCEnrollment.count({ where: { ...where, status: 'CERTIFIED' } }),
    ]);

    const avgProgress = await this.prisma.eCEnrollment.aggregate({
      where,
      _avg: { overallProgress: true },
    });

    return {
      total,
      inProgress,
      completed,
      certified,
      averageProgress: Math.round(avgProgress._avg.overallProgress || 0),
      completionRate: total > 0 ? Math.round(((completed + certified) / total) * 100) : 0,
    };
  }
}
