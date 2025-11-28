import { Test, TestingModule } from "@nestjs/testing";
import { ECAssessmentController } from "./ec-assessment.controller";
import { ECAssessmentService } from "./ec-assessment.service";

describe("ECAssessmentController", () => {
  let controller: ECAssessmentController;
  let ecAssessmentService: jest.Mocked<ECAssessmentService>;

  const mockECAssessmentService = {
    // Assessments
    createAssessment: jest.fn(),
    findAssessmentsByStandard: jest.fn(),
    findAssessmentById: jest.fn(),
    updateAssessment: jest.fn(),
    addQuestion: jest.fn(),
    deleteAssessment: jest.fn(),
    // Simulations
    createSimulation: jest.fn(),
    findSimulationsByStandard: jest.fn(),
    findSimulationById: jest.fn(),
    updateSimulation: jest.fn(),
    deleteSimulation: jest.fn(),
    // Assessment Attempts
    startAssessmentAttempt: jest.fn(),
    submitAssessmentAnswer: jest.fn(),
    submitAssessmentAttempt: jest.fn(),
    getAttemptById: jest.fn(),
    // Simulation Attempts
    startSimulationAttempt: jest.fn(),
    submitSimulationAttempt: jest.fn(),
    gradeSimulation: jest.fn(),
    // Summary
    getUserAssessmentSummary: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ECAssessmentController],
      providers: [
        { provide: ECAssessmentService, useValue: mockECAssessmentService },
      ],
    }).compile();

    controller = module.get<ECAssessmentController>(ECAssessmentController);
    ecAssessmentService = module.get(ECAssessmentService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  // ASSESSMENTS
  describe("createAssessment", () => {
    it("should create assessment", async () => {
      ecAssessmentService.createAssessment.mockResolvedValue({} as any);
      await controller.createAssessment("EC0249", {} as any);
      expect(ecAssessmentService.createAssessment).toHaveBeenCalledWith(
        "EC0249",
        {},
      );
    });
  });

  describe("findAssessments", () => {
    it("should find assessments by standard", async () => {
      ecAssessmentService.findAssessmentsByStandard.mockResolvedValue([]);
      await controller.findAssessments("EC0249");
      expect(
        ecAssessmentService.findAssessmentsByStandard,
      ).toHaveBeenCalledWith("EC0249");
    });
  });

  describe("findAssessmentById", () => {
    it("should find assessment by id", async () => {
      ecAssessmentService.findAssessmentById.mockResolvedValue({} as any);
      await controller.findAssessmentById("assess-1");
      expect(ecAssessmentService.findAssessmentById).toHaveBeenCalledWith(
        "assess-1",
      );
    });
  });

  describe("updateAssessment", () => {
    it("should update assessment", async () => {
      ecAssessmentService.updateAssessment.mockResolvedValue({} as any);
      await controller.updateAssessment("assess-1", {} as any);
      expect(ecAssessmentService.updateAssessment).toHaveBeenCalledWith(
        "assess-1",
        {},
      );
    });
  });

  describe("addQuestion", () => {
    it("should add question", async () => {
      ecAssessmentService.addQuestion.mockResolvedValue({} as any);
      await controller.addQuestion("assess-1", {} as any);
      expect(ecAssessmentService.addQuestion).toHaveBeenCalledWith(
        "assess-1",
        {},
      );
    });
  });

  describe("deleteAssessment", () => {
    it("should delete assessment", async () => {
      ecAssessmentService.deleteAssessment.mockResolvedValue({} as any);
      await controller.deleteAssessment("assess-1");
      expect(ecAssessmentService.deleteAssessment).toHaveBeenCalledWith(
        "assess-1",
      );
    });
  });

  // SIMULATIONS
  describe("createSimulation", () => {
    it("should create simulation", async () => {
      ecAssessmentService.createSimulation.mockResolvedValue({} as any);
      await controller.createSimulation("EC0249", {} as any);
      expect(ecAssessmentService.createSimulation).toHaveBeenCalledWith(
        "EC0249",
        {},
      );
    });
  });

  describe("findSimulations", () => {
    it("should find simulations by standard", async () => {
      ecAssessmentService.findSimulationsByStandard.mockResolvedValue([]);
      await controller.findSimulations("EC0249");
      expect(
        ecAssessmentService.findSimulationsByStandard,
      ).toHaveBeenCalledWith("EC0249");
    });
  });

  describe("findSimulationById", () => {
    it("should find simulation by id", async () => {
      ecAssessmentService.findSimulationById.mockResolvedValue({} as any);
      await controller.findSimulationById("sim-1");
      expect(ecAssessmentService.findSimulationById).toHaveBeenCalledWith(
        "sim-1",
      );
    });
  });

  describe("updateSimulation", () => {
    it("should update simulation", async () => {
      ecAssessmentService.updateSimulation.mockResolvedValue({} as any);
      await controller.updateSimulation("sim-1", {} as any);
      expect(ecAssessmentService.updateSimulation).toHaveBeenCalledWith(
        "sim-1",
        {},
      );
    });
  });

  describe("deleteSimulation", () => {
    it("should delete simulation", async () => {
      ecAssessmentService.deleteSimulation.mockResolvedValue({} as any);
      await controller.deleteSimulation("sim-1");
      expect(ecAssessmentService.deleteSimulation).toHaveBeenCalledWith(
        "sim-1",
      );
    });
  });

  // ASSESSMENT ATTEMPTS
  describe("startAssessmentAttempt", () => {
    it("should start assessment attempt", async () => {
      ecAssessmentService.startAssessmentAttempt.mockResolvedValue({} as any);
      await controller.startAssessmentAttempt("enroll-1", "assess-1");
      expect(ecAssessmentService.startAssessmentAttempt).toHaveBeenCalledWith(
        "enroll-1",
        "assess-1",
      );
    });
  });

  describe("submitAnswer", () => {
    it("should submit answer", async () => {
      ecAssessmentService.submitAssessmentAnswer.mockResolvedValue({} as any);
      await controller.submitAnswer("attempt-1", {} as any);
      expect(ecAssessmentService.submitAssessmentAnswer).toHaveBeenCalledWith(
        "attempt-1",
        {},
      );
    });
  });

  describe("submitAttempt", () => {
    it("should submit attempt", async () => {
      ecAssessmentService.submitAssessmentAttempt.mockResolvedValue({} as any);
      await controller.submitAttempt("attempt-1", {} as any);
      expect(ecAssessmentService.submitAssessmentAttempt).toHaveBeenCalledWith(
        "attempt-1",
        {},
      );
    });
  });

  describe("getAttempt", () => {
    it("should get attempt", async () => {
      ecAssessmentService.getAttemptById.mockResolvedValue({} as any);
      await controller.getAttempt("attempt-1");
      expect(ecAssessmentService.getAttemptById).toHaveBeenCalledWith(
        "attempt-1",
      );
    });
  });

  // SIMULATION ATTEMPTS
  describe("startSimulationAttempt", () => {
    it("should start simulation attempt", async () => {
      ecAssessmentService.startSimulationAttempt.mockResolvedValue({} as any);
      await controller.startSimulationAttempt("enroll-1", "sim-1");
      expect(ecAssessmentService.startSimulationAttempt).toHaveBeenCalledWith(
        "enroll-1",
        "sim-1",
      );
    });
  });

  describe("submitSimulation", () => {
    it("should submit simulation", async () => {
      ecAssessmentService.submitSimulationAttempt.mockResolvedValue({} as any);
      await controller.submitSimulation("attempt-1", {} as any);
      expect(ecAssessmentService.submitSimulationAttempt).toHaveBeenCalledWith(
        "attempt-1",
        {},
      );
    });
  });

  describe("gradeSimulation", () => {
    it("should grade simulation", async () => {
      ecAssessmentService.gradeSimulation.mockResolvedValue({} as any);
      const scores = [{ criterionIndex: 0, points: 10 }];
      await controller.gradeSimulation("attempt-1", { scores });
      expect(ecAssessmentService.gradeSimulation).toHaveBeenCalledWith(
        "attempt-1",
        scores,
      );
    });
  });

  // SUMMARY
  describe("getUserSummary", () => {
    it("should get user summary", async () => {
      ecAssessmentService.getUserAssessmentSummary.mockResolvedValue([]);
      await controller.getUserSummary("enroll-1");
      expect(ecAssessmentService.getUserAssessmentSummary).toHaveBeenCalledWith(
        "enroll-1",
      );
    });
  });
});
