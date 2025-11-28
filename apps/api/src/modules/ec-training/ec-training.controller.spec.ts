import { Test, TestingModule } from "@nestjs/testing";
import { ECTrainingController } from "./ec-training.controller";
import { ECTrainingService } from "./ec-training.service";

describe("ECTrainingController", () => {
  let controller: ECTrainingController;
  let ecTrainingService: jest.Mocked<ECTrainingService>;

  const mockECTrainingService = {
    enrollUser: jest.fn(),
    findAllEnrollments: jest.fn(),
    findUserEnrollments: jest.fn(),
    findEnrollmentById: jest.fn(),
    findEnrollmentByUserAndEC: jest.fn(),
    withdrawEnrollment: jest.fn(),
    resetEnrollmentProgress: jest.fn(),
    getProgressSummary: jest.fn(),
    updateLessonProgress: jest.fn(),
    trackVideoProgress: jest.fn(),
    completeLesson: jest.fn(),
    startModule: jest.fn(),
    recalculateProgress: jest.fn(),
    getRecentActivity: jest.fn(),
    getECLeaderboard: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ECTrainingController],
      providers: [
        { provide: ECTrainingService, useValue: mockECTrainingService },
      ],
    }).compile();

    controller = module.get<ECTrainingController>(ECTrainingController);
    ecTrainingService = module.get(ECTrainingService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  // ENROLLMENTS
  describe("enrollUser", () => {
    it("should enroll user", async () => {
      ecTrainingService.enrollUser.mockResolvedValue({} as any);
      await controller.enrollUser({} as any);
      expect(ecTrainingService.enrollUser).toHaveBeenCalledWith({});
    });
  });

  describe("findAllEnrollments", () => {
    it("should find all enrollments", async () => {
      ecTrainingService.findAllEnrollments.mockResolvedValue({
        data: [],
        total: 0,
      } as any);
      await controller.findAllEnrollments({} as any);
      expect(ecTrainingService.findAllEnrollments).toHaveBeenCalledWith({});
    });
  });

  describe("findUserEnrollments", () => {
    it("should find user enrollments", async () => {
      ecTrainingService.findUserEnrollments.mockResolvedValue([]);
      await controller.findUserEnrollments("user-1", {} as any);
      expect(ecTrainingService.findUserEnrollments).toHaveBeenCalledWith(
        "user-1",
        {},
      );
    });
  });

  describe("findEnrollmentById", () => {
    it("should find enrollment by id", async () => {
      ecTrainingService.findEnrollmentById.mockResolvedValue({} as any);
      await controller.findEnrollmentById("enroll-1");
      expect(ecTrainingService.findEnrollmentById).toHaveBeenCalledWith(
        "enroll-1",
      );
    });
  });

  describe("findEnrollmentByUserAndEC", () => {
    it("should find enrollment by user and EC", async () => {
      ecTrainingService.findEnrollmentByUserAndEC.mockResolvedValue({} as any);
      await controller.findEnrollmentByUserAndEC("user-1", "EC0249");
      expect(ecTrainingService.findEnrollmentByUserAndEC).toHaveBeenCalledWith(
        "user-1",
        "EC0249",
      );
    });
  });

  describe("withdrawEnrollment", () => {
    it("should withdraw enrollment", async () => {
      ecTrainingService.withdrawEnrollment.mockResolvedValue({} as any);
      await controller.withdrawEnrollment("enroll-1");
      expect(ecTrainingService.withdrawEnrollment).toHaveBeenCalledWith(
        "enroll-1",
      );
    });
  });

  describe("resetProgress", () => {
    it("should reset progress", async () => {
      ecTrainingService.resetEnrollmentProgress.mockResolvedValue({} as any);
      await controller.resetProgress("enroll-1");
      expect(ecTrainingService.resetEnrollmentProgress).toHaveBeenCalledWith(
        "enroll-1",
      );
    });
  });

  // PROGRESS TRACKING
  describe("getProgressSummary", () => {
    it("should get progress summary", async () => {
      ecTrainingService.getProgressSummary.mockResolvedValue({} as any);
      await controller.getProgressSummary("enroll-1");
      expect(ecTrainingService.getProgressSummary).toHaveBeenCalledWith(
        "enroll-1",
      );
    });
  });

  describe("updateLessonProgress", () => {
    it("should update lesson progress", async () => {
      ecTrainingService.updateLessonProgress.mockResolvedValue({} as any);
      await controller.updateLessonProgress("enroll-1", "lesson-1", {} as any);
      expect(ecTrainingService.updateLessonProgress).toHaveBeenCalledWith(
        "enroll-1",
        "lesson-1",
        {},
      );
    });
  });

  describe("trackVideoProgress", () => {
    it("should track video progress", async () => {
      ecTrainingService.trackVideoProgress.mockResolvedValue({} as any);
      await controller.trackVideoProgress("enroll-1", "lesson-1", {} as any);
      expect(ecTrainingService.trackVideoProgress).toHaveBeenCalledWith(
        "enroll-1",
        "lesson-1",
        {},
      );
    });
  });

  describe("completeLesson", () => {
    it("should complete lesson", async () => {
      ecTrainingService.completeLesson.mockResolvedValue({} as any);
      await controller.completeLesson("enroll-1", "lesson-1");
      expect(ecTrainingService.completeLesson).toHaveBeenCalledWith(
        "enroll-1",
        "lesson-1",
      );
    });
  });

  describe("startModule", () => {
    it("should start module", async () => {
      ecTrainingService.startModule.mockResolvedValue({} as any);
      await controller.startModule("enroll-1", "mod-1");
      expect(ecTrainingService.startModule).toHaveBeenCalledWith(
        "enroll-1",
        "mod-1",
      );
    });
  });

  describe("recalculateProgress", () => {
    it("should recalculate progress", async () => {
      ecTrainingService.recalculateProgress.mockResolvedValue({} as any);
      await controller.recalculateProgress("enroll-1");
      expect(ecTrainingService.recalculateProgress).toHaveBeenCalledWith(
        "enroll-1",
      );
    });
  });

  // ACTIVITY & LEADERBOARD
  describe("getRecentActivity", () => {
    it("should get recent activity", async () => {
      ecTrainingService.getRecentActivity.mockResolvedValue([]);
      await controller.getRecentActivity("enroll-1", 10);
      expect(ecTrainingService.getRecentActivity).toHaveBeenCalledWith(
        "enroll-1",
        10,
      );
    });
  });

  describe("getLeaderboard", () => {
    it("should get leaderboard", async () => {
      ecTrainingService.getECLeaderboard.mockResolvedValue([]);
      await controller.getLeaderboard("EC0249", "tenant-1", 10);
      expect(ecTrainingService.getECLeaderboard).toHaveBeenCalledWith(
        "EC0249",
        "tenant-1",
        10,
      );
    });
  });
});
