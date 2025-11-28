import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { PrismaService } from '../../database/prisma.service';
import { MailService } from '../mail/mail.service';

// Mock pdfkit and qrcode
jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn((event, callback) => {
      if (event === 'end') {
        setTimeout(() => callback(), 0);
      }
      return this;
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
    page: {
      width: 612,
      height: 792,
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    },
    y: 100,
  }));
});

jest.mock('qrcode', () => ({
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('qr-code')),
}));

describe('CertificatesService', () => {
  let service: CertificatesService;

  const mockTenantId = 'tenant-123';
  const mockEnrollmentId = 'enrollment-456';
  const mockCertificateId = 'cert-789';
  const mockCertificateUuid = 'uuid-abc-123';

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    curp: 'CURP123456ABCDEF01',
    rfc: 'RFC123456ABC',
  };

  const mockCourse = {
    id: 'course-123',
    title: 'Safety Training Course',
    code: 'SAFETY-101',
    durationHours: 20,
    stpsRegistrationNumber: 'STPS-12345',
    ecCodes: ['EC0217'],
    tenantId: mockTenantId,
    owner: {
      id: 'instructor-123',
      firstName: 'Jane',
      lastName: 'Instructor',
      email: 'instructor@example.com',
    },
    modules: [],
  };

  const mockTenant = {
    id: mockTenantId,
    name: 'Test Company',
    legalName: 'Test Company S.A. de C.V.',
    rfc: 'TCO123456ABC',
    representativeName: 'Legal Representative',
  };

  const mockEnrollment = {
    id: mockEnrollmentId,
    status: 'COMPLETED',
    enrolledAt: new Date('2024-01-01'),
    completedAt: new Date('2024-02-01'),
    user: mockUser,
    course: mockCourse,
    certificates: [],
  };

  const mockCertificate = {
    id: mockCertificateId,
    certificateUuid: mockCertificateUuid,
    enrollmentId: mockEnrollmentId,
    folio: 'DC3-2024-000001',
    issuedAt: new Date('2024-02-01'),
    revokedAt: null,
    revokedBy: null,
    revokedReason: null,
    pdfPath: null,
  };

  const mockTenantClient = {
    courseEnrollment: {
      findUnique: jest.fn(),
    },
    certificate: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockPrisma = {
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
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificatesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<CertificatesService>(CertificatesService);
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  describe('getCertificate', () => {
    it('should return certificate by enrollment ID', async () => {
      const certificateWithEnrollment = {
        ...mockCertificate,
        enrollment: {
          ...mockEnrollment,
          user: mockUser,
          course: mockCourse,
        },
      };

      mockTenantClient.certificate.findFirst.mockResolvedValue(certificateWithEnrollment);

      const result = await service.getCertificate(mockTenantId, mockEnrollmentId);

      expect(result).toEqual(certificateWithEnrollment);
      expect(mockPrisma.forTenant).toHaveBeenCalledWith(mockTenantId);
    });

    it('should throw NotFoundException when certificate not found', async () => {
      mockTenantClient.certificate.findFirst.mockResolvedValue(null);

      await expect(
        service.getCertificate(mockTenantId, mockEnrollmentId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('revokeCertificate', () => {
    it('should revoke certificate successfully', async () => {
      const revokedCertificate = {
        ...mockCertificate,
        revokedAt: new Date(),
        revokedBy: 'admin-123',
        revokedReason: 'Fraudulent completion',
      };

      mockTenantClient.certificate.update.mockResolvedValue(revokedCertificate);

      const result = await service.revokeCertificate(
        mockTenantId,
        mockCertificateId,
        'admin-123',
        'Fraudulent completion',
      );

      expect(result.revokedAt).toBeDefined();
      expect(result.revokedBy).toBe('admin-123');
      expect(result.revokedReason).toBe('Fraudulent completion');
    });
  });

  describe('verifyPublicCertificate', () => {
    it('should return valid certificate data', async () => {
      const fullCertificate = {
        ...mockCertificate,
        enrollment: {
          user: {
            firstName: mockUser.firstName,
            lastName: mockUser.lastName,
            curp: mockUser.curp,
          },
          course: {
            title: mockCourse.title,
            code: mockCourse.code,
            durationHours: mockCourse.durationHours,
            ecCodes: ['EC0217'],
            tenantId: mockTenantId,
          },
        },
      };

      mockPrisma.certificate.findUnique.mockResolvedValue(fullCertificate);
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.verifyPublicCertificate(mockCertificateUuid);

      expect(result.valid).toBe(true);
      expect(result.certificate).toEqual({
        certificateUuid: mockCertificateUuid,
        folio: mockCertificate.folio,
        issuedAt: mockCertificate.issuedAt,
        revokedAt: null,
        revokedReason: null,
      });
      expect(result.trainee?.fullName).toBe('John Doe');
    });

    it('should return invalid for revoked certificate', async () => {
      const revokedCertificate = {
        ...mockCertificate,
        revokedAt: new Date('2024-03-01'),
        revokedReason: 'Invalid completion',
        enrollment: {
          user: mockUser,
          course: mockCourse,
        },
      };

      mockPrisma.certificate.findUnique.mockResolvedValue(revokedCertificate);

      const result = await service.verifyPublicCertificate(mockCertificateUuid);

      expect(result.valid).toBe(false);
      expect(result.certificate?.revokedAt).toBeDefined();
    });

    it('should return invalid when certificate not found', async () => {
      mockPrisma.certificate.findUnique.mockResolvedValue(null);

      const result = await service.verifyPublicCertificate(mockCertificateUuid);

      expect(result).toEqual({ valid: false });
    });
  });

  describe('generateDc3', () => {
    beforeEach(() => {
      mockTenantClient.courseEnrollment.findUnique.mockResolvedValue(mockEnrollment);
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
      mockTenantClient.certificate.count.mockResolvedValue(0);
      mockTenantClient.certificate.create.mockResolvedValue(mockCertificate);
      mockMailService.sendCertificateEmail.mockResolvedValue(undefined);
    });

    it('should throw NotFoundException when enrollment not found', async () => {
      mockTenantClient.courseEnrollment.findUnique.mockResolvedValue(null);

      await expect(
        service.generateDc3(mockTenantId, mockEnrollmentId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when enrollment is not completed', async () => {
      const incompleteEnrollment = {
        ...mockEnrollment,
        status: 'IN_PROGRESS',
      };
      mockTenantClient.courseEnrollment.findUnique.mockResolvedValue(incompleteEnrollment);

      await expect(
        service.generateDc3(mockTenantId, mockEnrollmentId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when tenant not found', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      await expect(
        service.generateDc3(mockTenantId, mockEnrollmentId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when tenant RFC is missing', async () => {
      const tenantWithoutRfc = { ...mockTenant, rfc: null };
      mockPrisma.tenant.findUnique.mockResolvedValue(tenantWithoutRfc);

      await expect(
        service.generateDc3(mockTenantId, mockEnrollmentId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when user CURP is missing', async () => {
      const enrollmentWithoutCurp = {
        ...mockEnrollment,
        user: { ...mockUser, curp: null },
      };
      mockTenantClient.courseEnrollment.findUnique.mockResolvedValue(enrollmentWithoutCurp);

      await expect(
        service.generateDc3(mockTenantId, mockEnrollmentId),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
