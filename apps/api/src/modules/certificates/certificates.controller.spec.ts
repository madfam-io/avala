import { Test, TestingModule } from "@nestjs/testing";
import { CertificatesController } from "./certificates.controller";
import { CertificatesService } from "./certificates.service";
import { AuthenticatedRequest } from "../../common/interfaces";

describe("CertificatesController", () => {
  let controller: CertificatesController;
  let certificatesService: jest.Mocked<CertificatesService>;

  beforeEach(async () => {
    const mockCertificatesService = {
      generateDc3: jest.fn(),
      getCertificate: jest.fn(),
      revokeCertificate: jest.fn(),
      verifyPublicCertificate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CertificatesController],
      providers: [
        { provide: CertificatesService, useValue: mockCertificatesService },
      ],
    }).compile();

    controller = module.get<CertificatesController>(CertificatesController);
    certificatesService = module.get(CertificatesService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("verifyPublicCertificate", () => {
    it("should verify a certificate publicly", async () => {
      const mockResult = {
        valid: true,
        certificate: { folio: "DC3-2024-001" },
      };
      certificatesService.verifyPublicCertificate.mockResolvedValue(
        mockResult as any,
      );

      const result = await controller.verifyPublicCertificate("uuid-123");

      expect(certificatesService.verifyPublicCertificate).toHaveBeenCalledWith(
        "uuid-123",
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe("generateCertificate", () => {
    it("should generate a DC3 certificate", async () => {
      const mockBuffer = Buffer.from("PDF content");
      certificatesService.generateDc3.mockResolvedValue(mockBuffer);

      const mockReq = {
        user: { tenantId: "tenant-1" },
      } as unknown as AuthenticatedRequest;
      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
      };

      await controller.generateCertificate(mockReq, "enroll-1", mockRes as any);

      expect(certificatesService.generateDc3).toHaveBeenCalledWith(
        "tenant-1",
        "enroll-1",
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "application/pdf",
      );
      expect(mockRes.send).toHaveBeenCalledWith(mockBuffer);
    });
  });

  describe("getCertificate", () => {
    it("should get certificate by enrollment id", async () => {
      const mockResult = { id: "cert-1", folio: "DC3-2024-001" };
      certificatesService.getCertificate.mockResolvedValue(mockResult as any);

      const mockReq = {
        user: { tenantId: "tenant-1" },
      } as unknown as AuthenticatedRequest;
      const result = await controller.getCertificate(mockReq, "enroll-1");

      expect(certificatesService.getCertificate).toHaveBeenCalledWith(
        "tenant-1",
        "enroll-1",
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe("downloadCertificate", () => {
    it("should download certificate PDF", async () => {
      const mockBuffer = Buffer.from("PDF content");
      certificatesService.generateDc3.mockResolvedValue(mockBuffer);

      const mockReq = {
        user: { tenantId: "tenant-1" },
      } as unknown as AuthenticatedRequest;
      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
      };

      await controller.downloadCertificate(mockReq, "enroll-1", mockRes as any);

      expect(certificatesService.generateDc3).toHaveBeenCalledWith(
        "tenant-1",
        "enroll-1",
      );
      expect(mockRes.send).toHaveBeenCalledWith(mockBuffer);
    });
  });

  describe("revokeCertificate", () => {
    it("should revoke a certificate", async () => {
      const mockResult = { id: "cert-1", status: "REVOKED" };
      certificatesService.revokeCertificate.mockResolvedValue(
        mockResult as any,
      );

      const mockReq = {
        user: { tenantId: "tenant-1", id: "user-1" },
      } as unknown as AuthenticatedRequest;
      const result = await controller.revokeCertificate(mockReq, "cert-1", {
        reason: "Invalid data",
      });

      expect(certificatesService.revokeCertificate).toHaveBeenCalledWith(
        "tenant-1",
        "cert-1",
        "user-1",
        "Invalid data",
      );
      expect(result).toEqual(mockResult);
    });
  });
});
