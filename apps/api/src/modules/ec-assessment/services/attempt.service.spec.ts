import { Test, TestingModule } from "@nestjs/testing";
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { AttemptService } from "./attempt.service";
import { GradingService } from "./grading.service";
import { PrismaService } from "../../../database/prisma.service";

describe("AttemptService", () => {
  let service: AttemptService;
  let mockPrismaService: any;
  let gradingService: jest.Mocked<GradingService>;

  const mockEnrollmentId = "enrollment-1";
  const mockAssessmentId = "assessment-1";
  const mockAttemptId = "attempt-1";

  const mockEnrollment = {
    id: mockEnrollmentId,
    ecId: "ec-1",
    userId: "user-1",
  };

  const mockAssessment = {
    id: mockAssessmentId,
    ecId: "ec-1",
    title: "Test Assessment",
    allowedAttempts: 3,
    timeLimit: 1800,
    passingScore: 70,
    showResults: true,
    questions: [
      {
        id: "q1",
        type: "MULTIPLE_CHOICE",
        questionText: "Test?",
        points: 10,
        questionData: { options: ["A", "B"], correctIndex: 0 },
      },
    ],
  };

  const mockAttempt = {
    id: mockAttemptId,
    enrollmentId: mockEnrollmentId,
    assessmentId: mockAssessmentId,
    status: "IN_PROGRESS",
    startedAt: new Date(),
    responses: [],
    timeSpent: null,
    assessment: mockAssessment,
  };

  beforeEach(async () => {
    const mockPrisma = {
      eCEnrollment: {
        findUnique: jest.fn(),
      },
      eCAssessment: {
        findUnique: jest.fn(),
      },
      eCAssessmentAttempt: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    };

    const mockGradingService = {
      gradeAttempt: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttemptService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GradingService, useValue: mockGradingService },
      ],
    }).compile();

    service = module.get<AttemptService>(AttemptService);
    mockPrismaService = mockPrisma;
    gradingService = module.get(GradingService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("startAssessmentAttempt", () => {
    it("should start a new attempt", async () => {
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(
        mockEnrollment as any,
      );
      mockPrismaService.eCAssessment.findUnique.mockResolvedValue(
        mockAssessment as any,
      );
      mockPrismaService.eCAssessmentAttempt.count.mockResolvedValue(0);
      mockPrismaService.eCAssessmentAttempt.findFirst.mockResolvedValue(null);
      mockPrismaService.eCAssessmentAttempt.create.mockResolvedValue(
        mockAttempt as any,
      );

      const result = await service.startAssessmentAttempt(
        mockEnrollmentId,
        mockAssessmentId,
      );

      expect(result.id).toBe(mockAttemptId);
      expect(result.status).toBe("IN_PROGRESS");
    });

    it("should return existing in-progress attempt", async () => {
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(
        mockEnrollment as any,
      );
      mockPrismaService.eCAssessment.findUnique.mockResolvedValue(
        mockAssessment as any,
      );
      mockPrismaService.eCAssessmentAttempt.count.mockResolvedValue(0);
      mockPrismaService.eCAssessmentAttempt.findFirst.mockResolvedValue(
        mockAttempt as any,
      );

      const result = await service.startAssessmentAttempt(
        mockEnrollmentId,
        mockAssessmentId,
      );

      expect(result.id).toBe(mockAttemptId);
      expect(
        mockPrismaService.eCAssessmentAttempt.create,
      ).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException if enrollment not found", async () => {
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(null);

      await expect(
        service.startAssessmentAttempt(mockEnrollmentId, mockAssessmentId),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if assessment not for EC", async () => {
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(
        mockEnrollment as any,
      );
      mockPrismaService.eCAssessment.findUnique.mockResolvedValue({
        ...mockAssessment,
        ecId: "different-ec",
      } as any);

      await expect(
        service.startAssessmentAttempt(mockEnrollmentId, mockAssessmentId),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw ForbiddenException if max attempts reached", async () => {
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(
        mockEnrollment as any,
      );
      mockPrismaService.eCAssessment.findUnique.mockResolvedValue(
        mockAssessment as any,
      );
      mockPrismaService.eCAssessmentAttempt.count.mockResolvedValue(3);

      await expect(
        service.startAssessmentAttempt(mockEnrollmentId, mockAssessmentId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("submitAnswer", () => {
    it("should submit an answer", async () => {
      mockPrismaService.eCAssessmentAttempt.findUnique.mockResolvedValue(
        mockAttempt as any,
      );
      mockPrismaService.eCAssessmentAttempt.update.mockResolvedValue({
        ...mockAttempt,
        responses: [{ questionId: "q1", response: "A" }],
      } as any);

      const result = await service.submitAnswer(mockAttemptId, {
        questionId: "q1",
        response: "A",
      });

      expect(result).toBeDefined();
      expect(mockPrismaService.eCAssessmentAttempt.update).toHaveBeenCalled();
    });

    it("should throw NotFoundException if attempt not found", async () => {
      mockPrismaService.eCAssessmentAttempt.findUnique.mockResolvedValue(null);

      await expect(
        service.submitAnswer("invalid", { questionId: "q1", response: "A" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if attempt not in progress", async () => {
      mockPrismaService.eCAssessmentAttempt.findUnique.mockResolvedValue({
        ...mockAttempt,
        status: "COMPLETED",
      } as any);

      await expect(
        service.submitAnswer(mockAttemptId, {
          questionId: "q1",
          response: "A",
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("submitAttempt", () => {
    it("should submit attempt with all answers", async () => {
      mockPrismaService.eCAssessmentAttempt.findUnique.mockResolvedValue(
        mockAttempt as any,
      );
      mockPrismaService.eCAssessmentAttempt.update.mockResolvedValue(
        mockAttempt as any,
      );

      gradingService.gradeAttempt.mockReturnValue({
        totalPoints: 10,
        maxPoints: 10,
        percentage: 100,
        passed: true,
        questionResults: [],
      });

      const result = await service.submitAttempt(mockAttemptId, {
        answers: [{ questionId: "q1", response: "A" }],
        timeSpent: 300,
      });

      expect(result.passed).toBe(true);
      expect(result.percentage).toBe(100);
    });

    it("should throw NotFoundException if attempt not found", async () => {
      mockPrismaService.eCAssessmentAttempt.findUnique.mockResolvedValue(null);

      await expect(
        service.submitAttempt("invalid", { answers: [], timeSpent: 0 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("completeAttempt", () => {
    it("should complete attempt and return results", async () => {
      mockPrismaService.eCAssessmentAttempt.findUnique.mockResolvedValue({
        ...mockAttempt,
        responses: [{ questionId: "q1", response: "A" }],
      } as any);

      mockPrismaService.eCAssessmentAttempt.update.mockResolvedValue({
        ...mockAttempt,
        status: "COMPLETED",
        completedAt: new Date(),
      } as any);

      gradingService.gradeAttempt.mockReturnValue({
        totalPoints: 8,
        maxPoints: 10,
        percentage: 80,
        passed: true,
        questionResults: [
          { questionId: "q1", isCorrect: true, pointsEarned: 8, maxPoints: 10 },
        ],
      });

      const result = await service.completeAttempt(mockAttemptId, false);

      expect(result.status).toBe("COMPLETED");
      expect(result.passed).toBe(true);
    });

    it("should mark as timed out", async () => {
      mockPrismaService.eCAssessmentAttempt.findUnique.mockResolvedValue(
        mockAttempt as any,
      );
      mockPrismaService.eCAssessmentAttempt.update.mockResolvedValue({
        ...mockAttempt,
        status: "TIMED_OUT",
      } as any);

      gradingService.gradeAttempt.mockReturnValue({
        totalPoints: 0,
        maxPoints: 10,
        percentage: 0,
        passed: false,
        questionResults: [],
      });

      const result = await service.completeAttempt(mockAttemptId, true);

      expect(result.status).toBe("TIMED_OUT");
    });
  });

  describe("getAttemptById", () => {
    it("should return attempt by id", async () => {
      mockPrismaService.eCAssessmentAttempt.findUnique.mockResolvedValue({
        ...mockAttempt,
        assessment: {
          ...mockAssessment,
          ec: { code: "EC0249", title: "Test EC" },
        },
      } as any);

      const result = await service.getAttemptById(mockAttemptId);

      expect(result.id).toBe(mockAttemptId);
    });

    it("should throw NotFoundException if not found", async () => {
      mockPrismaService.eCAssessmentAttempt.findUnique.mockResolvedValue(null);

      await expect(service.getAttemptById("invalid")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
