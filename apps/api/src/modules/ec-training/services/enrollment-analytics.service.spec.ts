import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { EnrollmentAnalyticsService } from "./enrollment-analytics.service";
import { PrismaService } from "../../../database/prisma.service";

describe("EnrollmentAnalyticsService", () => {
  let service: EnrollmentAnalyticsService;
  let mockPrismaService: any;

  const mockECCode = "EC0249";
  const mockEnrollmentId = "enrollment-1";
  const mockTenantId = "tenant-1";

  const mockEC = {
    id: "ec-1",
    code: mockECCode,
    title: "Test EC Standard",
  };

  const mockEnrollment = {
    id: mockEnrollmentId,
    userId: "user-1",
    ecId: "ec-1",
    overallProgress: 75,
    moduleProgress: [{ status: "COMPLETED" }, { status: "IN_PROGRESS" }],
  };

  const mockLessonProgress = {
    lesson: { title: "Lesson 1", code: "L001" },
    status: "COMPLETED",
    completedAt: new Date(),
    startedAt: new Date(),
  };

  const mockDocument = {
    template: { title: "Document 1", code: "D001" },
    status: "DRAFT",
    updatedAt: new Date(),
  };

  const mockAssessmentAttempt = {
    assessment: { title: "Assessment 1", code: "A001" },
    status: "COMPLETED",
    score: 85,
    passed: true,
    completedAt: new Date(),
    startedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = {
      eCStandard: {
        findUnique: jest.fn(),
      },
      eCEnrollment: {
        findMany: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
      },
      eCLessonProgress: {
        findMany: jest.fn(),
      },
      eCDocument: {
        findMany: jest.fn(),
      },
      eCAssessmentAttempt: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentAnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EnrollmentAnalyticsService>(
      EnrollmentAnalyticsService,
    );
    mockPrismaService = mockPrisma;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getECLeaderboard", () => {
    it("should return leaderboard", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockEC as any);
      mockPrismaService.eCEnrollment.findMany.mockResolvedValue([
        mockEnrollment,
      ] as any);

      const result = await service.getECLeaderboard(mockECCode);

      expect(result).toHaveLength(1);
      expect(result[0].rank).toBe(1);
      expect(result[0].progress).toBe(75);
    });

    it("should filter by tenant", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockEC as any);
      mockPrismaService.eCEnrollment.findMany.mockResolvedValue([]);

      await service.getECLeaderboard(mockECCode, mockTenantId);

      expect(mockPrismaService.eCEnrollment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: mockTenantId }),
        }),
      );
    });

    it("should respect limit", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockEC as any);
      mockPrismaService.eCEnrollment.findMany.mockResolvedValue([]);

      await service.getECLeaderboard(mockECCode, undefined, 5);

      expect(mockPrismaService.eCEnrollment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });

    it("should throw NotFoundException if EC not found", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(null);

      await expect(service.getECLeaderboard("INVALID")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("getRecentActivity", () => {
    it("should return combined activity", async () => {
      mockPrismaService.eCLessonProgress.findMany.mockResolvedValue([
        mockLessonProgress,
      ] as any);
      mockPrismaService.eCDocument.findMany.mockResolvedValue([
        mockDocument,
      ] as any);
      mockPrismaService.eCAssessmentAttempt.findMany.mockResolvedValue([
        mockAssessmentAttempt,
      ] as any);

      const result = await service.getRecentActivity(mockEnrollmentId);

      expect(result.length).toBeGreaterThan(0);
    });

    it("should sort by timestamp descending", async () => {
      const oldDate = new Date("2024-01-01");
      const newDate = new Date("2024-12-01");

      mockPrismaService.eCLessonProgress.findMany.mockResolvedValue([
        { ...mockLessonProgress, completedAt: oldDate },
      ] as any);
      mockPrismaService.eCDocument.findMany.mockResolvedValue([
        { ...mockDocument, updatedAt: newDate },
      ] as any);
      mockPrismaService.eCAssessmentAttempt.findMany.mockResolvedValue(
        [] as any,
      );

      const result = await service.getRecentActivity(mockEnrollmentId);

      expect(result[0].timestamp?.getTime()).toBeGreaterThan(
        result[result.length - 1].timestamp?.getTime() || 0,
      );
    });

    it("should respect limit", async () => {
      mockPrismaService.eCLessonProgress.findMany.mockResolvedValue([
        mockLessonProgress,
        mockLessonProgress,
        mockLessonProgress,
      ] as any);
      mockPrismaService.eCDocument.findMany.mockResolvedValue([
        mockDocument,
        mockDocument,
      ] as any);
      mockPrismaService.eCAssessmentAttempt.findMany.mockResolvedValue([
        mockAssessmentAttempt,
      ] as any);

      const result = await service.getRecentActivity(mockEnrollmentId, 3);

      expect(result.length).toBeLessThanOrEqual(3);
    });

    it("should include scores for assessments", async () => {
      mockPrismaService.eCLessonProgress.findMany.mockResolvedValue([]);
      mockPrismaService.eCDocument.findMany.mockResolvedValue([]);
      mockPrismaService.eCAssessmentAttempt.findMany.mockResolvedValue([
        mockAssessmentAttempt,
      ] as any);

      const result = await service.getRecentActivity(mockEnrollmentId);

      const assessmentActivity = result.find((a) => a.type === "assessment");
      expect(assessmentActivity?.score).toBe(85);
      expect(assessmentActivity?.passed).toBe(true);
    });
  });

  describe("getEnrollmentStats", () => {
    it("should return enrollment statistics", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockEC as any);
      mockPrismaService.eCEnrollment.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(60) // inProgress
        .mockResolvedValueOnce(30) // completed
        .mockResolvedValueOnce(10); // certified

      mockPrismaService.eCEnrollment.aggregate.mockResolvedValue({
        _avg: { overallProgress: 65 },
      } as any);

      const result = await service.getEnrollmentStats(mockECCode);

      expect(result.total).toBe(100);
      expect(result.inProgress).toBe(60);
      expect(result.completed).toBe(30);
      expect(result.certified).toBe(10);
      expect(result.averageProgress).toBe(65);
      expect(result.completionRate).toBe(40);
    });

    it("should filter by tenant", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockEC as any);
      mockPrismaService.eCEnrollment.count.mockResolvedValue(0);
      mockPrismaService.eCEnrollment.aggregate.mockResolvedValue({
        _avg: { overallProgress: null },
      } as any);

      await service.getEnrollmentStats(mockECCode, mockTenantId);

      expect(mockPrismaService.eCEnrollment.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: mockTenantId }),
        }),
      );
    });

    it("should handle zero enrollments", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockEC as any);
      mockPrismaService.eCEnrollment.count.mockResolvedValue(0);
      mockPrismaService.eCEnrollment.aggregate.mockResolvedValue({
        _avg: { overallProgress: null },
      } as any);

      const result = await service.getEnrollmentStats(mockECCode);

      expect(result.total).toBe(0);
      expect(result.averageProgress).toBe(0);
      expect(result.completionRate).toBe(0);
    });

    it("should throw NotFoundException if EC not found", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(null);

      await expect(service.getEnrollmentStats("INVALID")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
