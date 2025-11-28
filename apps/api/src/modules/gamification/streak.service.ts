import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date | null;
  isActiveToday: boolean;
  streakAtRisk: boolean; // No activity yesterday, will lose streak if no activity today
}

interface ActivitySummary {
  date: Date;
  videosWatched: number;
  lessonsCompleted: number;
  quizzesCompleted: number;
  pointsEarned: number;
  timeSpent: number;
}

@Injectable()
export class StreakService {
  private readonly logger = new Logger(StreakService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get user's streak information
   */
  async getStreakInfo(userId: string): Promise<StreakInfo> {
    const stats = await this.prisma.userGamificationStats.findUnique({
      where: { userId },
    });

    if (!stats) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        isActiveToday: false,
        streakAtRisk: false,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if active today
    const todayActivity = await this.prisma.dailyActivity.findFirst({
      where: {
        userId,
        activityDate: today,
      },
    });

    // Check if was active yesterday (for streak at risk calculation)
    const yesterdayActivity = await this.prisma.dailyActivity.findFirst({
      where: {
        userId,
        activityDate: yesterday,
      },
    });

    const isActiveToday = !!todayActivity;
    const streakAtRisk = !isActiveToday && !yesterdayActivity && stats.currentStreak > 0;

    return {
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      lastActivityDate: stats.lastActivityDate,
      isActiveToday,
      streakAtRisk,
    };
  }

  /**
   * Record activity for today and update streak
   */
  async recordActivity(
    userId: string,
    tenantId: string,
    activityType: 'video' | 'lesson' | 'quiz' | 'module' | 'login',
    points: number = 0,
  ): Promise<{ newStreak: number; streakBroken: boolean; streakExtended: boolean }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get or create today's activity record
    let dailyActivity = await this.prisma.dailyActivity.findFirst({
      where: { userId, activityDate: today },
    });

    const existingActivities = (dailyActivity?.activities as Record<string, number>) || {};

    if (!dailyActivity) {
      dailyActivity = await this.prisma.dailyActivity.create({
        data: {
          userId,
          tenantId,
          activityDate: today,
          pointsEarned: points,
          activities: { [activityType]: 1 },
        },
      });
    } else {
      await this.prisma.dailyActivity.update({
        where: { id: dailyActivity.id },
        data: {
          pointsEarned: dailyActivity.pointsEarned + points,
          activities: {
            ...existingActivities,
            [activityType]: (existingActivities[activityType] || 0) + 1,
          },
        },
      });
    }

    // Update streak
    const stats = await this.prisma.userGamificationStats.findUnique({
      where: { userId },
    });

    if (!stats) {
      // Create stats record if doesn't exist
      await this.prisma.userGamificationStats.create({
        data: {
          userId,
          tenantId,
          totalPoints: points,
          level: 1,
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: new Date(),
          stats: {},
        },
      });

      return { newStreak: 1, streakBroken: false, streakExtended: true };
    }

    // Check if this is the first activity today
    const wasActiveToday = await this.prisma.dailyActivity.count({
      where: {
        userId,
        activityDate: today,
        id: { not: dailyActivity.id },
      },
    });

    if (wasActiveToday > 0) {
      // Already logged activity today, streak already counted
      return { newStreak: stats.currentStreak, streakBroken: false, streakExtended: false };
    }

    // Check if was active yesterday
    const yesterdayActivity = await this.prisma.dailyActivity.findFirst({
      where: { userId, activityDate: yesterday },
    });

    let newStreak: number;
    let streakBroken = false;
    let streakExtended = false;

    if (yesterdayActivity) {
      // Continue streak
      newStreak = stats.currentStreak + 1;
      streakExtended = true;
    } else if (stats.lastActivityDate) {
      // Check if last activity was today (already counted) or before yesterday (broken)
      const lastActivityDay = new Date(stats.lastActivityDate);
      lastActivityDay.setHours(0, 0, 0, 0);

      if (lastActivityDay.getTime() === today.getTime()) {
        newStreak = stats.currentStreak;
      } else {
        // Streak broken - reset to 1
        newStreak = 1;
        streakBroken = stats.currentStreak > 0;
      }
    } else {
      // First activity ever
      newStreak = 1;
      streakExtended = true;
    }

    const newLongestStreak = Math.max(newStreak, stats.longestStreak);

    await this.prisma.userGamificationStats.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastActivityDate: new Date(),
      },
    });

    if (streakBroken) {
      this.logger.log(`User ${userId} lost their ${stats.currentStreak}-day streak`);
    } else if (streakExtended) {
      this.logger.log(`User ${userId} extended streak to ${newStreak} days`);
    }

    return { newStreak, streakBroken, streakExtended };
  }

  /**
   * Get user's activity history for a date range
   */
  async getActivityHistory(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ActivitySummary[]> {
    const activities = await this.prisma.dailyActivity.findMany({
      where: {
        userId,
        activityDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { activityDate: 'asc' },
    });

    return activities.map((activity) => {
      const acts = (activity.activities as Record<string, number>) || {};
      return {
        date: activity.activityDate,
        videosWatched: acts.video || 0,
        lessonsCompleted: acts.lesson || 0,
        quizzesCompleted: acts.quiz || 0,
        pointsEarned: activity.pointsEarned,
        timeSpent: acts.timeSpent || 0,
      };
    });
  }

  /**
   * Get activity calendar data (for heatmap visualization)
   */
  async getActivityCalendar(
    userId: string,
    year: number,
  ): Promise<{ date: string; count: number; level: number }[]> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const activities = await this.prisma.dailyActivity.findMany({
      where: {
        userId,
        activityDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return activities.map((activity) => {
      const acts = (activity.activities as Record<string, number>) || {};
      const totalActions = Object.values(acts).reduce((sum, val) => sum + (val || 0), 0);

      // Calculate activity level (0-4 for heatmap)
      let level = 0;
      if (totalActions >= 1) level = 1;
      if (totalActions >= 3) level = 2;
      if (totalActions >= 5) level = 3;
      if (totalActions >= 10) level = 4;

      return {
        date: activity.activityDate.toISOString().split('T')[0],
        count: totalActions,
        level,
      };
    });
  }

  /**
   * Check for users at risk of losing streaks (for notifications)
   */
  async getUsersAtRiskOfLosingStreak(tenantId: string): Promise<string[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Find users with active streaks who haven't been active today
    const usersWithStreaks = await this.prisma.userGamificationStats.findMany({
      where: {
        tenantId,
        currentStreak: { gt: 0 },
      },
      select: { userId: true },
    });

    const atRiskUsers: string[] = [];

    for (const user of usersWithStreaks) {
      const todayActivity = await this.prisma.dailyActivity.findFirst({
        where: {
          userId: user.userId,
          activityDate: today,
        },
      });

      if (!todayActivity) {
        atRiskUsers.push(user.userId);
      }
    }

    return atRiskUsers;
  }

  /**
   * Cron job to reset broken streaks at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resetBrokenStreaks(): Promise<void> {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(0, 0, 0, 0);

    // Find users who haven't been active for 2+ days and still have a streak
    const usersToReset = await this.prisma.userGamificationStats.findMany({
      where: {
        currentStreak: { gt: 0 },
        lastActivityDate: { lt: twoDaysAgo },
      },
    });

    for (const user of usersToReset) {
      await this.prisma.userGamificationStats.update({
        where: { userId: user.userId },
        data: { currentStreak: 0 },
      });

      this.logger.log(`Reset streak for inactive user ${user.userId}`);
    }

    if (usersToReset.length > 0) {
      this.logger.log(`Reset ${usersToReset.length} broken streaks`);
    }
  }
}
