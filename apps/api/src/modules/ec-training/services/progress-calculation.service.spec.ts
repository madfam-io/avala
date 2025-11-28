import { Test, TestingModule } from "@nestjs/testing";
import { ProgressCalculationService } from "./progress-calculation.service";
import { PrismaService } from "../../../database/prisma.service";

describe("ProgressCalculationService", () => {
  let service: ProgressCalculationService;
  let mockPrismaService: any;

  const mockEnrollmentId = "enrollment-1";

  const mockEnrollment = {
    id: mockEnrollmentId,
    userId: "user-1",
    ecId: "ec-1",
    status: "IN_PROGRESS",
    overallProgress: 0,
    completedAt: null,
    ec: {
      code: "EC0249",
      modules: [
        {
          id: "module-1",
          estimatedMinutes: 60,
          lessons: [
            { id: "lesson-1", title: "Lesson 1", videoId: "video-1" },
            { id: "lesson-2", title: "Lesson 2", videoId: "video-2" },
          ],
          assessments: [{ id: "assessment-1" }],
        },
      ],
      templates: [{ id: "template-1" }],
    },
    moduleProgress: [
      { moduleId: "module-1", status: "IN_PROGRESS", progress: 50 },
    ],
    lessonProgress: [
      { lessonId: "lesson-1", status: "COMPLETED", videoProgress: 100 },
      { lessonId: "lesson-2", status: "NOT_STARTED", videoProgress: 0 },
    ],
    documents: [{ isComplete: false }],
    assessmentAttempts: [{ passed: true }],
  };

  beforeEach(async () => {
    const mockPrisma = {
      eCEnrollment: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      eCModuleProgress: {
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressCalculationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProgressCalculationService>(
      ProgressCalculationService,
    );
    mockPrismaService = mockPrisma;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("recalculateProgress", () => {
    it("should recalculate overall progress", async () => {
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(
        mockEnrollment as any,
      );
      mockPrismaService.eCModuleProgress.update.mockResolvedValue({} as any);
      mockPrismaService.eCEnrollment.update.mockResolvedValue({
        ...mockEnrollment,
        overallProgress: 50,
      } as any);

      const result = await service.recalculateProgress(mockEnrollmentId);

      expect(result.overallProgress).toBe(50);
      expect(mockPrismaService.eCModuleProgress.update).toHaveBeenCalled();
      expect(mockPrismaService.eCEnrollment.update).toHaveBeenCalled();
    });

    it("should mark as completed at 100%", async () => {
      const completedEnrollment = {
        ...mockEnrollment,
        lessonProgress: [
          { lessonId: "lesson-1", status: "COMPLETED", videoProgress: 100 },
          { lessonId: "lesson-2", status: "COMPLETED", videoProgress: 100 },
        ],
      };

      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(
        completedEnrollment as any,
      );
      mockPrismaService.eCModuleProgress.update.mockResolvedValue({} as any);
      mockPrismaService.eCEnrollment.update.mockResolvedValue({
        ...completedEnrollment,
        overallProgress: 100,
        status: "COMPLETED",
      } as any);

      const result = await service.recalculateProgress(mockEnrollmentId);

      expect(result.overallProgress).toBe(100);
      expect(result.status).toBe("COMPLETED");
    });

    it("should throw error if enrollment not found", async () => {
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(null);

      await expect(service.recalculateProgress("invalid")).rejects.toThrow();
    });
  });

  describe("getProgressSummary", () => {
    it("should return comprehensive summary", async () => {
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(
        mockEnrollment as any,
      );

      const result = await service.getProgressSummary(mockEnrollmentId);

      expect(result.enrollmentId).toBe(mockEnrollmentId);
      expect(result.ecCode).toBe("EC0249");
      expect(result.lessonsTotal).toBe(2);
      expect(result.lessonsCompleted).toBe(1);
      expect(result.modulesTotal).toBe(1);
    });

    it("should calculate time estimates", async () => {
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(
        mockEnrollment as any,
      );

      const result = await service.getProgressSummary(mockEnrollmentId);

      expect(result.timeSpent).toBeDefined();
      expect(result.estimatedTimeRemaining).toBeDefined();
    });

    it("should find next lesson", async () => {
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(
        mockEnrollment as any,
      );

      const result = await service.getProgressSummary(mockEnrollmentId);

      expect(result.nextLesson).toBeDefined();
      expect(result.nextLesson?.id).toBe("lesson-2");
    });

    it("should return null next lesson when all complete", async () => {
      const completedEnrollment = {
        ...mockEnrollment,
        moduleProgress: [
          { moduleId: "module-1", status: "COMPLETED", progress: 100 },
        ],
        lessonProgress: [
          { lessonId: "lesson-1", status: "COMPLETED", videoProgress: 100 },
          { lessonId: "lesson-2", status: "COMPLETED", videoProgress: 100 },
        ],
      };

      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(
        completedEnrollment as any,
      );

      const result = await service.getProgressSummary(mockEnrollmentId);

      expect(result.nextLesson).toBeNull();
    });

    it("should check certification readiness", async () => {
      const readyEnrollment = {
        ...mockEnrollment,
        moduleProgress: [
          { moduleId: "module-1", status: "COMPLETED", progress: 100 },
        ],
        lessonProgress: [
          { lessonId: "lesson-1", status: "COMPLETED", videoProgress: 100 },
          { lessonId: "lesson-2", status: "COMPLETED", videoProgress: 100 },
        ],
        documents: [{ isComplete: true }],
        assessmentAttempts: [{ passed: true }],
      };

      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(
        readyEnrollment as any,
      );

      const result = await service.getProgressSummary(mockEnrollmentId);

      expect(result.certificationReady).toBe(true);
    });

    it("should count videos watched", async () => {
      const enrollmentWithVideos = {
        ...mockEnrollment,
        lessonProgress: [
          { lessonId: "lesson-1", status: "COMPLETED", videoProgress: 95 },
          { lessonId: "lesson-2", status: "IN_PROGRESS", videoProgress: 50 },
        ],
      };

      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(
        enrollmentWithVideos as any,
      );

      const result = await service.getProgressSummary(mockEnrollmentId);

      expect(result.videosTotal).toBe(2);
      expect(result.videosWatched).toBe(1);
    });

    it("should throw error if enrollment not found", async () => {
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(null);

      await expect(service.getProgressSummary("invalid")).rejects.toThrow();
    });
  });
});
