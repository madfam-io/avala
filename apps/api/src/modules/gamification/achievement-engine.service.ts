import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { GamificationService, UserStats } from "./gamification.service";

/**
 * Achievement definitions with evaluation criteria
 */
interface AchievementCriteria {
  code: string;
  evaluate: (stats: UserStats, meta: AchievementMeta) => boolean;
}

interface AchievementMeta {
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  level: number;
  coursesCompleted: number;
  certificatesEarned: number;
  quizAverageScore: number;
  totalEnrollments: number;
  fastCompletions: number; // Courses completed under target time
}

/**
 * AchievementEngineService
 * Evaluates and awards achievements based on user activity and milestones
 */
@Injectable()
export class AchievementEngineService {
  private readonly logger = new Logger(AchievementEngineService.name);

  /**
   * Achievement criteria definitions for all 16 seeded achievements
   */
  private readonly achievementCriteria: AchievementCriteria[] = [
    // FIRST_STEPS Category
    {
      code: "first_video",
      evaluate: (stats) => stats.videosWatched >= 1,
    },
    {
      code: "first_lesson",
      evaluate: (stats) => stats.lessonsCompleted >= 1,
    },
    {
      code: "first_quiz",
      evaluate: (stats) => stats.quizzesCompleted >= 1,
    },
    {
      code: "first_module",
      evaluate: (stats) => stats.modulesCompleted >= 1,
    },

    // MODULES Category
    {
      code: "module_master_5",
      evaluate: (stats) => stats.modulesCompleted >= 5,
    },
    {
      code: "module_master_10",
      evaluate: (stats) => stats.modulesCompleted >= 10,
    },
    {
      code: "module_master_25",
      evaluate: (stats) => stats.modulesCompleted >= 25,
    },

    // STREAKS Category
    {
      code: "streak_3",
      evaluate: (_stats, meta) => meta.currentStreak >= 3,
    },
    {
      code: "streak_7",
      evaluate: (_stats, meta) => meta.currentStreak >= 7,
    },
    {
      code: "streak_30",
      evaluate: (_stats, meta) => meta.currentStreak >= 30,
    },
    {
      code: "streak_100",
      evaluate: (_stats, meta) => meta.longestStreak >= 100,
    },

    // PERFORMANCE Category
    {
      code: "perfectionist",
      evaluate: (stats) => stats.perfectScores >= 5,
    },
    {
      code: "quiz_champion",
      evaluate: (_stats, meta) => meta.quizAverageScore >= 95,
    },
    {
      code: "speed_learner",
      evaluate: (_stats, meta) => meta.fastCompletions >= 3,
    },
    {
      code: "video_enthusiast",
      evaluate: (stats) => stats.videosWatched >= 15,
    },

    // COMPLETION Category
    {
      code: "course_graduate",
      evaluate: (_stats, meta) => meta.coursesCompleted >= 1,
    },
    {
      code: "multi_graduate",
      evaluate: (_stats, meta) => meta.coursesCompleted >= 5,
    },
    {
      code: "certification_holder",
      evaluate: (_stats, meta) => meta.certificatesEarned >= 1,
    },
    {
      code: "certification_collector",
      evaluate: (_stats, meta) => meta.certificatesEarned >= 5,
    },
    {
      code: "document_generator",
      evaluate: (stats) => stats.documentsGenerated >= 10,
    },
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly gamificationService: GamificationService,
  ) {}

  /**
   * Evaluate all achievements for a user and unlock any newly earned ones
   */
  async evaluateAllAchievements(
    userId: string,
    tenantId: string,
  ): Promise<string[]> {
    const [statsRecord, meta] = await Promise.all([
      this.gamificationService.getUserStats(userId, tenantId),
      this.getAchievementMeta(userId, tenantId),
    ]);

    const stats = statsRecord.stats;
    const unlocked: string[] = [];

    for (const criteria of this.achievementCriteria) {
      try {
        if (criteria.evaluate(stats, meta)) {
          const result = await this.gamificationService.unlockAchievement(
            userId,
            criteria.code,
          );
          if (result) {
            unlocked.push(criteria.code);
            this.logger.log(
              `User ${userId} unlocked achievement: ${criteria.code}`,
            );
          }
        }
      } catch (error) {
        this.logger.error(
          `Error evaluating achievement ${criteria.code}: ${error}`,
        );
      }
    }

    return unlocked;
  }

  /**
   * Evaluate specific category of achievements
   */
  async evaluateCategory(
    userId: string,
    tenantId: string,
    category:
      | "FIRST_STEPS"
      | "MODULES"
      | "STREAKS"
      | "PERFORMANCE"
      | "COMPLETION",
  ): Promise<string[]> {
    const categoryPrefixes: Record<string, string[]> = {
      FIRST_STEPS: ["first_"],
      MODULES: ["module_master_"],
      STREAKS: ["streak_"],
      PERFORMANCE: [
        "perfectionist",
        "quiz_champion",
        "speed_learner",
        "video_enthusiast",
      ],
      COMPLETION: ["course_", "multi_", "certification_", "document_"],
    };

    const prefixes = categoryPrefixes[category] || [];
    const relevantCriteria = this.achievementCriteria.filter((c) =>
      prefixes.some((p) => c.code.startsWith(p)),
    );

    const [statsRecord, meta] = await Promise.all([
      this.gamificationService.getUserStats(userId, tenantId),
      this.getAchievementMeta(userId, tenantId),
    ]);

    const stats = statsRecord.stats;
    const unlocked: string[] = [];

    for (const criteria of relevantCriteria) {
      if (criteria.evaluate(stats, meta)) {
        const result = await this.gamificationService.unlockAchievement(
          userId,
          criteria.code,
        );
        if (result) {
          unlocked.push(criteria.code);
        }
      }
    }

    return unlocked;
  }

