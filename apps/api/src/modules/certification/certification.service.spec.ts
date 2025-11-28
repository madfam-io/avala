import { Test, TestingModule } from '@nestjs/testing';
import { CertificationService } from './certification.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ExportFormat } from './dto/certification.dto';

// Mock pdfkit and qrcode
jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn((event, callback) => {
      if (event === 'data') {
        setTimeout(() => callback(Buffer.from('test')), 0);
      }
      if (event === 'end') {
        setTimeout(() => callback(), 10);
      }
      return { on: jest.fn().mockReturnThis() };
    }),
    fontSize: jest.fn().mockReturnThis(),
    font: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis(),
    moveTo: jest.fn().mockReturnThis(),
    lineTo: jest.fn().mockReturnThis(),
    stroke: jest.fn().mockReturnThis(),
    rect: jest.fn().mockReturnThis(),
    fill: jest.fn().mockReturnThis(),
    fillColor: jest.fn().mockReturnThis(),
    image: jest.fn().mockReturnThis(),
    end: jest.fn(),
    page: { width: 612, height: 792 },
    y: 100,
  }));
});

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,iVBORw0KGgo='),
}));

describe('CertificationService', () => {
  let service: CertificationService;

  const mockTenantId = 'tenant-123';
  const mockTraineeId = 'trainee-123';
  const mockCourseId = 'course-123';
  const mockDC3Id = 'dc3-123';

  const mockDC3 = {
    id: mockDC3Id,
    tenantId: mockTenantId,
    traineeId: mockTraineeId,
    courseId: mockCourseId,
    serial: 'DC3-202401-ABC123',
    status: 'ISSUED',
    issuedAt: new Date(),
    course: {
      id: mockCourseId,
      title: 'Test Course',
      code: 'TC001',
      durationHours: 40,
      standards: [{ code: 'EC0249' }],
    },
    tenant: {
      id: mockTenantId,
      name: 'Test Tenant',
      rfc: 'TEST123456ABC',
    },
  };

  const mockUser = {
    id: mockTraineeId,
    firstName: 'Juan',
    lastName: 'Pérez',
    curp: 'PERJ900101HDFRNN09',
    rfc: 'PERJ900101ABC',
  };

  const mockPrismaService = {
    dC3: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificationService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CertificationService>(CertificationService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDC3', () => {
    it('should create a DC3 certificate', async () => {
      mockPrismaService.dC3.create.mockResolvedValue(mockDC3);

      const result = await service.createDC3({
        tenantId: mockTenantId,
        traineeId: mockTraineeId,
        courseId: mockCourseId,
      });

      expect(result).toEqual(mockDC3);
      expect(mockPrismaService.dC3.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: mockTenantId,
            traineeId: mockTraineeId,
            courseId: mockCourseId,
            status: 'ISSUED',
          }),
        }),
      );
    });
  });

  describe('getDC3', () => {
    it('should return DC3 by ID', async () => {
      mockPrismaService.dC3.findUnique.mockResolvedValue(mockDC3);

      const result = await service.getDC3(mockDC3Id);

      expect(result).toEqual(mockDC3);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.dC3.findUnique.mockResolvedValue(null);

      await expect(service.getDC3('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDC3BySerial', () => {
    it('should return DC3 by serial', async () => {
      mockPrismaService.dC3.findUnique.mockResolvedValue(mockDC3);

      const result = await service.getDC3BySerial('DC3-202401-ABC123');

      expect(result).toEqual(mockDC3);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.dC3.findUnique.mockResolvedValue(null);

      await expect(service.getDC3BySerial('INVALID')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDC3List', () => {
    it('should return paginated DC3 list', async () => {
      mockPrismaService.dC3.findMany.mockResolvedValue([mockDC3]);
      mockPrismaService.dC3.count.mockResolvedValue(1);

      const result = await service.getDC3List({ tenantId: mockTenantId });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by trainee', async () => {
      mockPrismaService.dC3.findMany.mockResolvedValue([mockDC3]);
      mockPrismaService.dC3.count.mockResolvedValue(1);

      await service.getDC3List({ traineeId: mockTraineeId });

      expect(mockPrismaService.dC3.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ traineeId: mockTraineeId }),
        }),
      );
    });
  });

  describe('revokeDC3', () => {
    it('should revoke DC3', async () => {
      mockPrismaService.dC3.findUnique.mockResolvedValue(mockDC3);
      mockPrismaService.dC3.update.mockResolvedValue({ ...mockDC3, status: 'REVOKED' });

      const result = await service.revokeDC3(mockDC3Id, 'Duplicate');

      expect(result.status).toBe('REVOKED');
    });

    it('should throw if already revoked', async () => {
      mockPrismaService.dC3.findUnique.mockResolvedValue({
        ...mockDC3,
        status: 'REVOKED',
      });

      await expect(service.revokeDC3(mockDC3Id)).rejects.toThrow(BadRequestException);
    });

    it('should throw if not found', async () => {
      mockPrismaService.dC3.findUnique.mockResolvedValue(null);

      await expect(service.revokeDC3('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('exportDC3', () => {
    beforeEach(() => {
      mockPrismaService.dC3.findUnique.mockResolvedValue(mockDC3);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
    });

    it('should export DC3 as PDF', async () => {
      const result = await service.exportDC3({
        certificationId: mockDC3Id,
        format: ExportFormat.PDF,
        includeQRCode: true,
      });

      expect(result.format).toBe(ExportFormat.PDF);
      expect(result.filename).toContain('.pdf');
      expect(result.mimeType).toBe('application/pdf');
    });

    it('should export DC3 as XML', async () => {
      const result = await service.exportDC3({
        certificationId: mockDC3Id,
        format: ExportFormat.XML,
      });

      expect(result.format).toBe(ExportFormat.XML);
      expect(result.filename).toContain('.xml');
      expect(result.xmlContent).toContain('<?xml');
    });

    it('should export DC3 as JSON', async () => {
      const result = await service.exportDC3({
        certificationId: mockDC3Id,
        format: ExportFormat.JSON,
      });

      expect(result.format).toBe(ExportFormat.JSON);
      expect(result.jsonData).toBeDefined();
    });

    it('should throw if trainee not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.exportDC3({
          certificationId: mockDC3Id,
          format: ExportFormat.PDF,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDC3Stats', () => {
    it('should return DC3 statistics', async () => {
      mockPrismaService.dC3.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(90)
        .mockResolvedValueOnce(10);

      const result = await service.getDC3Stats();

      expect(result.total).toBe(100);
      expect(result.byStatus.ISSUED).toBe(90);
      expect(result.byStatus.REVOKED).toBe(10);
    });

    it('should filter stats by tenant', async () => {
      mockPrismaService.dC3.count.mockResolvedValue(50);

      await service.getDC3Stats(mockTenantId);

      expect(mockPrismaService.dC3.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: mockTenantId }),
        }),
      );
    });
  });
});
