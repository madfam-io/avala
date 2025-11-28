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
  });
});