  /**
   * Get metadata needed for achievement evaluation
   */
  private async getAchievementMeta(
    userId: string,
    tenantId: string,
  ): Promise<AchievementMeta> {
    const statsRecord = await this.gamificationService.getUserStats(
      userId,
      tenantId,
    );

    // Get course completions (using traineeId for Enrollment)
    const coursesCompleted = await this.prisma.enrollment.count({
      where: {
        traineeId: userId,
        status: "COMPLETED",
      },
    });

    // Get certificates earned (through course enrollments)
    const certificatesEarned = await this.prisma.certificate.count({
      where: {
        enrollment: {
          userId,
        },
      },
    });

    // Get quiz average score (using percentage field)
    const quizAttempts = await this.prisma.quizAttempt.findMany({
      where: { userId },
      select: { percentage: true },
    });

    const quizAverageScore =
      quizAttempts.length > 0
        ? quizAttempts.reduce((sum, q) => sum + (q.percentage ?? 0), 0) /
          quizAttempts.length
        : 0;

    // Get total enrollments
    const totalEnrollments = await this.prisma.enrollment.count({
      where: { traineeId: userId },
    });

    // Get fast completions (courses completed in less than expected time)
    // This requires tracking completion time vs estimated duration
    const fastCompletions = await this.countFastCompletions(userId);

    return {
      currentStreak: statsRecord.currentStreak,
      longestStreak: statsRecord.longestStreak,
      totalPoints: statsRecord.totalPoints,
      level: statsRecord.level,
      coursesCompleted,
      certificatesEarned,
      quizAverageScore,
      totalEnrollments,
      fastCompletions,
    };
  }

  /**
   * Count courses completed faster than estimated duration
   * Note: Currently returns 0 as Path model doesn't track estimatedDuration.
   * This can be enhanced when course duration tracking is added.
   */
  private async countFastCompletions(_userId: string): Promise<number> {
    // Path model doesn't have estimatedDuration field
    // Return 0 until duration tracking is implemented
    return 0;
  }

  /**
   * Handle event-based achievement triggers
   */
  async onVideoWatched(userId: string, tenantId: string): Promise<string[]> {
    await this.gamificationService.updateStats(userId, tenantId, {
      videosWatched:
        ((await this.gamificationService.getUserStats(userId, tenantId)).stats
          .videosWatched || 0) + 1,
    });

    return this.evaluateCategory(userId, tenantId, "FIRST_STEPS");
  }

  async onLessonCompleted(userId: string, tenantId: string): Promise<string[]> {
    const currentStats = (
      await this.gamificationService.getUserStats(userId, tenantId)
    ).stats;
    await this.gamificationService.updateStats(userId, tenantId, {
      lessonsCompleted: (currentStats.lessonsCompleted || 0) + 1,
    });

    return this.evaluateCategory(userId, tenantId, "FIRST_STEPS");
  }

  async onModuleCompleted(userId: string, tenantId: string): Promise<string[]> {
    const currentStats = (
      await this.gamificationService.getUserStats(userId, tenantId)
    ).stats;
    await this.gamificationService.updateStats(userId, tenantId, {
      modulesCompleted: (currentStats.modulesCompleted || 0) + 1,
    });

    const firstSteps = await this.evaluateCategory(
      userId,
      tenantId,
      "FIRST_STEPS",
    );
    const modules = await this.evaluateCategory(userId, tenantId, "MODULES");

    return [...firstSteps, ...modules];
  }

  async onQuizCompleted(
    userId: string,
    tenantId: string,
    score: number,
    maxScore: number,
  ): Promise<string[]> {
    const currentStats = (
      await this.gamificationService.getUserStats(userId, tenantId)
    ).stats;
    const isPerfect = score === maxScore;

    await this.gamificationService.updateStats(userId, tenantId, {
      quizzesCompleted: (currentStats.quizzesCompleted || 0) + 1,
      perfectScores: isPerfect
        ? (currentStats.perfectScores || 0) + 1
        : currentStats.perfectScores || 0,
    });

    const firstSteps = await this.evaluateCategory(
      userId,
      tenantId,
      "FIRST_STEPS",
    );
    const performance = await this.evaluateCategory(
      userId,
      tenantId,
      "PERFORMANCE",
    );

    return [...firstSteps, ...performance];
  }

  async onCourseCompleted(userId: string, tenantId: string): Promise<string[]> {
    return this.evaluateCategory(userId, tenantId, "COMPLETION");
  }

  async onCertificateEarned(
    userId: string,
    tenantId: string,
  ): Promise<string[]> {
    return this.evaluateCategory(userId, tenantId, "COMPLETION");
  }

  async onDocumentGenerated(
    userId: string,
    tenantId: string,
  ): Promise<string[]> {
    const currentStats = (
      await this.gamificationService.getUserStats(userId, tenantId)
    ).stats;
    await this.gamificationService.updateStats(userId, tenantId, {
      documentsGenerated: (currentStats.documentsGenerated || 0) + 1,
    });

    return this.evaluateCategory(userId, tenantId, "COMPLETION");
  }

  async onStreakUpdated(userId: string, tenantId: string): Promise<string[]> {
    return this.evaluateCategory(userId, tenantId, "STREAKS");
  }
}
