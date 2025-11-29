import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { CertificatesService } from "./certificates.service";
import { PrismaService } from "../../database/prisma.service";
import { MailService } from "../mail/mail.service";

// Mock pdfkit
jest.mock("pdfkit", () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn((event, callback) => {
      if (event === "data") {
        setTimeout(() => callback(Buffer.from("pdf-chunk")), 0);
      }
      if (event === "end") {
        setTimeout(() => callback(), 10);
      }
      return { on: jest.fn().mockReturnThis() };
    }),
    fontSize: jest.fn().mockReturnThis(),
    font: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis(),
    rect: jest.fn().mockReturnThis(),
    fillAndStroke: jest.fn().mockReturnThis(),
    fillColor: jest.fn().mockReturnThis(),
    image: jest.fn().mockReturnThis(),
    end: jest.fn(),
    y: 100,
    page: {
      width: 612,
      height: 792,
      margins: { left: 50, right: 50, top: 50, bottom: 50 },
    },
  }));
});

// Mock qrcode
jest.mock("qrcode", () => ({
  toBuffer: jest.fn().mockResolvedValue(Buffer.from("qr-code-data")),
}));

describe("CertificatesService", () => {
  let service: CertificatesService;

  const mockTenantId = "tenant-123";
  const mockEnrollmentId = "enrollment-123";
  const mockCertificateId = "cert-123";
  const mockUserId = "user-123";

  const mockUser = {
    id: mockUserId,
    firstName: "Juan",
    lastName: "Pérez",
    email: "juan@example.com",
    curp: "CURP123456789012",
    rfc: "RFC1234567890",
  };

  const mockCourse = {
    id: "course-123",
    title: "Seguridad Industrial",
    code: "SI-001",
    durationHours: 40,
    stpsRegistrationNumber: "STPS-001",
    owner: {
      firstName: "María",
      lastName: "García",
      email: "maria@example.com",
    },
    modules: [],
  };

  const mockTenant = {
    id: mockTenantId,
    name: "Test Company",
    legalName: "Test Company S.A. de C.V.",
    rfc: "RFC0987654321",
    representativeName: "Carlos Ruiz",
  };

  const mockEnrollment = {
    id: mockEnrollmentId,
    userId: mockUserId,
    courseId: "course-123",
    status: "COMPLETED",
    enrolledAt: new Date("2024-01-01"),
    completedAt: new Date("2024-02-01"),
    user: mockUser,
    course: mockCourse,
    certificates: [],
  };

  const mockCertificate = {
    id: mockCertificateId,
    certificateUuid: "cert-uuid-123",
    enrollmentId: mockEnrollmentId,
    folio: "DC3-2024-000001",
    issuedAt: new Date(),
    revokedAt: null,
    revokedBy: null,
    revokedReason: null,
    pdfPath: null,
    enrollment: mockEnrollment,
  };

  const mockTenantClient = {
    courseEnrollment: {
      findUnique: jest.fn(),
    },
    certificate: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockPrismaService = {
    forTenant: jest.fn().mockReturnValue(mockTenantClient),
    tenant: {
      findUnique: jest.fn(),
    },
    certificate: {
      findUnique: jest.fn(),
    },
  };

  const mockMailService = {
    sendCertificateEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificatesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<CertificatesService>(CertificatesService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("generateDc3", () => {
    it("should throw NotFoundException when enrollment not found", async () => {
      mockTenantClient.courseEnrollment.findUnique.mockResolvedValue(null);

      await expect(
        service.generateDc3(mockTenantId, mockEnrollmentId),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException when enrollment not completed", async () => {
      mockTenantClient.courseEnrollment.findUnique.mockResolvedValue({
        ...mockEnrollment,
        status: "IN_PROGRESS",
      });

      await expect(
        service.generateDc3(mockTenantId, mockEnrollmentId),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw NotFoundException when tenant not found", async () => {
      mockTenantClient.courseEnrollment.findUnique.mockResolvedValue(
        mockEnrollment,
      );
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);

      await expect(
        service.generateDc3(mockTenantId, mockEnrollmentId),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException when missing tenant RFC", async () => {
      mockTenantClient.courseEnrollment.findUnique.mockResolvedValue(
        mockEnrollment,
      );
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        ...mockTenant,
        rfc: null,
      });

      await expect(
        service.generateDc3(mockTenantId, mockEnrollmentId),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException when missing user CURP", async () => {
      mockTenantClient.courseEnrollment.findUnique.mockResolvedValue({
        ...mockEnrollment,
        user: { ...mockUser, curp: null },
      });
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);

      await expect(
        service.generateDc3(mockTenantId, mockEnrollmentId),
      ).rejects.toThrow(BadRequestException);
    });

    it("should regenerate PDF for existing certificate", async () => {
      mockTenantClient.courseEnrollment.findUnique.mockResolvedValue({
        ...mockEnrollment,
        certificates: [mockCertificate],
      });
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.generateDc3(mockTenantId, mockEnrollmentId);

      expect(result).toBeInstanceOf(Buffer);
      expect(mockTenantClient.certificate.create).not.toHaveBeenCalled();
    });

    it("should create new certificate when none exists", async () => {
      mockTenantClient.courseEnrollment.findUnique.mockResolvedValue(
        mockEnrollment,
      );
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockTenantClient.certificate.count.mockResolvedValue(0);
      mockTenantClient.certificate.create.mockResolvedValue(mockCertificate);
      mockMailService.sendCertificateEmail.mockResolvedValue(undefined);

      const result = await service.generateDc3(mockTenantId, mockEnrollmentId);

      expect(result).toBeInstanceOf(Buffer);
      const currentYear = new Date().getFullYear();
      expect(mockTenantClient.certificate.create).toHaveBeenCalledWith({
        data: {
          enrollmentId: mockEnrollmentId,
          folio: `DC3-${currentYear}-000001`,
          pdfPath: null,
        },
      });
    });

    it("should send certificate email after generation", async () => {
      mockTenantClient.courseEnrollment.findUnique.mockResolvedValue(
        mockEnrollment,
      );
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockTenantClient.certificate.count.mockResolvedValue(5);
      mockTenantClient.certificate.create.mockResolvedValue(mockCertificate);
      mockMailService.sendCertificateEmail.mockResolvedValue(undefined);

      await service.generateDc3(mockTenantId, mockEnrollmentId);

      expect(mockMailService.sendCertificateEmail).toHaveBeenCalledWith({
        email: mockUser.email,
        firstName: mockUser.firstName,
        courseTitle: mockCourse.title,
        folio: mockCertificate.folio,
        pdfBuffer: expect.any(Buffer),
      });
    });

    it("should continue even if email fails", async () => {
      mockTenantClient.courseEnrollment.findUnique.mockResolvedValue(
        mockEnrollment,
      );
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockTenantClient.certificate.count.mockResolvedValue(0);
      mockTenantClient.certificate.create.mockResolvedValue(mockCertificate);
      mockMailService.sendCertificateEmail.mockRejectedValue(
        new Error("Email failed"),
      );

      const result = await service.generateDc3(mockTenantId, mockEnrollmentId);

      expect(result).toBeInstanceOf(Buffer);
    });

    it("should generate sequential folio numbers", async () => {
      mockTenantClient.courseEnrollment.findUnique.mockResolvedValue(
        mockEnrollment,
      );
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockTenantClient.certificate.count.mockResolvedValue(42);
      mockTenantClient.certificate.create.mockResolvedValue({
        ...mockCertificate,
        folio: `DC3-${new Date().getFullYear()}-000043`,
      });
      mockMailService.sendCertificateEmail.mockResolvedValue(undefined);

      await service.generateDc3(mockTenantId, mockEnrollmentId);

      expect(mockTenantClient.certificate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          folio: expect.stringMatching(/^DC3-\d{4}-000043$/),
        }),
      });
    });
  });

  describe("getCertificate", () => {
    it("should return certificate by enrollment ID", async () => {
      mockTenantClient.certificate.findFirst.mockResolvedValue(mockCertificate);

      const result = await service.getCertificate(
        mockTenantId,
        mockEnrollmentId,
      );

      expect(result).toEqual(mockCertificate);
      expect(mockTenantClient.certificate.findFirst).toHaveBeenCalledWith({
        where: {
          enrollmentId: mockEnrollmentId,
          revokedAt: null,
        },
        include: {
          enrollment: {
            include: {
              user: true,
              course: true,
            },
          },
        },
        orderBy: {
          issuedAt: "desc",
        },
      });
    });

    it("should throw NotFoundException when certificate not found", async () => {
      mockTenantClient.certificate.findFirst.mockResolvedValue(null);

      await expect(
        service.getCertificate(mockTenantId, mockEnrollmentId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("revokeCertificate", () => {
    it("should revoke certificate with reason", async () => {
      const revokedCert = {
        ...mockCertificate,
        revokedAt: new Date(),
        revokedBy: mockUserId,
        revokedReason: "Test revocation",
      };
      mockTenantClient.certificate.update.mockResolvedValue(revokedCert);

      const result = await service.revokeCertificate(
        mockTenantId,
        mockCertificateId,
        mockUserId,
        "Test revocation",
      );

      expect(result.revokedAt).toBeDefined();
      expect(result.revokedBy).toBe(mockUserId);
      expect(result.revokedReason).toBe("Test revocation");
      expect(mockTenantClient.certificate.update).toHaveBeenCalledWith({
        where: { id: mockCertificateId },
        data: {
          revokedAt: expect.any(Date),
          revokedBy: mockUserId,
          revokedReason: "Test revocation",
        },
      });
    });
  });

  describe("verifyPublicCertificate", () => {
    it("should return valid=false when certificate not found", async () => {
      mockPrismaService.certificate.findUnique.mockResolvedValue(null);

      const result = await service.verifyPublicCertificate("invalid-uuid");

      expect(result).toEqual({ valid: false });
    });

    it("should return valid=false for revoked certificate", async () => {
      const revokedCert = {
        ...mockCertificate,
        revokedAt: new Date(),
        revokedReason: "Invalid data",
        enrollment: {
          ...mockEnrollment,
          course: {
            ...mockCourse,
            tenantId: mockTenantId,
          },
        },
      };
      mockPrismaService.certificate.findUnique.mockResolvedValue(revokedCert);

      const result = await service.verifyPublicCertificate(
        mockCertificate.certificateUuid,
      );

      expect(result.valid).toBe(false);
      expect(result.certificate.revokedAt).toBeDefined();
      expect(result.certificate.revokedReason).toBe("Invalid data");
    });

    it("should return valid=true with public data for valid certificate", async () => {
      const validCert = {
        ...mockCertificate,
        enrollment: {
          user: {
            firstName: "Juan",
            lastName: "Pérez",
            curp: "CURP123456789012",
          },
          course: {
            title: "Seguridad Industrial",
            code: "SI-001",
            durationHours: 40,
            ecCodes: ["EC0249"],
            tenantId: mockTenantId,
          },
        },
      };
      mockPrismaService.certificate.findUnique.mockResolvedValue(validCert);
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        name: "Test Company",
        legalName: "Test Company S.A. de C.V.",
      });

      const result = await service.verifyPublicCertificate(
        mockCertificate.certificateUuid,
      );

      expect(result.valid).toBe(true);
      expect(result.trainee.fullName).toBe("Juan Pérez");
      expect(result.trainee.curp).toBe("CURP123456789012");
      expect(result.course.title).toBe("Seguridad Industrial");
      expect(result.tenant.legalName).toBe("Test Company S.A. de C.V.");
    });
  });
});
