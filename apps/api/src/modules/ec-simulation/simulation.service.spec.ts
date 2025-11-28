import { Test, TestingModule } from "@nestjs/testing";
import { SimulationService } from "./simulation.service";
import { PrismaService } from "../../database/prisma.service";
import { NotFoundException } from "@nestjs/common";
import { SimulationType } from "./dto/simulation.dto";

describe("SimulationService", () => {
  let service: SimulationService;

  const mockECId = "ec-123";
  const mockSimulationId = "simulation-123";

  const mockSimulation = {
    id: mockSimulationId,
    ecId: mockECId,
    code: "ENT-001",
    title: "Test Simulation",
    description: "A test simulation",
    type: "INTERVIEW",
    scenario: { clientProfile: {} },
    rubric: [{ id: "intro", title: "Introduction", weight: 20 }],
    createdAt: new Date(),
    ec: { id: mockECId, code: "EC0249", title: "Test EC" },
  };

  const mockPrismaService = {
    eCSimulation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulationService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SimulationService>(SimulationService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createScenario", () => {
    it("should create a simulation scenario", async () => {
      mockPrismaService.eCSimulation.create.mockResolvedValue(mockSimulation);

      const result = await service.createScenario({
        ecStandardId: mockECId,
        title: "Test Simulation",
        description: "A test simulation",
        type: SimulationType.INTERVIEW,
      });

      expect(result).toEqual(mockSimulation);
      expect(mockPrismaService.eCSimulation.create).toHaveBeenCalled();
    });

    it("should generate code if not provided", async () => {
      mockPrismaService.eCSimulation.create.mockResolvedValue(mockSimulation);

      await service.createScenario({
        ecStandardId: mockECId,
        title: "Test",
        description: "Test description",
        type: SimulationType.PRESENTATION,
      });

      expect(mockPrismaService.eCSimulation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            code: expect.stringMatching(/^PRES-/),
          }),
        }),
      );
    });
  });

  describe("getScenario", () => {
    it("should return scenario by ID", async () => {
      mockPrismaService.eCSimulation.findUnique.mockResolvedValue(
        mockSimulation,
      );

      const result = await service.getScenario(mockSimulationId);

      expect(result).toEqual(mockSimulation);
    });

    it("should throw NotFoundException if not found", async () => {
      mockPrismaService.eCSimulation.findUnique.mockResolvedValue(null);

      await expect(service.getScenario("invalid-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("getScenarios", () => {
    it("should return paginated scenarios", async () => {
      mockPrismaService.eCSimulation.findMany.mockResolvedValue([
        mockSimulation,
      ]);
      mockPrismaService.eCSimulation.count.mockResolvedValue(1);

      const result = await service.getScenarios({});

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it("should filter by ecStandardId", async () => {
      mockPrismaService.eCSimulation.findMany.mockResolvedValue([
        mockSimulation,
      ]);
      mockPrismaService.eCSimulation.count.mockResolvedValue(1);

      await service.getScenarios({ ecStandardId: mockECId });

      expect(mockPrismaService.eCSimulation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ecId: mockECId }),
        }),
      );
    });

    it("should filter by type", async () => {
      mockPrismaService.eCSimulation.findMany.mockResolvedValue([]);
      mockPrismaService.eCSimulation.count.mockResolvedValue(0);

      await service.getScenarios({ type: SimulationType.INTERVIEW });

      expect(mockPrismaService.eCSimulation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: SimulationType.INTERVIEW }),
        }),
      );
    });

    it("should search by text", async () => {
      mockPrismaService.eCSimulation.findMany.mockResolvedValue([]);
      mockPrismaService.eCSimulation.count.mockResolvedValue(0);

      await service.getScenarios({ search: "test" });

      expect(mockPrismaService.eCSimulation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ title: expect.any(Object) }),
            ]),
          }),
        }),
      );
    });
  });

  describe("updateScenario", () => {
    it("should update scenario", async () => {
      mockPrismaService.eCSimulation.findUnique.mockResolvedValue(
        mockSimulation,
      );
      mockPrismaService.eCSimulation.update.mockResolvedValue({
        ...mockSimulation,
        title: "Updated Title",
      });

      const result = await service.updateScenario(mockSimulationId, {
        title: "Updated Title",
      });

      expect(result.title).toBe("Updated Title");
    });

    it("should throw NotFoundException if not found", async () => {
      mockPrismaService.eCSimulation.findUnique.mockResolvedValue(null);

      await expect(
        service.updateScenario("invalid-id", { title: "Test" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("deleteScenario", () => {
    it("should delete scenario", async () => {
      mockPrismaService.eCSimulation.findUnique.mockResolvedValue(
        mockSimulation,
      );
      mockPrismaService.eCSimulation.delete.mockResolvedValue({});

      const result = await service.deleteScenario(mockSimulationId);

      expect(result.success).toBe(true);
    });

    it("should throw NotFoundException if not found", async () => {
      mockPrismaService.eCSimulation.findUnique.mockResolvedValue(null);

      await expect(service.deleteScenario("invalid-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("getScenariosByEC", () => {
    it("should return scenarios for EC", async () => {
      mockPrismaService.eCSimulation.findMany.mockResolvedValue([
        mockSimulation,
      ]);

      const result = await service.getScenariosByEC(mockECId);

      expect(result).toHaveLength(1);
    });
  });

  describe("seedInterviewScenarios", () => {
    it("should seed interview scenarios", async () => {
      mockPrismaService.eCSimulation.findFirst.mockResolvedValue(null);
      mockPrismaService.eCSimulation.create.mockResolvedValue(mockSimulation);

      const result = await service.seedInterviewScenarios(mockECId);

      expect(result.length).toBeGreaterThan(0);
    });

    it("should skip existing scenarios", async () => {
      mockPrismaService.eCSimulation.findFirst.mockResolvedValue(
        mockSimulation,
      );

      const result = await service.seedInterviewScenarios(mockECId);

      expect(result).toEqual([]);
    });
  });

  describe("seedPresentationScenarios", () => {
    it("should seed presentation scenarios", async () => {
      mockPrismaService.eCSimulation.findFirst.mockResolvedValue(null);
      mockPrismaService.eCSimulation.create.mockResolvedValue(mockSimulation);

      const result = await service.seedPresentationScenarios(mockECId);

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("getScenarioStats", () => {
    it("should return scenario statistics", async () => {
      mockPrismaService.eCSimulation.count.mockResolvedValue(10);
      mockPrismaService.eCSimulation.groupBy.mockResolvedValue([
        { type: "INTERVIEW", _count: 5 },
        { type: "PRESENTATION", _count: 5 },
      ]);

      const result = await service.getScenarioStats();

      expect(result.total).toBe(10);
      expect(result.byType.INTERVIEW).toBe(5);
    });

    it("should filter stats by EC", async () => {
      mockPrismaService.eCSimulation.count.mockResolvedValue(3);
      mockPrismaService.eCSimulation.groupBy.mockResolvedValue([]);

      await service.getScenarioStats(mockECId);

      expect(mockPrismaService.eCSimulation.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ecId: mockECId },
        }),
      );
    });
  });
});
