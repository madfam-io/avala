import { Test, TestingModule } from "@nestjs/testing";
import { GamificationService } from "./gamification.service";
import { PrismaService } from "../../database/prisma.service";
import { LeaderboardType } from "@avala/db";

describe("GamificationService", () => {
  let service: GamificationService;

  const mockUserId = "user-123";
  const mockTenantId = "tenant-456";

  const mockPrisma = {
    userGamificationStats: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    achievement: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    userAchievement: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    dailyActivity: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockGamificationStats = {
    userId: mockUserId,
    tenantId: mockTenantId,
    totalPoints: 500,
    level: 3,
    currentStreak: 5,
    longestStreak: 10,
    lastActivityDate: new Date(),
    stats: {
      videosWatched: 10,
      lessonsCompleted: 8,
      modulesCompleted: 2,
      quizzesCompleted: 5,
      documentsGenerated: 3,
      perfectScores: 2,
      totalTimeSpent: 7200,
    },
  };

  const mockAchievement = {
    id: "achievement-1",
    code: "first_video",
    title: "First Video",
    titleEn: "First Video",
    description: "Watch your first video",
    descriptionEn: "Watch your first video",
    category: "first_steps",
    rarity: "common",
    icon: "🎬",
    points: 10,
    orderIndex: 1,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<GamificationService>(GamificationService);
  });

  describe("getUserStats", () => {
    it("should return existing user stats", async () => {
      mockPrisma.userGamificationStats.findUnique.mockResolvedValue(
        mockGamificationStats,
      );

      const result = await service.getUserStats(mockUserId, mockTenantId);

      expect(result.userId).toBe(mockUserId);
      expect(result.totalPoints).toBe(500);
      expect(result.stats.videosWatched).toBe(10);
    });

    it("should create stats if not found", async () => {
      mockPrisma.userGamificationStats.findUnique.mockResolvedValue(null);
      mockPrisma.userGamificationStats.create.mockResolvedValue({
        userId: mockUserId,
        tenantId: mockTenantId,
        totalPoints: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        stats: {
          videosWatched: 0,
          lessonsCompleted: 0,
          modulesCompleted: 0,
          quizzesCompleted: 0,
          documentsGenerated: 0,
          perfectScores: 0,
          totalTimeSpent: 0,
        },
      });

      const result = await service.getUserStats(mockUserId, mockTenantId);

      expect(result.totalPoints).toBe(0);
      expect(result.level).toBe(1);
      expect(mockPrisma.userGamificationStats.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUserId,
          tenantId: mockTenantId,
        }),
      });
    });
  });

  describe("getUserProgress", () => {
    beforeEach(() => {
      mockPrisma.userGamificationStats.findUnique.mockResolvedValue(
        mockGamificationStats,
      );
      mockPrisma.achievement.count.mockResolvedValue(20);
      mockPrisma.userAchievement.count.mockResolvedValue(5);
    });

    it("should return user progress summary", async () => {
      const result = await service.getUserProgress(mockUserId, mockTenantId);

      expect(result).toEqual({
        userId: mockUserId,
        totalPoints: 500,
        level: 4, // 500 points is level 4 based on thresholds
        pointsToNextLevel: expect.any(Number),
        currentStreak: 5,
        longestStreak: 10,
        achievementsUnlocked: 5,
        totalAchievements: 20,
      });
    });

    it("should calculate correct level from points", async () => {
      mockPrisma.userGamificationStats.findUnique.mockResolvedValue({
        ...mockGamificationStats,
        totalPoints: 1000,
      });

      const result = await service.getUserProgress(mockUserId, mockTenantId);

      expect(result.level).toBe(5); // 1000 points = level 5
    });
  });

  describe("awardPoints", () => {
    beforeEach(() => {
      mockPrisma.userGamificationStats.findUnique.mockResolvedValue(
        mockGamificationStats,
      );
      mockPrisma.userGamificationStats.update.mockResolvedValue({});
    });

    it("should award points to user", async () => {
      const result = await service.awardPoints(
        mockUserId,
        mockTenantId,
        100,
        "Completed lesson",
      );

      expect(result.pointsAwarded).toBe(100);
      expect(result.newTotal).toBe(600);
      expect(mockPrisma.userGamificationStats.update).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: {
          totalPoints: 600,
          level: expect.any(Number),
        },
      });
    });

    it("should update level when points cross threshold", async () => {
      mockPrisma.userGamificationStats.findUnique.mockResolvedValue({
        ...mockGamificationStats,
        totalPoints: 800,
        level: 4,
      });

      const result = await service.awardPoints(
        mockUserId,
        mockTenantId,
        100,
        "Completed quiz",
      );

      expect(result.level).toBe(5); // 850 threshold crossed
    });
  });

  describe("updateStats", () => {
    beforeEach(() => {
      mockPrisma.userGamificationStats.findUnique.mockResolvedValue(
        mockGamificationStats,
      );
      mockPrisma.userGamificationStats.update.mockResolvedValue({});
    });

    it("should update user stats", async () => {
      const result = await service.updateStats(mockUserId, mockTenantId, {
        videosWatched: 15,
        lessonsCompleted: 12,
      });

      expect(result.videosWatched).toBe(15);
      expect(result.lessonsCompleted).toBe(12);
      expect(result.quizzesCompleted).toBe(5); // unchanged
    });
  });

  describe("getAchievementsWithStatus", () => {
    beforeEach(() => {
      mockPrisma.achievement.findMany.mockResolvedValue([mockAchievement]);
      mockPrisma.userAchievement.findMany.mockResolvedValue([
        { achievementId: mockAchievement.id, unlockedAt: new Date() },
      ]);
    });

    it("should return achievements with unlock status", async () => {
      const result = await service.getAchievementsWithStatus(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0].unlocked).toBe(true);
      expect(result[0].unlockedAt).toBeDefined();
    });

    it("should mark unlocked achievements correctly", async () => {
      mockPrisma.userAchievement.findMany.mockResolvedValue([]);

      const result = await service.getAchievementsWithStatus(mockUserId);

      expect(result[0].unlocked).toBe(false);
      expect(result[0].unlockedAt).toBeUndefined();
    });
  });

  describe("getUnlockedAchievements", () => {
    it("should return user unlocked achievements", async () => {
      mockPrisma.userAchievement.findMany.mockResolvedValue([
        { achievement: mockAchievement, unlockedAt: new Date() },
      ]);

      const result = await service.getUnlockedAchievements(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0].achievement.code).toBe("first_video");
    });
  });

  describe("unlockAchievement", () => {
    beforeEach(() => {
      mockPrisma.achievement.findUnique.mockResolvedValue(mockAchievement);
      mockPrisma.userAchievement.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({ tenantId: mockTenantId });
      mockPrisma.userGamificationStats.findUnique.mockResolvedValue(
        mockGamificationStats,
      );
      mockPrisma.userGamificationStats.update.mockResolvedValue({});
      mockPrisma.userAchievement.create.mockResolvedValue({
        achievement: mockAchievement,
      });
    });

    it("should unlock achievement for user", async () => {
      const result = await service.unlockAchievement(mockUserId, "first_video");

      expect(result).toBeDefined();
      expect(mockPrisma.userAchievement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUserId,
          achievementId: mockAchievement.id,
          pointsAwarded: 10,
        }),
        include: { achievement: true },
      });
    });

    it("should return null if achievement not found", async () => {
      mockPrisma.achievement.findUnique.mockResolvedValue(null);

      const result = await service.unlockAchievement(mockUserId, "nonexistent");

      expect(result).toBeNull();
    });

    it("should return null if already unlocked", async () => {
      mockPrisma.userAchievement.findUnique.mockResolvedValue({
        id: "existing",
      });

      const result = await service.unlockAchievement(mockUserId, "first_video");

      expect(result).toBeNull();
    });

    it("should return null if user not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.unlockAchievement(mockUserId, "first_video");

      expect(result).toBeNull();
    });

    it("should award achievement points", async () => {
      await service.unlockAchievement(mockUserId, "first_video");

      expect(mockPrisma.userGamificationStats.update).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: {
          totalPoints: 510, // 500 + 10 achievement points
        },
      });
    });
  });

  describe("checkAchievements", () => {
    beforeEach(() => {
      mockPrisma.userGamificationStats.findUnique.mockResolvedValue(
        mockGamificationStats,
      );
      mockPrisma.achievement.findUnique.mockResolvedValue(mockAchievement);
      mockPrisma.userAchievement.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({ tenantId: mockTenantId });
      mockPrisma.userGamificationStats.update.mockResolvedValue({});
      mockPrisma.userAchievement.create.mockResolvedValue({
        achievement: mockAchievement,
      });
    });

    it("should check and unlock eligible achievements", async () => {
      const result = await service.checkAchievements(mockUserId, mockTenantId);

      expect(result).toBeInstanceOf(Array);
    });

    it("should unlock video achievement when videos watched >= 1", async () => {
      mockPrisma.userGamificationStats.findUnique.mockResolvedValue({
        ...mockGamificationStats,
        stats: { ...mockGamificationStats.stats, videosWatched: 1 },
      });

      const result = await service.checkAchievements(mockUserId, mockTenantId);

      expect(result).toContain("first_video");
    });

    it("should unlock streak achievements", async () => {
      mockPrisma.userGamificationStats.findUnique.mockResolvedValue({
        ...mockGamificationStats,
        currentStreak: 7,
      });

      const result = await service.checkAchievements(mockUserId, mockTenantId);

      expect(result).toContain("streak_3");
      expect(result).toContain("streak_7");
    });
  });

  describe("recordDailyActivity", () => {
    beforeEach(() => {
      mockPrisma.dailyActivity.findFirst.mockResolvedValue(null);
      mockPrisma.dailyActivity.create.mockResolvedValue({});
      mockPrisma.userGamificationStats.findUnique.mockResolvedValue(
        mockGamificationStats,
      );
      mockPrisma.userGamificationStats.update.mockResolvedValue({});
      // Mock achievement checks
      mockPrisma.achievement.findUnique.mockResolvedValue(null);
    });

    it("should record daily activity and update streak", async () => {
      const result = await service.recordDailyActivity(
        mockUserId,
        mockTenantId,
      );

      expect(result.alreadyLogged).toBe(false);
      expect(result.currentStreak).toBeDefined();
      expect(mockPrisma.dailyActivity.create).toHaveBeenCalled();
    });

    it("should return alreadyLogged if activity exists for today", async () => {
      mockPrisma.dailyActivity.findFirst.mockResolvedValue({ id: "existing" });

      const result = await service.recordDailyActivity(
        mockUserId,
        mockTenantId,
      );

      expect(result.alreadyLogged).toBe(true);
    });

    it("should continue streak if activity yesterday", async () => {
      mockPrisma.dailyActivity.findFirst
        .mockResolvedValueOnce(null) // today check
        .mockResolvedValueOnce({ id: "yesterday" }); // yesterday check

      const result = await service.recordDailyActivity(
        mockUserId,
        mockTenantId,
      );

      expect(result.currentStreak).toBe(6); // 5 + 1
    });

    it("should reset streak if no activity yesterday", async () => {
      mockPrisma.dailyActivity.findFirst
        .mockResolvedValueOnce(null) // today
        .mockResolvedValueOnce(null); // yesterday

      const result = await service.recordDailyActivity(
        mockUserId,
        mockTenantId,
      );

      expect(result.currentStreak).toBe(1);
    });
  });

  describe("getActivityHistory", () => {
    it("should return activity history for specified days", async () => {
      const activities = [
        { activityDate: new Date(), pointsEarned: 100 },
        { activityDate: new Date(Date.now() - 86400000), pointsEarned: 50 },
      ];
      mockPrisma.dailyActivity.findMany.mockResolvedValue(activities);

      const result = await service.getActivityHistory(mockUserId, 7);

      expect(result).toHaveLength(2);
      expect(mockPrisma.dailyActivity.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          activityDate: { gte: expect.any(Date) },
        },
        orderBy: { activityDate: "desc" },
      });
    });

    it("should default to 30 days", async () => {
      mockPrisma.dailyActivity.findMany.mockResolvedValue([]);

      await service.getActivityHistory(mockUserId);

      const call = mockPrisma.dailyActivity.findMany.mock.calls[0][0];
      const startDate = call.where.activityDate.gte;
      const daysDiff = Math.round(
        (Date.now() - startDate.getTime()) / 86400000,
      );
      expect(daysDiff).toBeGreaterThanOrEqual(30);
    });
  });

  describe("getLeaderboard", () => {
    const mockLeaderboardStats = [
      { userId: "user-1", totalPoints: 1000, level: 5, currentStreak: 10 },
      { userId: "user-2", totalPoints: 800, level: 4, currentStreak: 5 },
    ];

    const mockUsers = [
      {
        id: "user-1",
        firstName: "John",
        lastName: "Doe",
        email: "john@test.com",
      },
      {
        id: "user-2",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@test.com",
      },
    ];

    beforeEach(() => {
      mockPrisma.userGamificationStats.findMany.mockResolvedValue(
        mockLeaderboardStats,
      );
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
    });

    it("should return leaderboard entries", async () => {
      const result = await service.getLeaderboard(mockTenantId);

      expect(result).toHaveLength(2);
      expect(result[0].rank).toBe(1);
      expect(result[0].userName).toBe("John Doe");
      expect(result[0].points).toBe(1000);
    });

    it("should use email if name not available", async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: "user-1",
          firstName: null,
          lastName: null,
          email: "john@test.com",
        },
      ]);

      const result = await service.getLeaderboard(mockTenantId);

      expect(result[0].userName).toBe("john@test.com");
    });

    it("should respect limit parameter", async () => {
      await service.getLeaderboard(
        mockTenantId,
        LeaderboardType.WEEKLY_POINTS,
        5,
      );

      expect(mockPrisma.userGamificationStats.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        orderBy: { totalPoints: "desc" },
        take: 5,
      });
    });
  });

  describe("getUserRank", () => {
    beforeEach(() => {
      mockPrisma.userGamificationStats.findUnique.mockResolvedValue(
        mockGamificationStats,
      );
      mockPrisma.userGamificationStats.count.mockResolvedValue(5);
    });

    it("should return user rank on leaderboard", async () => {
      const result = await service.getUserRank(mockUserId, mockTenantId);

      expect(result.rank).toBe(6); // 5 users with higher points + 1
      expect(result.points).toBe(500);
      expect(result.level).toBe(3);
    });

    it("should return rank 1 if no users have higher points", async () => {
      mockPrisma.userGamificationStats.count.mockResolvedValue(0);

      const result = await service.getUserRank(mockUserId, mockTenantId);

      expect(result.rank).toBe(1);
    });
  });
});
