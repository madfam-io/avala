import { Test, TestingModule } from "@nestjs/testing";
import { CertificationController } from "./certification.controller";
import { CertificationService } from "./certification.service";
import { ExportFormat } from "./dto/certification.dto";

describe("CertificationController", () => {
  let controller: CertificationController;

  const mockTenantId = "tenant-123";
  const mockTraineeId = "trainee-123";
  const mockCourseId = "course-123";
  const mockDC3Id = "dc3-123";
  const mockSerial = "DC3-2025-000001";

  const mockDC3 = {
    id: mockDC3Id,
    serial: mockSerial,
    tenantId: mockTenantId,
    traineeId: mockTraineeId,
    courseId: mockCourseId,
    status: "ISSUED",
    issuedAt: new Date(),
    trainee: {
      firstName: "Juan",
      lastName: "Pérez",
      curp: "CURP123456789012",
    },
    course: {
      title: "Seguridad Industrial",
      code: "SI-001",
    },
  };

  const mockCertificationService = {
    createDC3: jest.fn(),
    getDC3List: jest.fn(),
    getDC3: jest.fn(),
    getDC3BySerial: jest.fn(),
    revokeDC3: jest.fn(),
    exportDC3: jest.fn(),
    getDC3Stats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CertificationController],
      providers: [
        { provide: CertificationService, useValue: mockCertificationService },
      ],
    }).compile();

    controller = module.get<CertificationController>(CertificationController);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("createDC3", () => {
    it("should create a new DC-3 certificate", async () => {
      mockCertificationService.createDC3.mockResolvedValue(mockDC3);

      const result = await controller.createDC3({
        tenantId: mockTenantId,
        traineeId: mockTraineeId,
        courseId: mockCourseId,
      });

      expect(result).toEqual(mockDC3);
      expect(mockCertificationService.createDC3).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        traineeId: mockTraineeId,
        courseId: mockCourseId,
      });
    });
  });

  describe("getDC3List", () => {
    it("should return list of DC-3 certificates", async () => {
      const mockList = {
        data: [mockDC3],
        total: 1,
        skip: 5,
        limit: 10,
      };
      mockCertificationService.getDC3List.mockResolvedValue(mockList);

      const result = await controller.getDC3List(
        mockTenantId,
        mockTraineeId,
        mockCourseId,
        "ISSUED",
        5,
        10,
      );

      expect(result).toEqual(mockList);
      expect(mockCertificationService.getDC3List).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        traineeId: mockTraineeId,
        courseId: mockCourseId,
        status: "ISSUED",
        skip: 5,
        limit: 10,
      });
    });

    it("should handle optional query parameters", async () => {
      mockCertificationService.getDC3List.mockResolvedValue({
        data: [],
        total: 0,
      });

      await controller.getDC3List();

      expect(mockCertificationService.getDC3List).toHaveBeenCalledWith({
        tenantId: undefined,
        traineeId: undefined,
        courseId: undefined,
        status: undefined,
        skip: undefined,
        limit: undefined,
      });
    });

    it("should convert string skip/limit to numbers", async () => {
      mockCertificationService.getDC3List.mockResolvedValue({
        data: [],
        total: 0,
      });

      await controller.getDC3List(
        undefined,
        undefined,
        undefined,
        undefined,
        "10" as any,
        "25" as any,
      );

      expect(mockCertificationService.getDC3List).toHaveBeenCalledWith({
        tenantId: undefined,
        traineeId: undefined,
        courseId: undefined,
        status: undefined,
        skip: 10,
        limit: 25,
      });
    });
  });

  describe("getDC3", () => {
    it("should return DC-3 by ID", async () => {
      mockCertificationService.getDC3.mockResolvedValue(mockDC3);

      const result = await controller.getDC3(mockDC3Id);

      expect(result).toEqual(mockDC3);
      expect(mockCertificationService.getDC3).toHaveBeenCalledWith(mockDC3Id);
    });
  });

  describe("getDC3BySerial", () => {
    it("should return DC-3 by serial number", async () => {
      mockCertificationService.getDC3BySerial.mockResolvedValue(mockDC3);

      const result = await controller.getDC3BySerial(mockSerial);

      expect(result).toEqual(mockDC3);
      expect(mockCertificationService.getDC3BySerial).toHaveBeenCalledWith(
        mockSerial,
      );
    });
  });

  describe("revokeDC3", () => {
    it("should revoke DC-3 with reason", async () => {
      const revokedDC3 = {
        ...mockDC3,
        status: "REVOKED",
        revokedAt: new Date(),
        revokedReason: "Fraudulent data",
      };
      mockCertificationService.revokeDC3.mockResolvedValue(revokedDC3);

      const result = await controller.revokeDC3(mockDC3Id, {
        reason: "Fraudulent data",
      });

      expect(result.status).toBe("REVOKED");
      expect(mockCertificationService.revokeDC3).toHaveBeenCalledWith(
        mockDC3Id,
        "Fraudulent data",
      );
    });

    it("should revoke DC-3 without reason", async () => {
      const revokedDC3 = { ...mockDC3, status: "REVOKED" };
      mockCertificationService.revokeDC3.mockResolvedValue(revokedDC3);

      await controller.revokeDC3(mockDC3Id, {});

      expect(mockCertificationService.revokeDC3).toHaveBeenCalledWith(
        mockDC3Id,
        undefined,
      );
    });
  });

  describe("exportDC3", () => {
    it("should export DC-3 as PDF", async () => {
      mockCertificationService.exportDC3.mockResolvedValue({
        format: ExportFormat.PDF,
        content: "base64-pdf-content",
        filename: "dc3.pdf",
        mimeType: "application/pdf",
      });

      const result = await controller.exportDC3({
        certificationId: mockDC3Id,
        format: ExportFormat.PDF,
      });

      expect(result.format).toBe(ExportFormat.PDF);
      expect(mockCertificationService.exportDC3).toHaveBeenCalledWith({
        certificationId: mockDC3Id,
        format: ExportFormat.PDF,
      });
    });

    it("should export DC-3 as XML", async () => {
      mockCertificationService.exportDC3.mockResolvedValue({
        format: ExportFormat.XML,
        xmlContent: "<dc3>...</dc3>",
        filename: "dc3.xml",
        mimeType: "application/xml",
      });

      const result = await controller.exportDC3({
        certificationId: mockDC3Id,
        format: ExportFormat.XML,
      });

      expect(result.format).toBe(ExportFormat.XML);
    });

    it("should export DC-3 as JSON", async () => {
      mockCertificationService.exportDC3.mockResolvedValue({
        format: ExportFormat.JSON,
        jsonData: mockDC3,
        filename: "dc3.json",
        mimeType: "application/json",
      });

      const result = await controller.exportDC3({
        certificationId: mockDC3Id,
        format: ExportFormat.JSON,
      });

      expect(result.format).toBe(ExportFormat.JSON);
    });
  });

  describe("getStats", () => {
    it("should return DC-3 statistics for tenant", async () => {
      const mockStats = {
        total: 100,
        issued: 95,
        revoked: 5,
        byMonth: [
          { month: "2025-01", count: 30 },
          { month: "2025-02", count: 70 },
        ],
      };
      mockCertificationService.getDC3Stats.mockResolvedValue(mockStats);

      const result = await controller.getStats(mockTenantId);

      expect(result).toEqual(mockStats);
      expect(mockCertificationService.getDC3Stats).toHaveBeenCalledWith(
        mockTenantId,
      );
    });

    it("should return global stats when no tenant specified", async () => {
      const mockStats = { total: 500, issued: 480, revoked: 20 };
      mockCertificationService.getDC3Stats.mockResolvedValue(mockStats);

      const result = await controller.getStats();

      expect(result).toEqual(mockStats);
      expect(mockCertificationService.getDC3Stats).toHaveBeenCalledWith(
        undefined,
      );
    });
  });
});
