import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { SimulationEngineService } from "./simulation-engine.service";
import { PrismaService } from "../../database/prisma.service";
import { SessionStatus, ActionType } from "./dto/simulation.dto";

describe("SimulationEngineService", () => {
  let service: SimulationEngineService;
  let mockPrismaService: any;

  const mockSimulationId = "sim-1";
  const mockEnrollmentId = "enrollment-1";
  const mockSessionId = "session-1";

  const mockSimulation = {
    id: mockSimulationId,
    title: "Interview Simulation",
    type: "INTERVIEW",
    scenario: {
      context: "Client meeting",
      duration: 1800,
      passingScore: 70,
    },
    rubric: [
      {
        id: "introduction",
        weight: 20,
        indicators: ["introduction", "purpose_explanation"],
      },
      {
        id: "needs_discovery",
        weight: 30,
        indicators: ["needs_discovery", "active_listening"],
      },
      { id: "closing", weight: 20, indicators: ["closing"] },
    ],
  };

  const mockEnrollment = {
    id: mockEnrollmentId,
    userId: "user-1",
    ecId: "ec-1",
  };

  const mockAttempt = {
    id: mockSessionId,
    simulationId: mockSimulationId,
    enrollmentId: mockEnrollmentId,
    status: "IN_PROGRESS",
    startedAt: new Date(),
    responses: [],
    feedback: {},
  };

  beforeEach(async () => {
    const mockPrisma = {
      eCSimulation: {
        findUnique: jest.fn(),
      },
      eCEnrollment: {
        findUnique: jest.fn(),
      },
      eCSimulationAttempt: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulationEngineService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SimulationEngineService>(SimulationEngineService);
    mockPrismaService = mockPrisma;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("startSession", () => {
    it("should start a new session", async () => {
      mockPrismaService.eCSimulation.findUnique.mockResolvedValue(
        mockSimulation as any,
      );
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(
        mockEnrollment as any,
      );
      mockPrismaService.eCSimulationAttempt.create.mockResolvedValue(
        mockAttempt as any,
      );

      const result = await service.startSession({
        simulationId: mockSimulationId,
        enrollmentId: mockEnrollmentId,
      });

      expect(result.id).toBe(mockSessionId);
      expect(result.status).toBe(SessionStatus.IN_PROGRESS);
    });

    it("should throw NotFoundException if simulation not found", async () => {
      mockPrismaService.eCSimulation.findUnique.mockResolvedValue(null);

      await expect(
        service.startSession({
          simulationId: "invalid",
          enrollmentId: mockEnrollmentId,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException if enrollment not found", async () => {
      mockPrismaService.eCSimulation.findUnique.mockResolvedValue(
        mockSimulation as any,
      );
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(null);

      await expect(
        service.startSession({
          simulationId: mockSimulationId,
          enrollmentId: "invalid",
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getSession", () => {
    it("should return session from database", async () => {
      mockPrismaService.eCSimulationAttempt.findUnique.mockResolvedValue(
        mockAttempt as any,
      );

      const result = await service.getSession(mockSessionId);

      expect(result.id).toBe(mockSessionId);
    });

    it("should throw NotFoundException if not found", async () => {
      mockPrismaService.eCSimulationAttempt.findUnique.mockResolvedValue(null);

      await expect(service.getSession("invalid")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("pauseSession", () => {
    beforeEach(async () => {
      // Start a session first
      mockPrismaService.eCSimulation.findUnique.mockResolvedValue(
        mockSimulation as any,
      );
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(
        mockEnrollment as any,
      );
      mockPrismaService.eCSimulationAttempt.create.mockResolvedValue(
        mockAttempt as any,
      );
      await service.startSession({
        simulationId: mockSimulationId,
        enrollmentId: mockEnrollmentId,
      });
    });

    it("should pause active session", async () => {
      mockPrismaService.eCSimulationAttempt.update.mockResolvedValue({
        ...mockAttempt,
        status: "IN_PROGRESS",
      } as any);

      const result = await service.pauseSession(mockSessionId);

      expect(result.status).toBe(SessionStatus.PAUSED);
    });
  });

  describe("resumeSession", () => {
    it("should resume session from database", async () => {
      mockPrismaService.eCSimulationAttempt.findUnique.mockResolvedValue(
        mockAttempt as any,
      );
      mockPrismaService.eCSimulationAttempt.update.mockResolvedValue(
        mockAttempt as any,
      );

      const result = await service.resumeSession(mockSessionId);

      expect(result.status).toBe(SessionStatus.IN_PROGRESS);
    });

    it("should throw BadRequestException if cannot resume", async () => {
      mockPrismaService.eCSimulationAttempt.findUnique.mockResolvedValue({
        ...mockAttempt,
        status: "COMPLETED",
      } as any);

      await expect(service.resumeSession(mockSessionId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("submitAction", () => {
    beforeEach(async () => {
      mockPrismaService.eCSimulation.findUnique.mockResolvedValue(
        mockSimulation as any,
      );
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(
        mockEnrollment as any,
      );
      mockPrismaService.eCSimulationAttempt.create.mockResolvedValue(
        mockAttempt as any,
      );
      await service.startSession({
        simulationId: mockSimulationId,
        enrollmentId: mockEnrollmentId,
      });
    });

    it("should submit action and return evaluation", async () => {
      mockPrismaService.eCSimulation.findUnique.mockResolvedValue(
        mockSimulation as any,
      );
      mockPrismaService.eCSimulationAttempt.update.mockResolvedValue(
        mockAttempt as any,
      );

      const result = await service.submitAction(mockSessionId, {
        type: ActionType.SPEAK,
        content:
          "Hola, soy consultor de la empresa. El objetivo de esta reunión es entender sus necesidades.",
      });

      expect(result.success).toBe(true);
      expect(result.evaluation).toBeDefined();
      expect(result.feedback).toBeDefined();
    });

    it("should throw NotFoundException if session not found", async () => {
      await expect(
        service.submitAction("invalid", {
          type: ActionType.SPEAK,
          content: "Test",
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("completeSession", () => {
    beforeEach(async () => {
      mockPrismaService.eCSimulation.findUnique.mockResolvedValue(
        mockSimulation as any,
      );
      mockPrismaService.eCEnrollment.findUnique.mockResolvedValue(
        mockEnrollment as any,
      );
      mockPrismaService.eCSimulationAttempt.create.mockResolvedValue(
        mockAttempt as any,
      );
      await service.startSession({
        simulationId: mockSimulationId,
        enrollmentId: mockEnrollmentId,
      });
    });

    it("should complete session and return results", async () => {
      mockPrismaService.eCSimulation.findUnique.mockResolvedValue(
        mockSimulation as any,
      );
      mockPrismaService.eCSimulationAttempt.update.mockResolvedValue({
        ...mockAttempt,
        status: "COMPLETED",
        completedAt: new Date(),
      } as any);

      const result = await service.completeSession(mockSessionId);

      expect(result.status).toBe(SessionStatus.COMPLETED);
      expect(result.overallScore).toBeDefined();
      expect(result.criteriaScores).toBeDefined();
    });
  });

  describe("abandonSession", () => {
    it("should mark session as abandoned", async () => {
      mockPrismaService.eCSimulationAttempt.update.mockResolvedValue({
        ...mockAttempt,
        status: "ABANDONED",
      } as any);

      await service.abandonSession(mockSessionId);

      expect(mockPrismaService.eCSimulationAttempt.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "ABANDONED" }),
        }),
      );
    });
  });

  describe("getSessionHistory", () => {
    it("should return session history for enrollment", async () => {
      mockPrismaService.eCSimulationAttempt.findMany.mockResolvedValue([
        {
          id: mockSessionId,
          simulationId: mockSimulationId,
          status: "COMPLETED",
          startedAt: new Date(),
          completedAt: new Date(),
          score: 85,
          passed: true,
        },
      ] as any);

      const result = await service.getSessionHistory(mockEnrollmentId);

      expect(result).toHaveLength(1);
      expect(result[0].score).toBe(85);
    });

    it("should filter by simulation id", async () => {
      mockPrismaService.eCSimulationAttempt.findMany.mockResolvedValue([]);

      await service.getSessionHistory(mockEnrollmentId, mockSimulationId);

      expect(
        mockPrismaService.eCSimulationAttempt.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            enrollmentId: mockEnrollmentId,
            simulationId: mockSimulationId,
          }),
        }),
      );
    });
  });

  describe("getAttemptDetails", () => {
    it("should return attempt details with simulation", async () => {
      mockPrismaService.eCSimulationAttempt.findUnique.mockResolvedValue({
        ...mockAttempt,
        simulation: mockSimulation,
      } as any);

      const result = await service.getAttemptDetails(mockSessionId);

      expect(result.id).toBe(mockSessionId);
      expect(result.simulation).toBeDefined();
    });

    it("should throw NotFoundException if not found", async () => {
      mockPrismaService.eCSimulationAttempt.findUnique.mockResolvedValue(null);

      await expect(service.getAttemptDetails("invalid")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
