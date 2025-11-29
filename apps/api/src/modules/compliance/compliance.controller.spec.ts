import { Test, TestingModule } from "@nestjs/testing";
import { ComplianceController } from "./compliance.controller";
import { SIRCEService } from "./sirce.service";
import { LFTPlanService } from "./lft-plan.service";
import { DC3Service } from "./dc3.service";

describe("ComplianceController", () => {
  let controller: ComplianceController;
  let sirceService: jest.Mocked<SIRCEService>;
  let lftPlanService: jest.Mocked<LFTPlanService>;
  let dc3Service: jest.Mocked<DC3Service>;

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

  const mockDC3Service = {
    create: jest.fn(),
    bulkCreate: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findBySerial: jest.fn(),
    findByTrainee: jest.fn(),
    verify: jest.fn(),
    revoke: jest.fn(),
    updatePdfRef: jest.fn(),
    getStatistics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComplianceController],
      providers: [
        { provide: SIRCEService, useValue: mockSIRCEService },
        { provide: LFTPlanService, useValue: mockLFTPlanService },
        { provide: DC3Service, useValue: mockDC3Service },
      ],
    }).compile();

    controller = module.get<ComplianceController>(ComplianceController);
    sirceService = module.get(SIRCEService);
    lftPlanService = module.get(LFTPlanService);
    dc3Service = module.get(DC3Service);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  // ============================================
  // DC-3 TESTS
  // ============================================

  describe("createDC3", () => {
    it("should create DC-3", async () => {
      const dto = {
        traineeId: "trainee-1",
        courseId: "course-1",
        tenantId: "tenant-1",
      };
      dc3Service.create.mockResolvedValue({
        id: "dc3-1",
        serial: "DC3-001",
      } as any);
      const result = await controller.createDC3(dto as any);
      expect(dc3Service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: "dc3-1", serial: "DC3-001" });
    });
  });

  describe("bulkCreateDC3", () => {
    it("should bulk create DC-3 for multiple trainees", async () => {
      const dto = {
        traineeIds: ["t1", "t2"],
        courseId: "course-1",
        tenantId: "tenant-1",
      };
      dc3Service.bulkCreate.mockResolvedValue({ created: 2, failed: 0 } as any);
      const result = await controller.bulkCreateDC3(dto as any);
      expect(dc3Service.bulkCreate).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ created: 2, failed: 0 });
    });
  });

  describe("listDC3", () => {
    it("should list DC-3 records", async () => {
      const query = { tenantId: "tenant-1", page: 1, limit: 10 };
      dc3Service.findAll.mockResolvedValue({ data: [], total: 0 } as any);
      const result = await controller.listDC3(query as any);
      expect(dc3Service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual({ data: [], total: 0 });
    });
  });

  describe("verifyDC3", () => {
    it("should verify DC-3 by serial", async () => {
      dc3Service.verify.mockResolvedValue({ valid: true, dc3: {} } as any);
      const result = await controller.verifyDC3("DC3-001");
      expect(dc3Service.verify).toHaveBeenCalledWith("DC3-001");
      expect(result.valid).toBe(true);
    });
  });

  describe("getDC3ByTrainee", () => {
    it("should get DC-3 records for trainee", async () => {
      dc3Service.findByTrainee.mockResolvedValue([{ id: "dc3-1" }] as any);
      const result = await controller.getDC3ByTrainee("tenant-1", "trainee-1");
      expect(dc3Service.findByTrainee).toHaveBeenCalledWith(
        "tenant-1",
        "trainee-1",
      );
      expect(result).toHaveLength(1);
    });
  });

  describe("getDC3Statistics", () => {
    it("should get DC-3 statistics", async () => {
      dc3Service.getStatistics.mockResolvedValue({
        total: 100,
        thisYear: 25,
      } as any);
      const result = await controller.getDC3Statistics("tenant-1", 2024);
      expect(dc3Service.getStatistics).toHaveBeenCalledWith("tenant-1", 2024);
      expect(result.total).toBe(100);
    });
  });

  describe("getDC3ById", () => {
    it("should get DC-3 by ID", async () => {
      dc3Service.findById.mockResolvedValue({ id: "dc3-1" } as any);
      const result = await controller.getDC3ById("dc3-1");
      expect(dc3Service.findById).toHaveBeenCalledWith("dc3-1");
      expect(result.id).toBe("dc3-1");
    });
  });

  describe("getDC3BySerial", () => {
    it("should get DC-3 by serial number", async () => {
      dc3Service.findBySerial.mockResolvedValue({ serial: "DC3-001" } as any);
      const result = await controller.getDC3BySerial("DC3-001");
      expect(dc3Service.findBySerial).toHaveBeenCalledWith("DC3-001");
      expect(result.serial).toBe("DC3-001");
    });
  });

  describe("revokeDC3", () => {
    it("should revoke DC-3", async () => {
      const dto = { reason: "Issued in error" };
      dc3Service.revoke.mockResolvedValue({
        id: "dc3-1",
        status: "REVOKED",
      } as any);
      const result = await controller.revokeDC3("dc3-1", dto as any);
      expect(dc3Service.revoke).toHaveBeenCalledWith("dc3-1", dto);
      expect(result.status).toBe("REVOKED");
    });
  });

  describe("updateDC3Pdf", () => {
    it("should update DC-3 PDF reference", async () => {
      dc3Service.updatePdfRef.mockResolvedValue({
        id: "dc3-1",
        pdfRef: "new-ref",
      } as any);
      const result = await controller.updateDC3Pdf("dc3-1", {
        pdfRef: "new-ref",
      });
      expect(dc3Service.updatePdfRef).toHaveBeenCalledWith("dc3-1", "new-ref");
      expect(result.pdfRef).toBe("new-ref");
    });
  });

  // ============================================
  // SIRCE TESTS
  // ============================================

  describe("createSIRCEExport", () => {
    it("should create SIRCE export", async () => {
      sirceService.createExport.mockResolvedValue({ id: "export-1" } as any);
      const result = await controller.createSIRCEExport({} as any);
      expect(sirceService.createExport).toHaveBeenCalledWith({});
      expect(result.id).toBe("export-1");
    });
  });

  describe("listSIRCEExports", () => {
    it("should list SIRCE exports", async () => {
      sirceService.listExports.mockResolvedValue({ data: [], total: 0 } as any);
      const result = await controller.listSIRCEExports({} as any);
      expect(sirceService.listExports).toHaveBeenCalledWith({});
      expect(result).toEqual({ data: [], total: 0 });
    });
  });

  describe("getSIRCEExport", () => {
    it("should get SIRCE export by id", async () => {
      sirceService.getExport.mockResolvedValue({ id: "export-1" } as any);
      const result = await controller.getSIRCEExport("export-1");
      expect(sirceService.getExport).toHaveBeenCalledWith("export-1");
      expect(result.id).toBe("export-1");
    });
  });

  describe("validateSIRCEData", () => {
    it("should validate SIRCE data", async () => {
      sirceService.validateExportData.mockResolvedValue({
        isValid: true,
      } as any);
      const result = await controller.validateSIRCEData({} as any);
      expect(sirceService.validateExportData).toHaveBeenCalledWith({});
      expect(result.isValid).toBe(true);
    });
  });

  describe("regenerateSIRCEExport", () => {
    it("should regenerate SIRCE export", async () => {
      sirceService.regenerateExport.mockResolvedValue({
        id: "export-1",
      } as any);
      const result = await controller.regenerateSIRCEExport("export-1", {
        format: "XML" as any,
      });
      expect(sirceService.regenerateExport).toHaveBeenCalledWith(
        "export-1",
        "XML",
      );
      expect(result.id).toBe("export-1");
    });
  });

  // ============================================
  // LFT PLAN TESTS
  // ============================================

  describe("createLFTPlan", () => {
    it("should create LFT plan", async () => {
      lftPlanService.create.mockResolvedValue({ id: "plan-1" } as any);
      const result = await controller.createLFTPlan({} as any);
      expect(lftPlanService.create).toHaveBeenCalledWith({});
      expect(result.id).toBe("plan-1");
    });
  });

  describe("listLFTPlans", () => {
    it("should list LFT plans", async () => {
      lftPlanService.findAll.mockResolvedValue({ data: [], total: 0 } as any);
      const result = await controller.listLFTPlans({} as any);
      expect(lftPlanService.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual({ data: [], total: 0 });
    });
  });

  describe("getLFTSummary", () => {
    it("should get LFT summary", async () => {
      lftPlanService.getSummary.mockResolvedValue({ totalPlans: 5 } as any);
      const result = await controller.getLFTSummary("tenant-1", 2024);
      expect(lftPlanService.getSummary).toHaveBeenCalledWith("tenant-1", 2024);
      expect(result.totalPlans).toBe(5);
    });
  });

  describe("getYearOverview", () => {
    it("should get year overview", async () => {
      lftPlanService.getYearOverview.mockResolvedValue({ year: 2024 } as any);
      const result = await controller.getYearOverview("tenant-1", 2024);
      expect(lftPlanService.getYearOverview).toHaveBeenCalledWith(
        "tenant-1",
        2024,
      );
      expect(result.year).toBe(2024);
    });
  });

  describe("getLFTPlan", () => {
    it("should get LFT plan by id", async () => {
      lftPlanService.findById.mockResolvedValue({ id: "plan-1" } as any);
      const result = await controller.getLFTPlan("plan-1");
      expect(lftPlanService.findById).toHaveBeenCalledWith("plan-1");
      expect(result.id).toBe("plan-1");
    });
  });

  describe("updateLFTPlan", () => {
    it("should update LFT plan", async () => {
      lftPlanService.update.mockResolvedValue({
        id: "plan-1",
        businessUnit: "Updated Unit",
      } as any);
      const result = await controller.updateLFTPlan("plan-1", {
        businessUnit: "Updated Unit",
      } as any);
      expect(lftPlanService.update).toHaveBeenCalledWith("plan-1", {
        businessUnit: "Updated Unit",
      });
      expect(result.businessUnit).toBe("Updated Unit");
    });
  });

  describe("deleteLFTPlan", () => {
    it("should delete LFT plan", async () => {
      lftPlanService.delete.mockResolvedValue({
        success: true,
        message: "Plan deleted",
      } as any);
      const result = await controller.deleteLFTPlan("plan-1");
      expect(lftPlanService.delete).toHaveBeenCalledWith("plan-1");
      expect(result.success).toBe(true);
    });
  });

  describe("setLFTPlanLock", () => {
    it("should set LFT plan lock", async () => {
      lftPlanService.setLock.mockResolvedValue({
        id: "plan-1",
        isLocked: true,
        lockedAt: new Date(),
      } as any);
      const result = await controller.setLFTPlanLock("plan-1", {
        lock: true,
      } as any);
      expect(lftPlanService.setLock).toHaveBeenCalledWith("plan-1", true);
      expect(result.isLocked).toBe(true);
    });
  });

  describe("addProgramToLFTPlan", () => {
    it("should add program to LFT plan", async () => {
      lftPlanService.addProgram.mockResolvedValue({
        id: "plan-1",
        programs: [{}],
      } as any);
      const result = await controller.addProgramToLFTPlan("plan-1", {} as any);
      expect(lftPlanService.addProgram).toHaveBeenCalledWith("plan-1", {});
      expect(result.programs).toHaveLength(1);
    });
  });

  describe("removeProgramFromLFTPlan", () => {
    it("should remove program from LFT plan", async () => {
      lftPlanService.removeProgram.mockResolvedValue({
        id: "plan-1",
        programs: [],
      } as any);
      const result = await controller.removeProgramFromLFTPlan("plan-1", 0);
      expect(lftPlanService.removeProgram).toHaveBeenCalledWith("plan-1", 0);
      expect(result.programs).toHaveLength(0);
    });
  });

  describe("cloneLFTPlan", () => {
    it("should clone LFT plan", async () => {
      lftPlanService.cloneToYear.mockResolvedValue({
        id: "plan-2",
        year: 2025,
      } as any);
      const result = await controller.cloneLFTPlan("plan-1", { year: 2025 });
      expect(lftPlanService.cloneToYear).toHaveBeenCalledWith("plan-1", 2025);
      expect(result.year).toBe(2025);
    });
  });
});
