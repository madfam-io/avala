import { Test, TestingModule } from "@nestjs/testing";
import { AchievementEngineService } from "./achievement-engine.service";
import { PrismaService } from "../../database/prisma.service";
import { GamificationService } from "./gamification.service";

describe("AchievementEngineService", () => {
  let service: AchievementEngineService;

  const mockUserId = "user-123";
  const mockTenantId = "tenant-123";

  const mockStatsRecord = {
    userId: mockUserId,
    totalPoints: 500,
    level: 3,
    currentStreak: 5,
    longestStreak: 10,
    stats: {
      videosWatched: 5,
      lessonsCompleted: 10,
      quizzesCompleted: 3,
      modulesCompleted: 2,
      perfectScores: 1,
      documentsGenerated: 0,
    },
  };

  const mockPrismaService = {
    enrollment: {
      count: jest.fn(),
    },
    certificate: {
      count: jest.fn(),
    },
    quizAttempt: {
      findMany: jest.fn(),
    },
  };

  const mockGamificationService = {
    getUserStats: jest.fn(),
    unlockAchievement: jest.fn(),
    updateStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AchievementEngineService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: GamificationService, useValue: mockGamificationService },
      ],
    }).compile();

    service = module.get<AchievementEngineService>(AchievementEngineService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("evaluateAllAchievements", () => {
    beforeEach(() => {
      mockGamificationService.getUserStats.mockResolvedValue(mockStatsRecord);
      mockPrismaService.enrollment.count.mockResolvedValue(2);
      mockPrismaService.certificate.count.mockResolvedValue(1);
      mockPrismaService.quizAttempt.findMany.mockResolvedValue([
        { percentage: 80 },
        { percentage: 90 },
      ]);
    });

    it("should evaluate and unlock eligible achievements", async () => {
      mockGamificationService.unlockAchievement.mockResolvedValue(true);

      const result = await service.evaluateAllAchievements(
        mockUserId,
        mockTenantId,
      );

      expect(mockGamificationService.getUserStats).toHaveBeenCalled();
      expect(result.length).toBeGreaterThan(0);
    });

    it("should not include already unlocked achievements", async () => {
      mockGamificationService.unlockAchievement.mockResolvedValue(false);

      const result = await service.evaluateAllAchievements(
        mockUserId,
        mockTenantId,
      );

      expect(result).toEqual([]);
    });
  });

  describe("evaluateCategory", () => {
    beforeEach(() => {
      mockGamificationService.getUserStats.mockResolvedValue(mockStatsRecord);
      mockPrismaService.enrollment.count.mockResolvedValue(0);
      mockPrismaService.certificate.count.mockResolvedValue(0);
      mockPrismaService.quizAttempt.findMany.mockResolvedValue([]);
    });

    it("should evaluate FIRST_STEPS category", async () => {
      mockGamificationService.unlockAchievement.mockResolvedValue(true);

      const result = await service.evaluateCategory(
        mockUserId,
        mockTenantId,
        "FIRST_STEPS",
      );

      expect(mockGamificationService.unlockAchievement).toHaveBeenCalledWith(
        mockUserId,
        expect.stringContaining("first_"),
      );
      expect(result.length).toBeGreaterThan(0);
    });

    it("should evaluate STREAKS category", async () => {
      mockGamificationService.unlockAchievement.mockResolvedValue(true);

      const result = await service.evaluateCategory(
        mockUserId,
        mockTenantId,
        "STREAKS",
      );

      expect(result).toContain("streak_3"); // currentStreak is 5
    });

    it("should evaluate MODULES category", async () => {
      mockGamificationService.unlockAchievement.mockResolvedValue(true);

      const result = await service.evaluateCategory(
        mockUserId,
        mockTenantId,
        "MODULES",
      );

      // modulesCompleted is 2, so no module achievements unlocked
      expect(result).toEqual([]);
    });
  });

  describe("event handlers", () => {
    beforeEach(() => {
      mockGamificationService.getUserStats.mockResolvedValue(mockStatsRecord);
      mockGamificationService.updateStats.mockResolvedValue(undefined);
      mockGamificationService.unlockAchievement.mockResolvedValue(true);
      mockPrismaService.enrollment.count.mockResolvedValue(0);
      mockPrismaService.certificate.count.mockResolvedValue(0);
      mockPrismaService.quizAttempt.findMany.mockResolvedValue([]);
    });

    it("should handle onVideoWatched event", async () => {
      const result = await service.onVideoWatched(mockUserId, mockTenantId);

      expect(mockGamificationService.updateStats).toHaveBeenCalledWith(
        mockUserId,
        mockTenantId,
        expect.objectContaining({ videosWatched: 6 }),
      );
      expect(result).toBeDefined();
    });

    it("should handle onLessonCompleted event", async () => {
      const result = await service.onLessonCompleted(mockUserId, mockTenantId);

      expect(mockGamificationService.updateStats).toHaveBeenCalledWith(
        mockUserId,
        mockTenantId,
        expect.objectContaining({ lessonsCompleted: 11 }),
      );
      expect(result).toBeDefined();
    });

    it("should handle onModuleCompleted event", async () => {
      const result = await service.onModuleCompleted(mockUserId, mockTenantId);

      expect(mockGamificationService.updateStats).toHaveBeenCalledWith(
        mockUserId,
        mockTenantId,
        expect.objectContaining({ modulesCompleted: 3 }),
      );
      expect(result).toBeDefined();
    });

    it("should handle onQuizCompleted event with perfect score", async () => {
      const result = await service.onQuizCompleted(
        mockUserId,
        mockTenantId,
        100,
        100,
      );

      expect(mockGamificationService.updateStats).toHaveBeenCalledWith(
        mockUserId,
        mockTenantId,
        expect.objectContaining({
          quizzesCompleted: 4,
          perfectScores: 2,
        }),
      );
      expect(result).toBeDefined();
    });

    it("should handle onQuizCompleted event without perfect score", async () => {
      await service.onQuizCompleted(mockUserId, mockTenantId, 80, 100);

      expect(mockGamificationService.updateStats).toHaveBeenCalledWith(
        mockUserId,
        mockTenantId,
        expect.objectContaining({
          quizzesCompleted: 4,
          perfectScores: 1, // unchanged
        }),
      );
    });

    it("should handle onCourseCompleted event", async () => {
      const result = await service.onCourseCompleted(mockUserId, mockTenantId);

      expect(result).toBeDefined();
    });

    it("should handle onCertificateEarned event", async () => {
      const result = await service.onCertificateEarned(
        mockUserId,
        mockTenantId,
      );

      expect(result).toBeDefined();
    });

    it("should handle onDocumentGenerated event", async () => {
      const result = await service.onDocumentGenerated(
        mockUserId,
        mockTenantId,
      );

      expect(mockGamificationService.updateStats).toHaveBeenCalledWith(
        mockUserId,
        mockTenantId,
        expect.objectContaining({ documentsGenerated: 1 }),
      );
      expect(result).toBeDefined();
    });

    it("should handle onStreakUpdated event", async () => {
      const result = await service.onStreakUpdated(mockUserId, mockTenantId);

      expect(result).toBeDefined();
    });
  });
});
