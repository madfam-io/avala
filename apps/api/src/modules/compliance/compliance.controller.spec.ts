import { Test, TestingModule } from "@nestjs/testing";
import { ComplianceController } from "./compliance.controller";
import { SIRCEService } from "./sirce.service";
import { LFTPlanService } from "./lft-plan.service";

describe("ComplianceController", () => {
  let controller: ComplianceController;
  let sirceService: jest.Mocked<SIRCEService>;
  let lftPlanService: jest.Mocked<LFTPlanService>;

  const mockSIRCEService = {
    createExport: jest.fn(),
    listExports: jest.fn(),
    getExport: jest.fn(),
    validateExportData: jest.fn(),
    regenerateExport: jest.fn(),
  };

  const mockLFTPlanService = {
    create: jest.fn(),
    findAll: jest.fn(),
    getSummary: jest.fn(),
    getYearOverview: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    setLock: jest.fn(),
    addProgram: jest.fn(),
    removeProgram: jest.fn(),
    cloneToYear: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComplianceController],
      providers: [
        { provide: SIRCEService, useValue: mockSIRCEService },
        { provide: LFTPlanService, useValue: mockLFTPlanService },
      ],
    }).compile();

    controller = module.get<ComplianceController>(ComplianceController);
    sirceService = module.get(SIRCEService);
    lftPlanService = module.get(LFTPlanService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  // SIRCE TESTS
  describe("createSIRCEExport", () => {
    it("should create SIRCE export", async () => {
      sirceService.createExport.mockResolvedValue({} as any);
      await controller.createSIRCEExport({} as any);
      expect(sirceService.createExport).toHaveBeenCalledWith({});
    });
  });

  describe("listSIRCEExports", () => {
    it("should list SIRCE exports", async () => {
      sirceService.listExports.mockResolvedValue({ data: [], total: 0 } as any);
      await controller.listSIRCEExports({} as any);
      expect(sirceService.listExports).toHaveBeenCalledWith({});
    });
  });

  describe("getSIRCEExport", () => {
    it("should get SIRCE export by id", async () => {
      sirceService.getExport.mockResolvedValue({} as any);
      await controller.getSIRCEExport("export-1");
      expect(sirceService.getExport).toHaveBeenCalledWith("export-1");
    });
  });

  describe("validateSIRCEData", () => {
    it("should validate SIRCE data", async () => {
      sirceService.validateExportData.mockResolvedValue({} as any);
      await controller.validateSIRCEData({} as any);
      expect(sirceService.validateExportData).toHaveBeenCalledWith({});
    });
  });

  describe("regenerateSIRCEExport", () => {
    it("should regenerate SIRCE export", async () => {
      sirceService.regenerateExport.mockResolvedValue({} as any);
      await controller.regenerateSIRCEExport("export-1", {
        format: "XML" as any,
      });
      expect(sirceService.regenerateExport).toHaveBeenCalledWith(
        "export-1",
        "XML",
      );
    });
  });

  // LFT PLAN TESTS
  describe("createLFTPlan", () => {
    it("should create LFT plan", async () => {
      lftPlanService.create.mockResolvedValue({} as any);
      await controller.createLFTPlan({} as any);
      expect(lftPlanService.create).toHaveBeenCalledWith({});
    });
  });

  describe("listLFTPlans", () => {
    it("should list LFT plans", async () => {
      lftPlanService.findAll.mockResolvedValue({ data: [], total: 0 } as any);
      await controller.listLFTPlans({} as any);
      expect(lftPlanService.findAll).toHaveBeenCalledWith({});
    });
  });

  describe("getLFTSummary", () => {
    it("should get LFT summary", async () => {
      lftPlanService.getSummary.mockResolvedValue({} as any);
      await controller.getLFTSummary("tenant-1", 2024);
      expect(lftPlanService.getSummary).toHaveBeenCalledWith("tenant-1", 2024);
    });
  });

  describe("getYearOverview", () => {
    it("should get year overview", async () => {
      lftPlanService.getYearOverview.mockResolvedValue({} as any);
      await controller.getYearOverview("tenant-1", 2024);
      expect(lftPlanService.getYearOverview).toHaveBeenCalledWith(
        "tenant-1",
        2024,
      );
    });
  });

  describe("getLFTPlan", () => {
    it("should get LFT plan by id", async () => {
      lftPlanService.findById.mockResolvedValue({} as any);
      await controller.getLFTPlan("plan-1");
      expect(lftPlanService.findById).toHaveBeenCalledWith("plan-1");
    });
  });

  describe("updateLFTPlan", () => {
    it("should update LFT plan", async () => {
      lftPlanService.update.mockResolvedValue({} as any);
      await controller.updateLFTPlan("plan-1", {} as any);
      expect(lftPlanService.update).toHaveBeenCalledWith("plan-1", {});
    });
  });

  describe("deleteLFTPlan", () => {
    it("should delete LFT plan", async () => {
      lftPlanService.delete.mockResolvedValue({} as any);
      await controller.deleteLFTPlan("plan-1");
      expect(lftPlanService.delete).toHaveBeenCalledWith("plan-1");
    });
  });

  describe("setLFTPlanLock", () => {
    it("should set LFT plan lock", async () => {
      lftPlanService.setLock.mockResolvedValue({} as any);
      await controller.setLFTPlanLock("plan-1", { lock: true } as any);
      expect(lftPlanService.setLock).toHaveBeenCalledWith("plan-1", true);
    });
  });

  describe("addProgramToLFTPlan", () => {
    it("should add program to LFT plan", async () => {
      lftPlanService.addProgram.mockResolvedValue({} as any);
      await controller.addProgramToLFTPlan("plan-1", {} as any);
      expect(lftPlanService.addProgram).toHaveBeenCalledWith("plan-1", {});
    });
  });

  describe("removeProgramFromLFTPlan", () => {
    it("should remove program from LFT plan", async () => {
      lftPlanService.removeProgram.mockResolvedValue({} as any);
      await controller.removeProgramFromLFTPlan("plan-1", 0);
      expect(lftPlanService.removeProgram).toHaveBeenCalledWith("plan-1", 0);
    });
  });

  describe("cloneLFTPlan", () => {
    it("should clone LFT plan", async () => {
      lftPlanService.cloneToYear.mockResolvedValue({} as any);
      await controller.cloneLFTPlan("plan-1", { year: 2025 });
      expect(lftPlanService.cloneToYear).toHaveBeenCalledWith("plan-1", 2025);
    });
  });
});
