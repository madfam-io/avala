import { Test, TestingModule } from "@nestjs/testing";
import { GamificationEventsListener } from "./gamification-events.listener";
import { AchievementEngineService } from "./achievement-engine.service";
import { StreakService } from "./streak.service";
import { GamificationService } from "./gamification.service";

describe("GamificationEventsListener", () => {
  let listener: GamificationEventsListener;
  let achievementEngine: jest.Mocked<AchievementEngineService>;
  let streakService: jest.Mocked<StreakService>;
  let gamificationService: jest.Mocked<GamificationService>;

  const mockUserId = "user-123";
  const mockTenantId = "tenant-456";

  beforeEach(async () => {
    const mockAchievementEngine = {
      onVideoWatched: jest.fn().mockResolvedValue([]),
      onLessonCompleted: jest.fn().mockResolvedValue([]),
      onModuleCompleted: jest.fn().mockResolvedValue([]),
      onQuizCompleted: jest.fn().mockResolvedValue([]),
      onCourseCompleted: jest.fn().mockResolvedValue([]),
      onCertificateEarned: jest.fn().mockResolvedValue([]),
      onDocumentGenerated: jest.fn().mockResolvedValue([]),
      onStreakUpdated: jest.fn().mockResolvedValue([]),
    };

    const mockStreakService = {
      recordActivity: jest.fn().mockResolvedValue({
        newStreak: 1,
        streakExtended: false,
        streakBroken: false,
      }),
    };

    const mockGamificationService = {
      awardPoints: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationEventsListener,
        { provide: AchievementEngineService, useValue: mockAchievementEngine },
        { provide: StreakService, useValue: mockStreakService },
        { provide: GamificationService, useValue: mockGamificationService },
      ],
    }).compile();

    listener = module.get<GamificationEventsListener>(
      GamificationEventsListener,
    );
    achievementEngine = module.get(AchievementEngineService);
    streakService = module.get(StreakService);
    gamificationService = module.get(GamificationService);
  });

  it("should be defined", () => {
    expect(listener).toBeDefined();
  });

  describe("handleVideoWatched", () => {
    const videoEvent = {
      userId: mockUserId,
      tenantId: mockTenantId,
      videoId: "video-123",
      duration: 300,
      completed: true,
    };

    it("should record activity when video is watched", async () => {
      await listener.handleVideoWatched(videoEvent);

      expect(streakService.recordActivity).toHaveBeenCalledWith(
        mockUserId,
        mockTenantId,
        "video",
        5,
      );
    });

    it("should check achievements when video is completed", async () => {
      await listener.handleVideoWatched(videoEvent);

      expect(achievementEngine.onVideoWatched).toHaveBeenCalledWith(
        mockUserId,
        mockTenantId,
      );
    });

    it("should not check achievements when video is not completed", async () => {
      await listener.handleVideoWatched({ ...videoEvent, completed: false });

      expect(achievementEngine.onVideoWatched).not.toHaveBeenCalled();
    });

    it("should log unlocked achievements", async () => {
      achievementEngine.onVideoWatched.mockResolvedValue([
        "first_video",
        "video_watcher",
      ]);

      await listener.handleVideoWatched(videoEvent);

      expect(achievementEngine.onVideoWatched).toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      streakService.recordActivity.mockRejectedValue(new Error("Test error"));

      await expect(
        listener.handleVideoWatched(videoEvent),
      ).resolves.not.toThrow();
    });
  });

  describe("handleLessonCompleted", () => {
    const lessonEvent = {
      userId: mockUserId,
      tenantId: mockTenantId,
      lessonId: "lesson-123",
      moduleId: "module-456",
      courseId: "course-789",
    };

    it("should record activity with 15 points", async () => {
      await listener.handleLessonCompleted(lessonEvent);

      expect(streakService.recordActivity).toHaveBeenCalledWith(
        mockUserId,
        mockTenantId,
        "lesson",
        15,
      );
    });

    it("should award 15 points", async () => {
      await listener.handleLessonCompleted(lessonEvent);

      expect(gamificationService.awardPoints).toHaveBeenCalledWith(
        mockUserId,
        mockTenantId,
        15,
        "Completed lesson",
      );
    });

    it("should check lesson achievements", async () => {
      await listener.handleLessonCompleted(lessonEvent);

      expect(achievementEngine.onLessonCompleted).toHaveBeenCalledWith(
        mockUserId,
        mockTenantId,
      );
    });

    it("should handle errors gracefully", async () => {
      streakService.recordActivity.mockRejectedValue(new Error("Test error"));

      await expect(
        listener.handleLessonCompleted(lessonEvent),
      ).resolves.not.toThrow();
    });
  });

  describe("handleModuleCompleted", () => {
    const moduleEvent = {
      userId: mockUserId,
      tenantId: mockTenantId,
      moduleId: "module-123",
      courseId: "course-456",
    };

    it("should record activity with 50 points", async () => {
      await listener.handleModuleCompleted(moduleEvent);

      expect(streakService.recordActivity).toHaveBeenCalledWith(
        mockUserId,
        mockTenantId,
        "module",
        50,
      );
    });

    it("should award 50 points", async () => {
      await listener.handleModuleCompleted(moduleEvent);

      expect(gamificationService.awardPoints).toHaveBeenCalledWith(
        mockUserId,
        mockTenantId,
        50,
        "Completed module",
      );
    });

    it("should check module achievements", async () => {
      await listener.handleModuleCompleted(moduleEvent);

      expect(achievementEngine.onModuleCompleted).toHaveBeenCalledWith(
        mockUserId,
        mockTenantId,
      );
    });

    it("should handle errors gracefully", async () => {
      streakService.recordActivity.mockRejectedValue(new Error("Test error"));

      await expect(
        listener.handleModuleCompleted(moduleEvent),
      ).resolves.not.toThrow();
    });
  });

  describe("handleQuizCompleted", () => {
    const quizEvent = {
      userId: mockUserId,
      tenantId: mockTenantId,
      quizId: "quiz-123",
      score: 80,
      maxScore: 100,
      passed: true,
    };

    it("should award 50 points for perfect score", async () => {
      await listener.handleQuizCompleted({ ...quizEvent, score: 100 });

      expect(gamificationService.awardPoints).toHaveBeenCalledWith(
        mockUserId,
        mockTenantId,
        50,
        "Completed quiz with 100% score",
      );
    });

    it("should award 40 points for 90%+ score", async () => {
      await listener.handleQuizCompleted({ ...quizEvent, score: 95 });

      expect(gamificationService.awardPoints).toHaveBeenCalledWith(
        mockUserId,
        mockTenantId,
        40,
        "Completed quiz with 95% score",
      );
    });

    it("should award 30 points for 80%+ score", async () => {
      await listener.handleQuizCompleted({ ...quizEvent, score: 85 });

      expect(gamificationService.awardPoints).toHaveBeenCalledWith(
        mockUserId,
        mockTenantId,
        30,
        "Completed quiz with 85% score",
      );
    });

    it("should award 20 base points for lower scores", async () => {
      await listener.handleQuizCompleted({ ...quizEvent, score: 70 });

      expect(gamificationService.awardPoints).toHaveBeenCalledWith(
        mockUserId,
        mockTenantId,
        20,
        "Completed quiz with 70% score",
      );
    });

    it("should check quiz achievements with score", async () => {
      await listener.handleQuizCompleted(quizEvent);

      expect(achievementEngine.onQuizCompleted).toHaveBeenCalledWith(
        mockUserId,
        mockTenantId,
        80,
        100,
      );
    });

    it("should handle errors gracefully", async () => {
      streakService.recordActivity.mockRejectedValue(new Error("Test error"));

      await expect(
        listener.handleQuizCompleted(quizEvent),
      ).resolves.not.toThrow();
    });
  });

  describe("handleCourseCompleted", () => {
    const courseEvent = {
      userId: mockUserId,
      tenantId: mockTenantId,
      courseId: "course-123",
      enrollmentId: "enrollment-456",
    };

    it("should award 200 points for course completion", async () => {
      await listener.handleCourseCompleted(courseEvent);

      expect(gamificationService.awardPoints).toHaveBeenCalledWith(
        mockUserId,
        mockTenantId,
        200,
        "Completed course",
      );
    });

    it("should check course achievements", async () => {
      await listener.handleCourseCompleted(courseEvent);

      expect(achievementEngine.onCourseCompleted).toHaveBeenCalledWith(
        mockUserId,
        mockTenantId,
      );
    });

    it("should handle errors gracefully", async () => {
      gamificationService.awardPoints.mockRejectedValue(
        new Error("Test error"),
      );

      await expect(
        listener.handleCourseCompleted(courseEvent),
      ).resolves.not.toThrow();
    });
  });

  describe("handleCertificateEarned", () => {
    const certificateEvent = {
      userId: mockUserId,
      tenantId: mockTenantId,
      certificateId: "cert-123",
      courseId: "course-456",
    };

    it("should award 100 points for certificate", async () => {
      await listener.handleCertificateEarned(certificateEvent);

      expect(gamificationService.awardPoints).toHaveBeenCalledWith(
        mockUserId,
        mockTenantId,
        100,
        "Earned certificate",
      );
    });

    it("should check certificate achievements", async () => {
      await listener.handleCertificateEarned(certificateEvent);

      expect(achievementEngine.onCertificateEarned).toHaveBeenCalledWith(
        mockUserId,
        mockTenantId,
      );
    });

    it("should handle errors gracefully", async () => {
      gamificationService.awardPoints.mockRejectedValue(
        new Error("Test error"),
      );

      await expect(
        listener.handleCertificateEarned(certificateEvent),
      ).resolves.not.toThrow();
    });
  });

  describe("handleDocumentGenerated", () => {
    const documentEvent = {
      userId: mockUserId,
      tenantId: mockTenantId,
      documentType: "DC3",
      documentId: "doc-123",
    };

    it("should award 10 points for document generation", async () => {
      await listener.handleDocumentGenerated(documentEvent);

      expect(gamificationService.awardPoints).toHaveBeenCalledWith(
        mockUserId,
        mockTenantId,
        10,
        "Generated DC3 document",
      );
    });

    it("should check document achievements", async () => {
      await listener.handleDocumentGenerated(documentEvent);

      expect(achievementEngine.onDocumentGenerated).toHaveBeenCalledWith(
        mockUserId,
        mockTenantId,
      );
    });

    it("should handle errors gracefully", async () => {
      gamificationService.awardPoints.mockRejectedValue(
        new Error("Test error"),
      );

      await expect(
        listener.handleDocumentGenerated(documentEvent),
      ).resolves.not.toThrow();
    });
  });

  describe("handleUserLogin", () => {
    const loginEvent = {
      userId: mockUserId,
      tenantId: mockTenantId,
    };

    it("should record login activity", async () => {
      await listener.handleUserLogin(loginEvent);

      expect(streakService.recordActivity).toHaveBeenCalledWith(
        mockUserId,
        mockTenantId,
        "login",
        1,
      );
    });

    it("should check streak achievements when streak is extended", async () => {
      streakService.recordActivity.mockResolvedValue({
        newStreak: 5,
        streakExtended: true,
        streakBroken: false,
      });

      await listener.handleUserLogin(loginEvent);

      expect(achievementEngine.onStreakUpdated).toHaveBeenCalledWith(
        mockUserId,
        mockTenantId,
      );
    });

    it("should not check streak achievements when streak is not extended", async () => {
      streakService.recordActivity.mockResolvedValue({
        newStreak: 1,
        streakExtended: false,
        streakBroken: false,
      });

      await listener.handleUserLogin(loginEvent);

      expect(achievementEngine.onStreakUpdated).not.toHaveBeenCalled();
    });

    it("should log when streak is broken", async () => {
      streakService.recordActivity.mockResolvedValue({
        newStreak: 0,
        streakExtended: false,
        streakBroken: true,
      });

      await listener.handleUserLogin(loginEvent);

      // Just ensure it doesn't throw
      expect(streakService.recordActivity).toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      streakService.recordActivity.mockRejectedValue(new Error("Test error"));

      await expect(listener.handleUserLogin(loginEvent)).resolves.not.toThrow();
    });
  });
});
