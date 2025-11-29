import { Test, TestingModule } from "@nestjs/testing";
import { ECAssessmentService } from "./ec-assessment.service";
import { PrismaService } from "../../database/prisma.service";
import { AttemptService } from "./services/attempt.service";
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";

describe("ECAssessmentService", () => {
  let service: ECAssessmentService;

  const mockECId = "ec-123";
  const mockAssessmentId = "assessment-123";
  const mockSimulationId = "simulation-123";
  const mockEnrollmentId = "enrollment-123";

  const mockEC = {
    id: mockECId,
    code: "EC0249",
    title: "Test EC Standard",
  };

  const mockAssessment = {
    id: mockAssessmentId,
    ecId: mockECId,
    code: "EVAL-001",
    title: "Test Assessment",
    category: "KNOWLEDGE_TEST",
    questions: [
      { id: "q1", points: 10 },
      { id: "q2", points: 10 },
    ],
    passingScore: 70,
    allowedAttempts: 3,
    _count: { attempts: 0 },
  };

  const mockSimulation = {
    id: mockSimulationId,
    ecId: mockECId,
    code: "SIM-001",
    title: "Test Simulation",
    type: "INTERVIEW",
    rubric: [{ criterion: "Communication", maxPoints: 50 }],
    _count: { attempts: 0 },
  };

  const mockPrismaService = {
    eCStandard: {
      findUnique: jest.fn(),
    },
    eCModule: {
      findUnique: jest.fn(),
    },
    eCAssessment: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    eCSimulation: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    eCEnrollment: {
      findUnique: jest.fn(),
    },
    eCSimulationAttempt: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockAttemptService = {
    startAssessmentAttempt: jest.fn(),
    submitAnswer: jest.fn(),
    submitAttempt: jest.fn(),
    completeAttempt: jest.fn(),
    getAttemptById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ECAssessmentService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AttemptService, useValue: mockAttemptService },
      ],
    }).compile();

    service = module.get<ECAssessmentService>(ECAssessmentService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createAssessment", () => {
    it("should create an assessment", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockEC);
      mockPrismaService.eCAssessment.findFirst.mockResolvedValue(null);
      mockPrismaService.eCAssessment.create.mockResolvedValue(mockAssessment);

      const result = await service.createAssessment("EC0249", {
        code: "EVAL-001",
        title: "Test Assessment",
      });

      expect(result).toEqual(mockAssessment);
    });

    it("should throw NotFoundException if EC not found", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(null);

      await expect(
        service.createAssessment("INVALID", {
          code: "EVAL-001",
          title: "Test",
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ConflictException if assessment code exists", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockEC);
      mockPrismaService.eCAssessment.findFirst.mockResolvedValue(
        mockAssessment,
      );

      await expect(
        service.createAssessment("EC0249", { code: "EVAL-001", title: "Test" }),
      ).rejects.toThrow(ConflictException);
    });

    it("should validate module belongs to EC", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockEC);
      mockPrismaService.eCModule.findUnique.mockResolvedValue({
        id: "mod-1",
        ecId: "other-ec",
      });

      await expect(
        service.createAssessment("EC0249", {
          code: "EVAL-001",
          title: "Test",
          moduleId: "mod-1",
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("findAssessmentsByStandard", () => {
    it("should return assessments for EC", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockEC);
      mockPrismaService.eCAssessment.findMany.mockResolvedValue([
        mockAssessment,
      ]);

      const result = await service.findAssessmentsByStandard("EC0249");

      expect(result).toHaveLength(1);
      expect(result[0].questionCount).toBe(2);
      expect(result[0].totalPoints).toBe(20);
    });

    it("should throw NotFoundException if EC not found", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(null);

      await expect(
        service.findAssessmentsByStandard("INVALID"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("findAssessmentById", () => {
    it("should return assessment by ID", async () => {
      mockPrismaService.eCAssessment.findUnique.mockResolvedValue(
        mockAssessment,
      );

      const result = await service.findAssessmentById(mockAssessmentId);

      expect(result.id).toBe(mockAssessmentId);
    });

    it("should throw NotFoundException if not found", async () => {
      mockPrismaService.eCAssessment.findUnique.mockResolvedValue(null);

      await expect(service.findAssessmentById("invalid-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("updateAssessment", () => {
    it("should update assessment", async () => {
      mockPrismaService.eCAssessment.findUnique.mockResolvedValue(
        mockAssessment,
      );
      mockPrismaService.eCAssessment.update.mockResolvedValue({
        ...mockAssessment,
        title: "Updated",
      });

      const result = await service.updateAssessment(mockAssessmentId, {
        title: "Updated",
      });

      expect(result.title).toBe("Updated");
    });
  });

  describe("addQuestion", () => {
    it("should add question to assessment", async () => {
      mockPrismaService.eCAssessment.findUnique.mockResolvedValue(
        mockAssessment,
      );
      mockPrismaService.eCAssessment.update.mockResolvedValue({});

      const result = await service.addQuestion(mockAssessmentId, {
        type: "MULTIPLE_CHOICE",
        questionText: "Test question?",
        questionData: {
          options: [{ text: "A" }, { text: "B" }],
          correctIndex: 0,
        },
        points: 10,
      });

      expect(result.id).toBeDefined();
      expect(result.questionText).toBe("Test question?");
    });
  });

  describe("deleteAssessment", () => {
    it("should delete assessment without attempts", async () => {
      mockPrismaService.eCAssessment.findUnique.mockResolvedValue(
        mockAssessment,
      );
      mockPrismaService.eCAssessment.delete.mockResolvedValue({});

      const result = await service.deleteAssessment(mockAssessmentId);

      expect(result.message).toBe("Assessment deleted successfully");
    });

    it("should throw ConflictException if has attempts", async () => {
      mockPrismaService.eCAssessment.findUnique.mockResolvedValue({
        ...mockAssessment,
        _count: { attempts: 5 },
      });

      await expect(service.deleteAssessment(mockAssessmentId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("createSimulation", () => {
    it("should create simulation", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockEC);
      mockPrismaService.eCSimulation.findFirst.mockResolvedValue(null);
      mockPrismaService.eCSimulation.create.mockResolvedValue(mockSimulation);

      const result = await service.createSimulation("EC0249", {
        code: "SIM-001",
        title: "Test Simulation",
        description: "A test simulation",
        type: "INTERVIEW",
        scenario: { context: "Test context" },
      });

      expect(result).toEqual(mockSimulation);
    });
  });

  describe("startSimulationAttempt", () => {
    it("should start simulation attempt", async () => {
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue({
        id: mockEnrollmentId,
        ecId: mockECId,
      });
      mockPrismaService.eCSimulation.findUnique.mockResolvedValue(
        mockSimulation,
      );
      mockPrismaService.eCSimulationAttempt.create.mockResolvedValue({
        id: "attempt-1",
        status: "IN_PROGRESS",
      });

      const result = await service.startSimulationAttempt(
        mockEnrollmentId,
        mockSimulationId,
      );

      expect(result.status).toBe("IN_PROGRESS");
    });

    it("should throw if simulation not in enrolled EC", async () => {
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue({
        id: mockEnrollmentId,
        ecId: "other-ec",
      });
      mockPrismaService.eCSimulation.findUnique.mockResolvedValue(
        mockSimulation,
      );

      await expect(
        service.startSimulationAttempt(mockEnrollmentId, mockSimulationId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("gradeSimulation", () => {
    it("should grade simulation attempt", async () => {
      mockPrismaService.eCSimulationAttempt.findUnique.mockResolvedValue({
        id: "attempt-1",
        simulation: mockSimulation,
      });
      mockPrismaService.eCSimulationAttempt.update.mockResolvedValue({
        id: "attempt-1",
        score: 80,
        passed: true,
      });

      const result = await service.gradeSimulation("attempt-1", [
        { criterionIndex: 0, points: 40, feedback: "Good" },
      ]);

      expect(result.passed).toBe(true);
    });
  });

  describe("delegated methods", () => {
    it("should delegate startAssessmentAttempt", async () => {
      mockAttemptService.startAssessmentAttempt.mockResolvedValue({
        id: "attempt-1",
      });

      await service.startAssessmentAttempt(mockEnrollmentId, mockAssessmentId);

      expect(mockAttemptService.startAssessmentAttempt).toHaveBeenCalled();
    });

    it("should delegate submitAssessmentAnswer", async () => {
      mockAttemptService.submitAnswer.mockResolvedValue({});

      await service.submitAssessmentAnswer("attempt-1", {
        questionId: "q1",
        response: "A",
      });

      expect(mockAttemptService.submitAnswer).toHaveBeenCalled();
    });

    it("should delegate submitAssessmentAttempt", async () => {
      mockAttemptService.submitAttempt.mockResolvedValue({
        id: "attempt-1",
        status: "COMPLETED",
      });

      await service.submitAssessmentAttempt("attempt-1", {
        answers: [{ questionId: "q1", response: "A" }],
      });

      expect(mockAttemptService.submitAttempt).toHaveBeenCalledWith(
        "attempt-1",
        { answers: [{ questionId: "q1", response: "A" }] },
      );
    });

    it("should delegate completeAttempt", async () => {
      mockAttemptService.completeAttempt.mockResolvedValue({
        id: "attempt-1",
        status: "COMPLETED",
      });

      await service.completeAttempt("attempt-1", false);

      expect(mockAttemptService.completeAttempt).toHaveBeenCalledWith(
        "attempt-1",
        false,
      );
    });

    it("should delegate completeAttempt with timedOut true", async () => {
      mockAttemptService.completeAttempt.mockResolvedValue({
        id: "attempt-1",
        status: "TIMED_OUT",
      });

      await service.completeAttempt("attempt-1", true);

      expect(mockAttemptService.completeAttempt).toHaveBeenCalledWith(
        "attempt-1",
        true,
      );
    });

    it("should delegate getAttemptById", async () => {
      mockAttemptService.getAttemptById.mockResolvedValue({
        id: "attempt-1",
        status: "IN_PROGRESS",
      });

      const result = await service.getAttemptById("attempt-1");

      expect(mockAttemptService.getAttemptById).toHaveBeenCalledWith(
        "attempt-1",
      );
      expect(result.id).toBe("attempt-1");
    });
  });

  describe("findSimulationsByStandard", () => {
    it("should return simulations for EC", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockEC);
      mockPrismaService.eCSimulation.findMany.mockResolvedValue([
        mockSimulation,
      ]);

      const result = await service.findSimulationsByStandard("EC0249");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockSimulationId);
    });

    it("should throw NotFoundException if EC not found", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(null);

      await expect(
        service.findSimulationsByStandard("INVALID"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("findSimulationById", () => {
    it("should return simulation by ID", async () => {
      mockPrismaService.eCSimulation.findUnique.mockResolvedValue({
        ...mockSimulation,
        ec: { code: "EC0249", title: "Test EC" },
      });

      const result = await service.findSimulationById(mockSimulationId);

      expect(result.id).toBe(mockSimulationId);
    });

    it("should throw NotFoundException if not found", async () => {
      mockPrismaService.eCSimulation.findUnique.mockResolvedValue(null);

      await expect(service.findSimulationById("invalid-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("updateSimulation", () => {
    it("should update simulation", async () => {
      mockPrismaService.eCSimulation.findUnique.mockResolvedValue(
        mockSimulation,
      );
      mockPrismaService.eCSimulation.update.mockResolvedValue({
        ...mockSimulation,
        title: "Updated Simulation",
      });

      const result = await service.updateSimulation(mockSimulationId, {
        title: "Updated Simulation",
      });

      expect(result.title).toBe("Updated Simulation");
    });

    it("should throw NotFoundException if not found", async () => {
      mockPrismaService.eCSimulation.findUnique.mockResolvedValue(null);

      await expect(
        service.updateSimulation("invalid-id", { title: "Test" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should update simulation type and scenario", async () => {
      mockPrismaService.eCSimulation.findUnique.mockResolvedValue(
        mockSimulation,
      );
      mockPrismaService.eCSimulation.update.mockResolvedValue({
        ...mockSimulation,
        type: "ROLE_PLAY",
        scenario: { context: "New scenario" },
      });

      const result = await service.updateSimulation(mockSimulationId, {
        type: "ROLE_PLAY",
        scenario: { context: "New scenario" },
      });

      expect(result.type).toBe("ROLE_PLAY");
    });
  });

  describe("deleteSimulation", () => {
    it("should delete simulation without attempts", async () => {
      mockPrismaService.eCSimulation.findUnique.mockResolvedValue({
        ...mockSimulation,
        _count: { attempts: 0 },
      });
      mockPrismaService.eCSimulation.delete.mockResolvedValue({});

      const result = await service.deleteSimulation(mockSimulationId);

      expect(result.message).toBe("Simulation deleted successfully");
    });

    it("should throw NotFoundException if not found", async () => {
      mockPrismaService.eCSimulation.findUnique.mockResolvedValue(null);

      await expect(service.deleteSimulation("invalid-id")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw ConflictException if has attempts", async () => {
      mockPrismaService.eCSimulation.findUnique.mockResolvedValue({
        ...mockSimulation,
        _count: { attempts: 3 },
      });

      await expect(service.deleteSimulation(mockSimulationId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("submitSimulationAttempt", () => {
    it("should submit simulation attempt", async () => {
      mockPrismaService.eCSimulationAttempt.findUnique.mockResolvedValue({
        id: "attempt-1",
        status: "IN_PROGRESS",
        simulation: mockSimulation,
      });
      mockPrismaService.eCSimulationAttempt.update.mockResolvedValue({
        id: "attempt-1",
        status: "COMPLETED",
        completedAt: new Date(),
        responses: [{ answer: "Test response" }],
      });

      const result = await service.submitSimulationAttempt("attempt-1", {
        responses: [{ promptId: "p1", response: "Test response" }],
      });

      expect(result.status).toBe("COMPLETED");
    });

    it("should throw NotFoundException if attempt not found", async () => {
      mockPrismaService.eCSimulationAttempt.findUnique.mockResolvedValue(null);

      await expect(
        service.submitSimulationAttempt("invalid-id", { responses: [] }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if attempt not in progress", async () => {
      mockPrismaService.eCSimulationAttempt.findUnique.mockResolvedValue({
        id: "attempt-1",
        status: "COMPLETED",
        simulation: mockSimulation,
      });

      await expect(
        service.submitSimulationAttempt("attempt-1", { responses: [] }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("startSimulationAttempt - additional cases", () => {
    it("should throw NotFoundException if enrollment not found", async () => {
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(null);

      await expect(
        service.startSimulationAttempt("invalid-enrollment", mockSimulationId),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if simulation not found", async () => {
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue({
        id: mockEnrollmentId,
        ecId: mockECId,
      });
      mockPrismaService.eCSimulation.findUnique.mockResolvedValue(null);

      await expect(
        service.startSimulationAttempt(mockEnrollmentId, "invalid-sim"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("gradeSimulation - additional cases", () => {
    it("should throw NotFoundException if attempt not found", async () => {
      mockPrismaService.eCSimulationAttempt.findUnique.mockResolvedValue(null);

      await expect(
        service.gradeSimulation("invalid-id", [
          { criterionIndex: 0, points: 40 },
        ]),
      ).rejects.toThrow(NotFoundException);
    });

    it("should cap points at max for criterion", async () => {
      mockPrismaService.eCSimulationAttempt.findUnique.mockResolvedValue({
        id: "attempt-1",
        simulation: {
          ...mockSimulation,
          rubric: [{ criterion: "Communication", maxPoints: 50 }],
        },
      });
      mockPrismaService.eCSimulationAttempt.update.mockResolvedValue({
        id: "attempt-1",
        score: 100,
        passed: true,
      });

      const result = await service.gradeSimulation("attempt-1", [
        { criterionIndex: 0, points: 100, feedback: "Exceeded max" },
      ]);

      expect(mockPrismaService.eCSimulationAttempt.update).toHaveBeenCalled();
      expect(result.passed).toBe(true);
    });

    it("should ignore out-of-range criterion indices", async () => {
      mockPrismaService.eCSimulationAttempt.findUnique.mockResolvedValue({
        id: "attempt-1",
        simulation: {
          ...mockSimulation,
          rubric: [{ criterion: "Communication", maxPoints: 50 }],
        },
      });
      mockPrismaService.eCSimulationAttempt.update.mockResolvedValue({
        id: "attempt-1",
        score: 0,
        passed: false,
      });

      await service.gradeSimulation("attempt-1", [
        { criterionIndex: 5, points: 100 },
      ]);

      expect(mockPrismaService.eCSimulationAttempt.update).toHaveBeenCalled();
    });

    it("should handle empty rubric", async () => {
      mockPrismaService.eCSimulationAttempt.findUnique.mockResolvedValue({
        id: "attempt-1",
        simulation: { ...mockSimulation, rubric: [] },
      });
      mockPrismaService.eCSimulationAttempt.update.mockResolvedValue({
        id: "attempt-1",
        score: 0,
        passed: false,
      });

      await service.gradeSimulation("attempt-1", []);

      expect(mockPrismaService.eCSimulationAttempt.update).toHaveBeenCalled();
    });

    it("should calculate percentage correctly with multiple criteria", async () => {
      mockPrismaService.eCSimulationAttempt.findUnique.mockResolvedValue({
        id: "attempt-1",
        simulation: {
          ...mockSimulation,
          rubric: [
            { criterion: "Communication", maxPoints: 50 },
            { criterion: "Technical", maxPoints: 50 },
          ],
        },
      });
      mockPrismaService.eCSimulationAttempt.update.mockResolvedValue({
        id: "attempt-1",
        score: 70,
        passed: true,
      });

      await service.gradeSimulation("attempt-1", [
        { criterionIndex: 0, points: 35, feedback: "Good" },
        { criterionIndex: 1, points: 35, feedback: "Solid" },
      ]);

      const updateCall =
        mockPrismaService.eCSimulationAttempt.update.mock.calls[0][0];
      expect(updateCall.data.score).toBe(70);
      expect(updateCall.data.passed).toBe(true);
    });
  });

  describe("getUserAssessmentSummary", () => {
    it("should return assessment summary for enrollment", async () => {
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue({
        id: mockEnrollmentId,
        ec: {
          assessments: [mockAssessment],
        },
        assessmentAttempts: [
          {
            assessmentId: mockAssessmentId,
            status: "COMPLETED",
            score: 85,
            passed: true,
            completedAt: new Date(),
          },
        ],
      });

      const result = await service.getUserAssessmentSummary(mockEnrollmentId);

      expect(result).toHaveLength(1);
      expect(result[0].assessmentId).toBe(mockAssessmentId);
      expect(result[0].bestScore).toBe(85);
      expect(result[0].passed).toBe(true);
    });

    it("should throw NotFoundException if enrollment not found", async () => {
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(null);

      await expect(
        service.getUserAssessmentSummary("invalid-id"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should handle multiple attempts and find best score", async () => {
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue({
        id: mockEnrollmentId,
        ec: {
          assessments: [mockAssessment],
        },
        assessmentAttempts: [
          {
            assessmentId: mockAssessmentId,
            status: "COMPLETED",
            score: 60,
            passed: false,
            completedAt: new Date("2024-01-01"),
          },
          {
            assessmentId: mockAssessmentId,
            status: "COMPLETED",
            score: 90,
            passed: true,
            completedAt: new Date("2024-01-02"),
          },
          {
            assessmentId: mockAssessmentId,
            status: "TIMED_OUT",
            score: 50,
            passed: false,
            completedAt: new Date("2024-01-03"),
          },
        ],
      });

      const result = await service.getUserAssessmentSummary(mockEnrollmentId);

      expect(result[0].attemptCount).toBe(3);
      expect(result[0].bestScore).toBe(90);
      expect(result[0].passed).toBe(true);
    });

    it("should handle assessments with no attempts", async () => {
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue({
        id: mockEnrollmentId,
        ec: {
          assessments: [mockAssessment],
        },
        assessmentAttempts: [],
      });

      const result = await service.getUserAssessmentSummary(mockEnrollmentId);

      expect(result[0].attemptCount).toBe(0);
      expect(result[0].bestScore).toBe(0);
      expect(result[0].passed).toBe(false);
    });

    it("should exclude in-progress attempts from completed count", async () => {
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue({
        id: mockEnrollmentId,
        ec: {
          assessments: [mockAssessment],
        },
        assessmentAttempts: [
          {
            assessmentId: mockAssessmentId,
            status: "IN_PROGRESS",
            score: null,
            passed: false,
            completedAt: null,
          },
          {
            assessmentId: mockAssessmentId,
            status: "COMPLETED",
            score: 75,
            passed: true,
            completedAt: new Date(),
          },
        ],
      });

      const result = await service.getUserAssessmentSummary(mockEnrollmentId);

      expect(result[0].attemptCount).toBe(1);
      expect(result[0].bestScore).toBe(75);
    });

    it("should handle multiple assessments", async () => {
      const secondAssessment = {
        ...mockAssessment,
        id: "assessment-456",
        title: "Second Assessment",
      };

      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue({
        id: mockEnrollmentId,
        ec: {
          assessments: [mockAssessment, secondAssessment],
        },
        assessmentAttempts: [
          {
            assessmentId: mockAssessmentId,
            status: "COMPLETED",
            score: 80,
            passed: true,
            completedAt: new Date(),
          },
          {
            assessmentId: "assessment-456",
            status: "COMPLETED",
            score: 65,
            passed: false,
            completedAt: new Date(),
          },
        ],
      });

      const result = await service.getUserAssessmentSummary(mockEnrollmentId);

      expect(result).toHaveLength(2);
      expect(result[0].assessmentId).toBe(mockAssessmentId);
      expect(result[0].bestScore).toBe(80);
      expect(result[1].assessmentId).toBe("assessment-456");
      expect(result[1].bestScore).toBe(65);
    });
  });

  describe("createSimulation - additional cases", () => {
    it("should throw NotFoundException if EC not found", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(null);

      await expect(
        service.createSimulation("INVALID", {
          code: "SIM-001",
          title: "Test",
          description: "Test",
          type: "INTERVIEW",
          scenario: { context: "Test context" },
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ConflictException if simulation code exists", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockEC);
      mockPrismaService.eCSimulation.findFirst.mockResolvedValue(
        mockSimulation,
      );

      await expect(
        service.createSimulation("EC0249", {
          code: "SIM-001",
          title: "Test",
          description: "Test",
          type: "INTERVIEW",
          scenario: { context: "Test context" },
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("createAssessment - additional cases", () => {
    it("should create assessment with valid module", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockEC);
      mockPrismaService.eCModule.findUnique.mockResolvedValue({
        id: "mod-1",
        ecId: mockECId,
      });
      mockPrismaService.eCAssessment.findFirst.mockResolvedValue(null);
      mockPrismaService.eCAssessment.create.mockResolvedValue(mockAssessment);

      const result = await service.createAssessment("EC0249", {
        code: "EVAL-002",
        title: "Test Assessment",
        moduleId: "mod-1",
      });

      expect(result).toEqual(mockAssessment);
    });

    it("should throw BadRequestException if module not found", async () => {
      mockPrismaService.eCStandard.findUnique.mockResolvedValue(mockEC);
      mockPrismaService.eCModule.findUnique.mockResolvedValue(null);

      await expect(
        service.createAssessment("EC0249", {
          code: "EVAL-001",
          title: "Test",
          moduleId: "non-existent-module",
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("updateAssessment - additional cases", () => {
    it("should throw NotFoundException if assessment not found", async () => {
      mockPrismaService.eCAssessment.findUnique.mockResolvedValue(null);

      await expect(
        service.updateAssessment("invalid-id", { title: "Updated" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("addQuestion - additional cases", () => {
    it("should throw NotFoundException if assessment not found", async () => {
      mockPrismaService.eCAssessment.findUnique.mockResolvedValue(null);

      await expect(
        service.addQuestion("invalid-id", {
          type: "MULTIPLE_CHOICE",
          questionText: "Test?",
          questionData: { options: [], correctIndex: 0 },
          points: 10,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should set orderIndex from existing questions length", async () => {
      const assessmentWithQuestions = {
        ...mockAssessment,
        questions: [
          { id: "q1", orderIndex: 0 },
          { id: "q2", orderIndex: 1 },
        ],
      };
      mockPrismaService.eCAssessment.findUnique.mockResolvedValue(
        assessmentWithQuestions,
      );
      mockPrismaService.eCAssessment.update.mockResolvedValue({});

      const result = await service.addQuestion(mockAssessmentId, {
        type: "TRUE_FALSE",
        questionText: "Is this true?",
        questionData: { correctAnswer: true },
        points: 5,
      });

      expect(result.orderIndex).toBe(2);
    });

    it("should use provided orderIndex if specified", async () => {
      mockPrismaService.eCAssessment.findUnique.mockResolvedValue(
        mockAssessment,
      );
      mockPrismaService.eCAssessment.update.mockResolvedValue({});

      const result = await service.addQuestion(mockAssessmentId, {
        type: "SHORT_ANSWER",
        questionText: "Explain this",
        questionData: { keywords: ["test"] },
        points: 15,
        orderIndex: 5,
      });

      expect(result.orderIndex).toBe(5);
    });
  });

  describe("deleteAssessment - additional cases", () => {
    it("should throw NotFoundException if assessment not found", async () => {
      mockPrismaService.eCAssessment.findUnique.mockResolvedValue(null);

      await expect(service.deleteAssessment("invalid-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
