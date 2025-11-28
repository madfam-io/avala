import { Test, TestingModule } from "@nestjs/testing";
import { SimulationController } from "./simulation.controller";
import { SimulationService } from "./simulation.service";
import { SimulationEngineService } from "./simulation-engine.service";

describe("SimulationController", () => {
  let controller: SimulationController;
  let simulationService: jest.Mocked<SimulationService>;
  let engineService: jest.Mocked<SimulationEngineService>;

  const mockSimulationService = {
    createScenario: jest.fn(),
    getScenarios: jest.fn(),
    getScenario: jest.fn(),
    updateScenario: jest.fn(),
    deleteScenario: jest.fn(),
    getScenariosByEC: jest.fn(),
    seedInterviewScenarios: jest.fn(),
    seedPresentationScenarios: jest.fn(),
    getScenarioStats: jest.fn(),
  };

  const mockEngineService = {
    startSession: jest.fn(),
    getSession: jest.fn(),
    pauseSession: jest.fn(),
    resumeSession: jest.fn(),
    submitAction: jest.fn(),
    completeSession: jest.fn(),
    abandonSession: jest.fn(),
    getSessionHistory: jest.fn(),
    getAttemptDetails: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SimulationController],
      providers: [
        { provide: SimulationService, useValue: mockSimulationService },
        { provide: SimulationEngineService, useValue: mockEngineService },
      ],
    }).compile();

    controller = module.get<SimulationController>(SimulationController);
    simulationService = module.get(SimulationService);
    engineService = module.get(SimulationEngineService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  // SCENARIO ENDPOINTS
  describe("createScenario", () => {
    it("should create scenario", async () => {
      simulationService.createScenario.mockResolvedValue({} as any);
      await controller.createScenario({} as any);
      expect(simulationService.createScenario).toHaveBeenCalledWith({});
    });
  });

  describe("getScenarios", () => {
    it("should get scenarios", async () => {
      simulationService.getScenarios.mockResolvedValue({
        data: [],
        total: 0,
      } as any);
      await controller.getScenarios({} as any);
      expect(simulationService.getScenarios).toHaveBeenCalledWith({});
    });
  });

  describe("getScenario", () => {
    it("should get scenario by id", async () => {
      simulationService.getScenario.mockResolvedValue({} as any);
      await controller.getScenario("scenario-1");
      expect(simulationService.getScenario).toHaveBeenCalledWith("scenario-1");
    });
  });

  describe("updateScenario", () => {
    it("should update scenario", async () => {
      simulationService.updateScenario.mockResolvedValue({} as any);
      await controller.updateScenario("scenario-1", {} as any);
      expect(simulationService.updateScenario).toHaveBeenCalledWith(
        "scenario-1",
        {},
      );
    });
  });

  describe("deleteScenario", () => {
    it("should delete scenario", async () => {
      simulationService.deleteScenario.mockResolvedValue({} as any);
      await controller.deleteScenario("scenario-1");
      expect(simulationService.deleteScenario).toHaveBeenCalledWith(
        "scenario-1",
      );
    });
  });

  describe("getScenariosByEC", () => {
    it("should get scenarios by EC", async () => {
      simulationService.getScenariosByEC.mockResolvedValue([]);
      await controller.getScenariosByEC("ec-1");
      expect(simulationService.getScenariosByEC).toHaveBeenCalledWith("ec-1");
    });
  });

  describe("seedInterviewScenarios", () => {
    it("should seed interview scenarios", async () => {
      simulationService.seedInterviewScenarios.mockResolvedValue([]);
      await controller.seedInterviewScenarios("ec-1");
      expect(simulationService.seedInterviewScenarios).toHaveBeenCalledWith(
        "ec-1",
      );
    });
  });

  describe("seedPresentationScenarios", () => {
    it("should seed presentation scenarios", async () => {
      simulationService.seedPresentationScenarios.mockResolvedValue([]);
      await controller.seedPresentationScenarios("ec-1");
      expect(simulationService.seedPresentationScenarios).toHaveBeenCalledWith(
        "ec-1",
      );
    });
  });

  // SESSION ENDPOINTS
  describe("startSession", () => {
    it("should start session", async () => {
      engineService.startSession.mockResolvedValue({} as any);
      await controller.startSession({} as any);
      expect(engineService.startSession).toHaveBeenCalledWith({});
    });
  });

  describe("getSession", () => {
    it("should get session", async () => {
      engineService.getSession.mockResolvedValue({} as any);
      await controller.getSession("session-1");
      expect(engineService.getSession).toHaveBeenCalledWith("session-1");
    });
  });

  describe("pauseSession", () => {
    it("should pause session", async () => {
      engineService.pauseSession.mockResolvedValue({} as any);
      await controller.pauseSession("session-1");
      expect(engineService.pauseSession).toHaveBeenCalledWith("session-1");
    });
  });

  describe("resumeSession", () => {
    it("should resume session", async () => {
      engineService.resumeSession.mockResolvedValue({} as any);
      await controller.resumeSession("session-1");
      expect(engineService.resumeSession).toHaveBeenCalledWith("session-1");
    });
  });

  describe("submitAction", () => {
    it("should submit action", async () => {
      engineService.submitAction.mockResolvedValue({} as any);
      await controller.submitAction("session-1", {} as any);
      expect(engineService.submitAction).toHaveBeenCalledWith("session-1", {});
    });
  });

  describe("completeSession", () => {
    it("should complete session", async () => {
      engineService.completeSession.mockResolvedValue({} as any);
      await controller.completeSession("session-1");
      expect(engineService.completeSession).toHaveBeenCalledWith("session-1");
    });
  });

  describe("abandonSession", () => {
    it("should abandon session", async () => {
      engineService.abandonSession.mockResolvedValue(undefined);
      const result = await controller.abandonSession("session-1");
      expect(engineService.abandonSession).toHaveBeenCalledWith("session-1");
      expect(result).toEqual({ success: true });
    });
  });

  // HISTORY ENDPOINTS
  describe("getHistory", () => {
    it("should get history", async () => {
      engineService.getSessionHistory.mockResolvedValue([]);
      await controller.getHistory("enroll-1", "sim-1");
      expect(engineService.getSessionHistory).toHaveBeenCalledWith(
        "enroll-1",
        "sim-1",
      );
    });
  });

  describe("getAttemptDetails", () => {
    it("should get attempt details", async () => {
      engineService.getAttemptDetails.mockResolvedValue({} as any);
      await controller.getAttemptDetails("attempt-1");
      expect(engineService.getAttemptDetails).toHaveBeenCalledWith("attempt-1");
    });
  });

  // STATISTICS
  describe("getStats", () => {
    it("should get stats", async () => {
      simulationService.getScenarioStats.mockResolvedValue({} as any);
      await controller.getStats("ec-1");
      expect(simulationService.getScenarioStats).toHaveBeenCalledWith("ec-1");
    });
  });
});
