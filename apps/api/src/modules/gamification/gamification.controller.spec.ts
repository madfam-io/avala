import { Test, TestingModule } from "@nestjs/testing";
import { GamificationController } from "./gamification.controller";
import { GamificationService } from "./gamification.service";
import { AuthenticatedRequest } from "../../common/interfaces";
import { LeaderboardType } from "@avala/db";

describe("GamificationController", () => {
  let controller: GamificationController;
  let gamificationService: jest.Mocked<GamificationService>;

  const mockGamificationService = {
    getUserProgress: jest.fn(),
    getUserStats: jest.fn(),
    getAchievementsWithStatus: jest.fn(),
    getUnlockedAchievements: jest.fn(),
    checkAchievements: jest.fn(),
    recordDailyActivity: jest.fn(),
    getActivityHistory: jest.fn(),
    getLeaderboard: jest.fn(),
    getUserRank: jest.fn(),
  };

  const mockReq = {
    user: { id: "user-1", tenantId: "tenant-1" },
  } as unknown as AuthenticatedRequest;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GamificationController],
      providers: [
        { provide: GamificationService, useValue: mockGamificationService },
      ],
    }).compile();

    controller = module.get<GamificationController>(GamificationController);
    gamificationService = module.get(GamificationService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getUserProgress", () => {
    it("should get user progress", async () => {
      gamificationService.getUserProgress.mockResolvedValue({} as any);
      await controller.getUserProgress(mockReq);
      expect(gamificationService.getUserProgress).toHaveBeenCalledWith(
        "user-1",
        "tenant-1",
      );
    });
  });

  describe("getUserStats", () => {
    it("should get user stats", async () => {
      gamificationService.getUserStats.mockResolvedValue({} as any);
      await controller.getUserStats(mockReq);
      expect(gamificationService.getUserStats).toHaveBeenCalledWith(
        "user-1",
        "tenant-1",
      );
    });
  });

  describe("getAchievements", () => {
    it("should get achievements with status", async () => {
      gamificationService.getAchievementsWithStatus.mockResolvedValue([]);
      await controller.getAchievements(mockReq);
      expect(
        gamificationService.getAchievementsWithStatus,
      ).toHaveBeenCalledWith("user-1");
    });
  });

  describe("getUnlockedAchievements", () => {
    it("should get unlocked achievements", async () => {
      gamificationService.getUnlockedAchievements.mockResolvedValue([]);
      await controller.getUnlockedAchievements(mockReq);
      expect(gamificationService.getUnlockedAchievements).toHaveBeenCalledWith(
        "user-1",
      );
    });
  });

  describe("checkAchievements", () => {
    it("should check achievements", async () => {
      gamificationService.checkAchievements.mockResolvedValue(["FIRST_LESSON"]);
      const result = await controller.checkAchievements(mockReq);
      expect(gamificationService.checkAchievements).toHaveBeenCalledWith(
        "user-1",
        "tenant-1",
      );
      expect(result).toEqual({ newlyUnlocked: ["FIRST_LESSON"] });
    });
  });

  describe("logDailyActivity", () => {
    it("should log daily activity", async () => {
      gamificationService.recordDailyActivity.mockResolvedValue({} as any);
      await controller.logDailyActivity(mockReq);
      expect(gamificationService.recordDailyActivity).toHaveBeenCalledWith(
        "user-1",
        "tenant-1",
      );
    });
  });

  describe("getActivityHistory", () => {
    it("should get activity history", async () => {
      gamificationService.getActivityHistory.mockResolvedValue([]);
      await controller.getActivityHistory(mockReq, 30);
      expect(gamificationService.getActivityHistory).toHaveBeenCalledWith(
        "user-1",
        30,
      );
    });
  });

  describe("getLeaderboard", () => {
    it("should get leaderboard", async () => {
      gamificationService.getLeaderboard.mockResolvedValue([]);
      await controller.getLeaderboard(
        mockReq,
        LeaderboardType.WEEKLY_POINTS,
        10,
      );
      expect(gamificationService.getLeaderboard).toHaveBeenCalledWith(
        "tenant-1",
        LeaderboardType.WEEKLY_POINTS,
        10,
      );
    });
  });

  describe("getUserRank", () => {
    it("should get user rank", async () => {
      gamificationService.getUserRank.mockResolvedValue({} as any);
      await controller.getUserRank(mockReq);
      expect(gamificationService.getUserRank).toHaveBeenCalledWith(
        "user-1",
        "tenant-1",
      );
    });
  });
});
