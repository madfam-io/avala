import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { LessonProgressService } from "./lesson-progress.service";
import { ProgressCalculationService } from "./progress-calculation.service";
import { PrismaService } from "../../../database/prisma.service";

describe("LessonProgressService", () => {
  let service: LessonProgressService;
  let mockPrismaService: any;
  let progressCalculation: jest.Mocked<ProgressCalculationService>;

  const mockEnrollmentId = "enrollment-1";
  const mockLessonId = "lesson-1";
  const mockModuleId = "module-1";

  const mockLessonProgress = {
    enrollmentId: mockEnrollmentId,
    lessonId: mockLessonId,
    status: "NOT_STARTED",
    videoProgress: 0,
    startedAt: null,
    completedAt: null,
  };

  const mockModuleProgress = {
    enrollmentId: mockEnrollmentId,
    moduleId: mockModuleId,
    status: "NOT_STARTED",
    progress: 0,
    startedAt: null,
    completedAt: null,
  };

  beforeEach(async () => {
    const mockPrisma = {
      eCLessonProgress: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      eCModuleProgress: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockProgressCalculation = {
      recalculateProgress: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonProgressService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: ProgressCalculationService,
          useValue: mockProgressCalculation,
        },
      ],
    }).compile();

    service = module.get<LessonProgressService>(LessonProgressService);
    mockPrismaService = mockPrisma;
    progressCalculation = module.get(ProgressCalculationService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("updateLessonProgress", () => {
    it("should update lesson status", async () => {
      mockPrismaService.eCLessonProgress.findUnique.mockResolvedValue(
        mockLessonProgress as any,
      );
      mockPrismaService.eCLessonProgress.update.mockResolvedValue({
        ...mockLessonProgress,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      } as any);
      progressCalculation.recalculateProgress.mockResolvedValue({
        overallProgress: 10,
        status: "IN_PROGRESS",
      });

      const result = await service.updateLessonProgress(
        mockEnrollmentId,
        mockLessonId,
        { status: "IN_PROGRESS" },
      );

      expect(result.status).toBe("IN_PROGRESS");
      expect(progressCalculation.recalculateProgress).toHaveBeenCalledWith(
        mockEnrollmentId,
      );
    });

    it("should update video progress", async () => {
      mockPrismaService.eCLessonProgress.findUnique.mockResolvedValue(
        mockLessonProgress as any,
      );
      mockPrismaService.eCLessonProgress.update.mockResolvedValue({
        ...mockLessonProgress,
        videoProgress: 50,
        status: "IN_PROGRESS",
      } as any);
      progressCalculation.recalculateProgress.mockResolvedValue({
        overallProgress: 25,
        status: "IN_PROGRESS",
      });

      const result = await service.updateLessonProgress(
        mockEnrollmentId,
        mockLessonId,
        { videoProgress: 50 },
      );

      expect(result.videoProgress).toBe(50);
    });

    it("should auto-complete at 90% video progress", async () => {
      mockPrismaService.eCLessonProgress.findUnique.mockResolvedValue({
        ...mockLessonProgress,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      } as any);
      mockPrismaService.eCLessonProgress.update.mockResolvedValue({
        ...mockLessonProgress,
        videoProgress: 95,
        status: "COMPLETED",
        completedAt: new Date(),
      } as any);
      progressCalculation.recalculateProgress.mockResolvedValue({
        overallProgress: 50,
        status: "IN_PROGRESS",
      });

      const result = await service.updateLessonProgress(
        mockEnrollmentId,
        mockLessonId,
        { videoProgress: 95 },
      );

      expect(result.status).toBe("COMPLETED");
    });

    it("should mark lesson complete when requested", async () => {
      mockPrismaService.eCLessonProgress.findUnique.mockResolvedValue(
        mockLessonProgress as any,
      );
      mockPrismaService.eCLessonProgress.update.mockResolvedValue({
        ...mockLessonProgress,
        status: "COMPLETED",
        videoProgress: 100,
        completedAt: new Date(),
      } as any);
      progressCalculation.recalculateProgress.mockResolvedValue({
        overallProgress: 100,
        status: "COMPLETED",
      });

      const result = await service.updateLessonProgress(
        mockEnrollmentId,
        mockLessonId,
        { markCompleted: true },
      );

      expect(result.status).toBe("COMPLETED");
      expect(result.videoProgress).toBe(100);
    });

    it("should throw NotFoundException if not found", async () => {
      mockPrismaService.eCLessonProgress.findUnique.mockResolvedValue(null);

      await expect(
        service.updateLessonProgress(mockEnrollmentId, "invalid", {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("trackVideoProgress", () => {
    it("should track video progress", async () => {
      mockPrismaService.eCLessonProgress.findUnique.mockResolvedValue(
        mockLessonProgress as any,
      );
      mockPrismaService.eCLessonProgress.update.mockResolvedValue({
        ...mockLessonProgress,
        videoProgress: 75,
      } as any);
      progressCalculation.recalculateProgress.mockResolvedValue({
        overallProgress: 37,
        status: "IN_PROGRESS",
      });

      const result = await service.trackVideoProgress(
        mockEnrollmentId,
        mockLessonId,
        { progress: 75 },
      );

      expect(result.videoProgress).toBe(75);
    });
  });

  describe("completeLesson", () => {
    it("should complete lesson", async () => {
      mockPrismaService.eCLessonProgress.findUnique.mockResolvedValue(
        mockLessonProgress as any,
      );
      mockPrismaService.eCLessonProgress.update.mockResolvedValue({
        ...mockLessonProgress,
        status: "COMPLETED",
        videoProgress: 100,
      } as any);
      progressCalculation.recalculateProgress.mockResolvedValue({
        overallProgress: 50,
        status: "IN_PROGRESS",
      });

      const result = await service.completeLesson(
        mockEnrollmentId,
        mockLessonId,
      );

      expect(result.status).toBe("COMPLETED");
    });
  });

  describe("updateModuleProgress", () => {
    it("should update module status", async () => {
      mockPrismaService.eCModuleProgress.findUnique.mockResolvedValue(
        mockModuleProgress as any,
      );
      mockPrismaService.eCModuleProgress.update.mockResolvedValue({
        ...mockModuleProgress,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      } as any);

      const result = await service.updateModuleProgress(
        mockEnrollmentId,
        mockModuleId,
        { status: "IN_PROGRESS" },
      );

      expect(result.status).toBe("IN_PROGRESS");
    });

    it("should complete module", async () => {
      mockPrismaService.eCModuleProgress.findUnique.mockResolvedValue({
        ...mockModuleProgress,
        status: "IN_PROGRESS",
      } as any);
      mockPrismaService.eCModuleProgress.update.mockResolvedValue({
        ...mockModuleProgress,
        status: "COMPLETED",
        progress: 100,
        completedAt: new Date(),
      } as any);

      const result = await service.updateModuleProgress(
        mockEnrollmentId,
        mockModuleId,
        { status: "COMPLETED" },
      );

      expect(result.status).toBe("COMPLETED");
      expect(result.progress).toBe(100);
    });

    it("should throw NotFoundException if not found", async () => {
      mockPrismaService.eCModuleProgress.findUnique.mockResolvedValue(null);

      await expect(
        service.updateModuleProgress(mockEnrollmentId, "invalid", {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("startModule", () => {
    it("should start module", async () => {
      mockPrismaService.eCModuleProgress.findUnique.mockResolvedValue(
        mockModuleProgress as any,
      );
      mockPrismaService.eCModuleProgress.update.mockResolvedValue({
        ...mockModuleProgress,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      } as any);

      const result = await service.startModule(mockEnrollmentId, mockModuleId);

      expect(result.status).toBe("IN_PROGRESS");
    });
  });
});
