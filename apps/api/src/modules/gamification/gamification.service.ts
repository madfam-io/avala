import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { LeaderboardType, Prisma } from "@avala/db";

// Level thresholds (points required for each level)
const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 850, 1300, 1850, 2500, 3250, 4100, 5000,
];

export interface UserStats {
  videosWatched: number;
  lessonsCompleted: number;
  modulesCompleted: number;
  quizzesCompleted: number;
  documentsGenerated: number;
  perfectScores: number;
  totalTimeSpent: number;
}

export interface UserProgress {
  userId: string;
  totalPoints: number;
  level: number;
  pointsToNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  achievementsUnlocked: number;
  totalAchievements: number;
}

export interface AchievementWithStatus {
  id: string;
  code: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  category: string;
  rarity: string;
  icon: string;
  points: number;
  unlocked: boolean;
  unlockedAt?: Date;
}

const DEFAULT_STATS: UserStats = {
  videosWatched: 0,
  lessonsCompleted: 0,
  modulesCompleted: 0,
  quizzesCompleted: 0,
  documentsGenerated: 0,
  perfectScores: 0,
  totalTimeSpent: 0,
};

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // USER STATS & PROGRESS
  // ============================================

  /**
   * Get or create user gamification stats
   */
  async getUserStats(userId: string, tenantId: string) {
    let record = await this.prisma.userGamificationStats.findUnique({
      where: { userId },
    });

    if (!record) {
      record = await this.prisma.userGamificationStats.create({
        data: {
          userId,
          tenantId,
          totalPoints: 0,
          level: 1,
          currentStreak: 0,
          longestStreak: 0,
          stats: DEFAULT_STATS as unknown as Prisma.InputJsonValue,
        },
      });
    }

    return {
      ...record,
      stats: (record.stats as unknown as UserStats) || DEFAULT_STATS,
    };
  }

  /**
   * Get user progress summary
   */
  async getUserProgress(
    userId: string,
    tenantId: string,
  ): Promise<UserProgress> {
    const record = await this.getUserStats(userId, tenantId);

    const totalAchievements = await this.prisma.achievement.count();
    const unlockedCount = await this.prisma.userAchievement.count({
      where: { userId },
    });

    const level = this.calculateLevel(record.totalPoints);
    const pointsToNextLevel = this.getPointsToNextLevel(record.totalPoints);

    return {
      userId,
      totalPoints: record.totalPoints,
      level,
      pointsToNextLevel,
      currentStreak: record.currentStreak,
      longestStreak: record.longestStreak,
      achievementsUnlocked: unlockedCount,
      totalAchievements,
    };
  }

  /**
   * Award points to user
   */
  async awardPoints(
    userId: string,
    tenantId: string,
    points: number,
    reason: string,
  ) {
    const record = await this.getUserStats(userId, tenantId);
    const newTotal = record.totalPoints + points;
    const newLevel = this.calculateLevel(newTotal);

    await this.prisma.userGamificationStats.update({
      where: { userId },
      data: {
        totalPoints: newTotal,
        level: newLevel,
      },
    });

    this.logger.log(
      `Awarded ${points} points to user ${userId} for: ${reason}`,
    );

    if (newLevel > record.level) {
      this.logger.log(`User ${userId} leveled up to level ${newLevel}!`);
    }

    return { pointsAwarded: points, newTotal, level: newLevel };
  }

  /**
   * Update user activity stats
   */
  async updateStats(
    userId: string,
    tenantId: string,
    updates: Partial<UserStats>,
  ) {
    const record = await this.getUserStats(userId, tenantId);
    const currentStats = record.stats;

    const newStats: UserStats = {
      ...currentStats,
      ...updates,
    };

    await this.prisma.userGamificationStats.update({
      where: { userId },
      data: {
        stats: newStats as unknown as Prisma.InputJsonValue,
      },
    });

    return newStats;
  }

  // ============================================
  // ACHIEVEMENTS
  // ============================================

  /**
   * Get all achievements with user's unlock status
   */
  async getAchievementsWithStatus(
    userId: string,
  ): Promise<AchievementWithStatus[]> {
    const achievements = await this.prisma.achievement.findMany({
      orderBy: [{ category: "asc" }, { orderIndex: "asc" }],
    });

    const userAchievements = await this.prisma.userAchievement.findMany({
      where: { userId },
    });

    const unlockedMap = new Map(
      userAchievements.map((ua) => [ua.achievementId, ua.unlockedAt]),
    );

    return achievements.map((a) => ({
      id: a.id,
      code: a.code,
      title: a.title,
      titleEn: a.titleEn || undefined,
      description: a.description,
      descriptionEn: a.descriptionEn || undefined,
      category: a.category,
      rarity: a.rarity,
      icon: a.icon,
      points: a.points,
      unlocked: unlockedMap.has(a.id),
      unlockedAt: unlockedMap.get(a.id),
    }));
  }

  /**
   * Get user's unlocked achievements
   */
  async getUnlockedAchievements(userId: string) {
    return this.prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true,
      },
      orderBy: { unlockedAt: "desc" },
    });
  }

  /**
   * Unlock an achievement for a user
   */
  async unlockAchievement(userId: string, achievementCode: string) {
    const achievement = await this.prisma.achievement.findUnique({
      where: { code: achievementCode },
    });

    if (!achievement) {
      this.logger.warn(`Achievement ${achievementCode} not found`);
      return null;
    }

    // Check if already unlocked
    const existing = await this.prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
    });

    if (existing) {
      return null; // Already unlocked
    }

    // Get user's tenantId
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    });

    if (!user) {
      this.logger.warn(`User ${userId} not found for achievement unlock`);
      return null;
    }

    // Create unlock record
    const userAchievement = await this.prisma.userAchievement.create({
      data: {
        userId,
        achievementId: achievement.id,
        tenantId: user.tenantId,
        pointsAwarded: achievement.points,
        unlockedAt: new Date(),
      },
      include: {
        achievement: true,
      },
    });

    // Award achievement points
    const stats = await this.prisma.userGamificationStats.findUnique({
      where: { userId },
    });

    if (stats) {
      await this.prisma.userGamificationStats.update({
        where: { userId },
        data: {
          totalPoints: stats.totalPoints + achievement.points,
        },
      });
    }

    this.logger.log(
      `User ${userId} unlocked achievement: ${achievement.title} (+${achievement.points} points)`,
    );

    return userAchievement;
  }

  /**
   * Check and unlock achievements based on user activity
   */
  async checkAchievements(userId: string, tenantId: string) {
    const record = await this.getUserStats(userId, tenantId);
    const stats = record.stats;
    const unlocked: string[] = [];

    // First Steps achievements
    if (stats.videosWatched >= 1) {
      const result = await this.unlockAchievement(userId, "first_video");
      if (result) unlocked.push("first_video");
    }

    if (stats.lessonsCompleted >= 1) {
      const result = await this.unlockAchievement(userId, "first_lesson");
      if (result) unlocked.push("first_lesson");
    }

    if (stats.quizzesCompleted >= 1) {
      const result = await this.unlockAchievement(userId, "first_quiz");
      if (result) unlocked.push("first_quiz");
    }

    // Streak achievements
    if (record.currentStreak >= 3) {
      const result = await this.unlockAchievement(userId, "streak_3");
      if (result) unlocked.push("streak_3");
    }

    if (record.currentStreak >= 7) {
      const result = await this.unlockAchievement(userId, "streak_7");
      if (result) unlocked.push("streak_7");
    }

    if (record.currentStreak >= 30) {
      const result = await this.unlockAchievement(userId, "streak_30");
      if (result) unlocked.push("streak_30");
    }

    // Performance achievements
    if (stats.perfectScores >= 5) {
      const result = await this.unlockAchievement(userId, "perfectionist");
      if (result) unlocked.push("perfectionist");
    }

    if (stats.videosWatched >= 15) {
      const result = await this.unlockAchievement(userId, "video_enthusiast");
      if (result) unlocked.push("video_enthusiast");
    }

    if (stats.documentsGenerated >= 10) {
      const result = await this.unlockAchievement(userId, "document_generator");
      if (result) unlocked.push("document_generator");
    }

    return unlocked;
  }

  // ============================================
  // STREAKS & DAILY ACTIVITY
  // ============================================

  /**
   * Record daily activity and update streak
   */
  async recordDailyActivity(userId: string, tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already logged today
    const existingActivity = await this.prisma.dailyActivity.findFirst({
      where: {
        userId,
        activityDate: today,
      },
    });

    if (existingActivity) {
      return { alreadyLogged: true };
    }

    // Record today's activity
    await this.prisma.dailyActivity.create({
      data: {
        userId,
        tenantId,
        activityDate: today,
        pointsEarned: 0,
        activities: {},
      },
    });

    // Update streak
    const record = await this.getUserStats(userId, tenantId);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayActivity = await this.prisma.dailyActivity.findFirst({
      where: {
        userId,
        activityDate: yesterday,
      },
    });

    let newStreak = yesterdayActivity ? record.currentStreak + 1 : 1;
    const newLongestStreak = Math.max(newStreak, record.longestStreak);

    await this.prisma.userGamificationStats.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastActivityDate: new Date(),
      },
    });

    // Check streak achievements
    await this.checkAchievements(userId, tenantId);

    return {
      alreadyLogged: false,
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
    };
  }

  /**
   * Get user's activity history
   */
  async getActivityHistory(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    return this.prisma.dailyActivity.findMany({
      where: {
        userId,
        activityDate: { gte: startDate },
      },
      orderBy: { activityDate: "desc" },
    });
  }

  // ============================================
  // LEADERBOARDS
  // ============================================

  /**
   * Get leaderboard entries
   */
  async getLeaderboard(
    tenantId: string,
    _type: LeaderboardType = LeaderboardType.WEEKLY_POINTS,
    limit: number = 10,
  ) {
    // Get top users by points
    const topStats = await this.prisma.userGamificationStats.findMany({
      where: { tenantId },
      orderBy: { totalPoints: "desc" },
      take: limit,
    });

    // Fetch user details for each entry
    const userIds = topStats.map((s) => s.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return topStats.map((entry, index) => {
      const user = userMap.get(entry.userId);
      return {
        rank: index + 1,
        userId: entry.userId,
        userName: user
          ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            user.email
          : "Unknown",
        points: entry.totalPoints,
        level: entry.level,
        streak: entry.currentStreak,
      };
    });
  }

  /**
   * Get user's rank on leaderboard
   */
  async getUserRank(userId: string, tenantId: string) {
    const record = await this.getUserStats(userId, tenantId);

    const higherRanked = await this.prisma.userGamificationStats.count({
      where: {
        tenantId,
        totalPoints: { gt: record.totalPoints },
      },
    });

    return {
      rank: higherRanked + 1,
      points: record.totalPoints,
      level: record.level,
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private calculateLevel(points: number): number {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (points >= LEVEL_THRESHOLDS[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  private getPointsToNextLevel(points: number): number {
    const currentLevel = this.calculateLevel(points);
    if (currentLevel >= LEVEL_THRESHOLDS.length) {
      return 0; // Max level
    }
    return LEVEL_THRESHOLDS[currentLevel] - points;
  }
}
