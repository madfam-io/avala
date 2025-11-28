import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { LeaderboardType } from "@avala/db";
import { Cron, CronExpression } from "@nestjs/schedule";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  avatarUrl?: string;
  points: number;
  level: number;
  streak: number;
  achievementCount?: number;
}

interface LeaderboardResult {
  type: LeaderboardType;
  period: string;
  entries: LeaderboardEntry[];
  userRank?: LeaderboardEntry;
  totalParticipants: number;
}

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get leaderboard by type
   */
  async getLeaderboard(
    tenantId: string,
    type: LeaderboardType,
    limit: number = 10,
    currentUserId?: string,
  ): Promise<LeaderboardResult> {
    const period = this.getPeriodForType(type);
    const startDate = this.getStartDateForType(type);

    let entries: LeaderboardEntry[];
    let totalParticipants: number;

    switch (type) {
      case LeaderboardType.WEEKLY_POINTS:
      case LeaderboardType.MONTHLY_POINTS:
        ({ entries, totalParticipants } = await this.getPointsLeaderboard(
          tenantId,
          startDate,
          limit,
        ));
        break;
      case LeaderboardType.GLOBAL_POINTS:
        ({ entries, totalParticipants } =
          await this.getAllTimePointsLeaderboard(tenantId, limit));
        break;
      case LeaderboardType.STREAK_LENGTH:
        ({ entries, totalParticipants } = await this.getStreakLeaderboard(
          tenantId,
          limit,
        ));
        break;
      default:
        ({ entries, totalParticipants } =
          await this.getAllTimePointsLeaderboard(tenantId, limit));
    }

    // Get current user's rank if provided
    let userRank: LeaderboardEntry | undefined;
    if (currentUserId) {
      userRank = await this.getUserRankForType(
        tenantId,
        currentUserId,
        type,
        startDate,
      );
    }

    return {
      type,
      period,
      entries,
      userRank,
      totalParticipants,
    };
  }

  /**
   * Get points-based leaderboard for a time period
   */
  private async getPointsLeaderboard(
    tenantId: string,
    startDate: Date,
    limit: number,
  ): Promise<{ entries: LeaderboardEntry[]; totalParticipants: number }> {
    // Aggregate points from daily activities within the period
    const pointsAggregation = await this.prisma.dailyActivity.groupBy({
      by: ["userId"],
      where: {
        tenantId,
        activityDate: { gte: startDate },
      },
      _sum: { pointsEarned: true },
      orderBy: { _sum: { pointsEarned: "desc" } },
      take: limit,
    });

    const totalParticipants = await this.prisma.dailyActivity.groupBy({
      by: ["userId"],
      where: {
        tenantId,
        activityDate: { gte: startDate },
      },
    });

    const userIds = pointsAggregation.map((p) => p.userId);
    const [users, stats] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
        },
      }),
      this.prisma.userGamificationStats.findMany({
        where: { userId: { in: userIds } },
      }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const statsMap = new Map(stats.map((s) => [s.userId, s]));

    const entries: LeaderboardEntry[] = pointsAggregation.map(
      (entry, index) => {
        const user = userMap.get(entry.userId);
        const userStats = statsMap.get(entry.userId);

        return {
          rank: index + 1,
          userId: entry.userId,
          userName: user
            ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
              user.email
            : "Unknown",
          avatarUrl: user?.avatarUrl ?? undefined,
          points: entry._sum.pointsEarned || 0,
          level: userStats?.level || 1,
          streak: userStats?.currentStreak || 0,
        };
      },
    );

    return { entries, totalParticipants: totalParticipants.length };
  }

  /**
   * Get all-time points leaderboard
   */
  private async getAllTimePointsLeaderboard(
    tenantId: string,
    limit: number,
  ): Promise<{ entries: LeaderboardEntry[]; totalParticipants: number }> {
    const [topStats, totalParticipants] = await Promise.all([
      this.prisma.userGamificationStats.findMany({
        where: { tenantId },
        orderBy: { totalPoints: "desc" },
        take: limit,
      }),
      this.prisma.userGamificationStats.count({ where: { tenantId } }),
    ]);

    const userIds = topStats.map((s) => s.userId);
    const [users, achievementCounts] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
        },
      }),
      this.prisma.userAchievement.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds } },
        _count: true,
      }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const achievementMap = new Map(
      achievementCounts.map((a) => [a.userId, a._count]),
    );

    const entries: LeaderboardEntry[] = topStats.map((stats, index) => {
      const user = userMap.get(stats.userId);

      return {
        rank: index + 1,
        userId: stats.userId,
        userName: user
          ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            user.email
          : "Unknown",
        avatarUrl: user?.avatarUrl ?? undefined,
        points: stats.totalPoints,
        level: stats.level,
        streak: stats.currentStreak,
        achievementCount: achievementMap.get(stats.userId) || 0,
      };
    });

    return { entries, totalParticipants };
  }

  /**
   * Get streak leaderboard
   */
  private async getStreakLeaderboard(
    tenantId: string,
    limit: number,
  ): Promise<{ entries: LeaderboardEntry[]; totalParticipants: number }> {
    const [topStreaks, totalParticipants] = await Promise.all([
      this.prisma.userGamificationStats.findMany({
        where: {
          tenantId,
          currentStreak: { gt: 0 },
        },
        orderBy: { currentStreak: "desc" },
        take: limit,
      }),
      this.prisma.userGamificationStats.count({
        where: {
          tenantId,
          currentStreak: { gt: 0 },
        },
      }),
    ]);

    const userIds = topStreaks.map((s) => s.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const entries: LeaderboardEntry[] = topStreaks.map((stats, index) => {
      const user = userMap.get(stats.userId);

      return {
        rank: index + 1,
        userId: stats.userId,
        userName: user
          ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            user.email
          : "Unknown",
        avatarUrl: user?.avatarUrl ?? undefined,
        points: stats.totalPoints,
        level: stats.level,
        streak: stats.currentStreak,
      };
    });

    return { entries, totalParticipants };
  }

  /**
   * Get user's rank for a specific leaderboard type
   */
  private async getUserRankForType(
    tenantId: string,
    userId: string,
    type: LeaderboardType,
    startDate?: Date,
  ): Promise<LeaderboardEntry | undefined> {
    const userStats = await this.prisma.userGamificationStats.findUnique({
      where: { userId },
    });

    if (!userStats) return undefined;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true, avatarUrl: true },
    });

    let rank: number;
    let points: number;

    switch (type) {
      case LeaderboardType.WEEKLY_POINTS:
      case LeaderboardType.MONTHLY_POINTS: {
        // Calculate periodic points
        const periodicPoints = await this.prisma.dailyActivity.aggregate({
          where: {
            userId,
            tenantId,
            activityDate: { gte: startDate },
          },
          _sum: { pointsEarned: true },
        });

        points = periodicPoints._sum.pointsEarned || 0;

        // Count users with more points in the period
        const higherRankedPeriodic = await this.prisma.dailyActivity.groupBy({
          by: ["userId"],
          where: {
            tenantId,
            activityDate: { gte: startDate },
          },
          _sum: { pointsEarned: true },
          having: {
            pointsEarned: { _sum: { gt: points } },
          },
        });

        rank = higherRankedPeriodic.length + 1;
        break;
      }

      case LeaderboardType.GLOBAL_POINTS: {
        points = userStats.totalPoints;
        const higherRankedAllTime =
          await this.prisma.userGamificationStats.count({
            where: {
              tenantId,
              totalPoints: { gt: points },
            },
          });
        rank = higherRankedAllTime + 1;
        break;
      }

      case LeaderboardType.STREAK_LENGTH: {
        points = userStats.totalPoints;
        const higherRankedStreak =
          await this.prisma.userGamificationStats.count({
            where: {
              tenantId,
              currentStreak: { gt: userStats.currentStreak },
            },
          });
        rank = higherRankedStreak + 1;
        break;
      }

      default:
        points = userStats.totalPoints;
        rank = 1;
    }

    return {
      rank,
      userId,
      userName: user
        ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email
        : "Unknown",
      avatarUrl: user?.avatarUrl ?? undefined,
      points,
      level: userStats.level,
      streak: userStats.currentStreak,
    };
  }

  /**
   * Get period description for leaderboard type
   */
  private getPeriodForType(type: LeaderboardType): string {
    switch (type) {
      case LeaderboardType.WEEKLY_POINTS:
        return "This Week";
      case LeaderboardType.MONTHLY_POINTS:
        return "This Month";
      case LeaderboardType.GLOBAL_POINTS:
        return "All Time";
      case LeaderboardType.STREAK_LENGTH:
        return "Current Streaks";
      default:
        return "All Time";
    }
  }

  /**
   * Get start date for leaderboard type
   */
  private getStartDateForType(type: LeaderboardType): Date {
    const now = new Date();

    switch (type) {
      case LeaderboardType.WEEKLY_POINTS: {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
      }

      case LeaderboardType.MONTHLY_POINTS:
        return new Date(now.getFullYear(), now.getMonth(), 1);

      default:
        return new Date(0); // Beginning of time
    }
  }

  /**
   * Cron job to cache weekly leaderboard results
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cacheLeaderboards(): Promise<void> {
    // This could be expanded to cache leaderboard results in Redis
    // For now, just log that the job ran
    this.logger.debug("Leaderboard cache job executed");
  }
}
