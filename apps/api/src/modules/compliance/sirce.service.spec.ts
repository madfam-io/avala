import { Test, TestingModule } from '@nestjs/testing';
import { SIRCEService } from './sirce.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SIRCEExportFormat } from './dto/sirce.dto';

describe('SIRCEService', () => {
  let service: SIRCEService;

  const mockTenantId = 'tenant-123';

  const mockTenant = {
    id: mockTenantId,
    name: 'Test Tenant',
    slug: 'test-tenant',
    rfc: 'TEST123456ABC',
  };

  const mockDC3Record = {
    id: 'dc3-1',
    serial: 'DC3-2024-001',
    tenantId: mockTenantId,
    traineeId: 'user-123',
    courseId: 'course-123',
    status: 'ISSUED',
    issuedAt: new Date('2024-06-15'),
    course: {
      id: 'course-123',
      title: 'Test Course',
      durationHours: 40,
      objectives: 'Learn testing',
      modality: 'ONLINE',
      category: 'TECHNICAL',
    },
    tenant: mockTenant,
  };

  const mockUser = {
    id: 'user-123',
    firstName: 'Juan',
    lastName: 'Pérez',
    curp: 'PERJ900101HDFRNN09',
    rfc: 'PERJ900101ABC',
    jobTitle: 'Developer',
    department: 'IT',
  };

  const mockExportRecord = {
    id: 'export-1',
    tenantId: mockTenantId,
    period: '2024-06',
    fileRef: 'SIRCE_2024-06_test.xml',
    status: 'COMPLETED',
    createdAt: new Date(),
  };

  const mockPrismaService = {
    tenant: {
      findUnique: jest.fn(),
    },
    dC3: {
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    sIRCEExport: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SIRCEService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SIRCEService>(SIRCEService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createExport', () => {
    beforeEach(() => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.dC3.findMany.mockResolvedValue([mockDC3Record]);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.sIRCEExport.create.mockResolvedValue(mockExportRecord);
    });

    it('should create XML export', async () => {
      const result = await service.createExport({
        tenantId: mockTenantId,
        period: '2024-06',
        format: SIRCEExportFormat.XML,
      });

      expect(result.id).toBe('export-1');
      expect(result.format).toBe(SIRCEExportFormat.XML);
      expect(result.recordCount).toBe(1);
      expect(result.content).toBeDefined();
    });

    it('should create CSV export', async () => {
      const result = await service.createExport({
        tenantId: mockTenantId,
        period: '2024-06',
        format: SIRCEExportFormat.CSV,
      });

      expect(result.format).toBe(SIRCEExportFormat.CSV);
      expect(result.content).toBeDefined();
    });

    it('should create JSON export', async () => {
      const result = await service.createExport({
        tenantId: mockTenantId,
        period: '2024-06',
        format: SIRCEExportFormat.JSON,
      });

      expect(result.format).toBe(SIRCEExportFormat.JSON);
      expect(result.records).toBeDefined();
    });

    it('should throw NotFoundException for invalid tenant', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);

      await expect(
        service.createExport({
          tenantId: 'invalid-tenant',
          period: '2024-06',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should parse yearly period correctly', async () => {
      const result = await service.createExport({
        tenantId: mockTenantId,
        period: '2024',
      });

      expect(result).toBeDefined();
    });

    it('should parse quarterly period correctly', async () => {
      const result = await service.createExport({
        tenantId: mockTenantId,
        period: '2024-Q2',
      });

      expect(result).toBeDefined();
    });

    it('should use custom date range when provided', async () => {
      const result = await service.createExport({
        tenantId: mockTenantId,
        period: 'custom',
        startDate: '2024-01-01',
        endDate: '2024-06-30',
      });

      expect(result).toBeDefined();
    });
  });

  describe('getExport', () => {
    it('should return export by ID', async () => {
      mockPrismaService.sIRCEExport.findUnique.mockResolvedValue({
        ...mockExportRecord,
        tenant: mockTenant,
      });

      const result = await service.getExport('export-1');

      expect(result.id).toBe('export-1');
      expect(result.period).toBe('2024-06');
    });

    it('should throw NotFoundException for invalid ID', async () => {
      mockPrismaService.sIRCEExport.findUnique.mockResolvedValue(null);

      await expect(service.getExport('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listExports', () => {
    it('should return paginated exports', async () => {
      mockPrismaService.sIRCEExport.findMany.mockResolvedValue([mockExportRecord]);
      mockPrismaService.sIRCEExport.count.mockResolvedValue(1);

      const result = await service.listExports({
        tenantId: mockTenantId,
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by period', async () => {
      mockPrismaService.sIRCEExport.findMany.mockResolvedValue([]);
      mockPrismaService.sIRCEExport.count.mockResolvedValue(0);

      await service.listExports({
        tenantId: mockTenantId,
        period: '2024-06',
      });

      expect(mockPrismaService.sIRCEExport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ period: '2024-06' }),
        }),
      );
    });
  });

  describe('validateExportData', () => {
    beforeEach(() => {
      mockPrismaService.dC3.findMany.mockResolvedValue([mockDC3Record]);
    });

    it('should validate export data successfully', async () => {
      const result = await service.validateExportData({
        tenantId: mockTenantId,
        period: '2024-06',
      });

      expect(result.isValid).toBe(true);
      expect(result.totalRecords).toBe(1);
      expect(result.validRecords).toBe(1);
    });

    it('should detect invalid records', async () => {
      mockPrismaService.dC3.findMany.mockResolvedValue([
        { ...mockDC3Record, traineeId: null },
      ]);

      const result = await service.validateExportData({
        tenantId: mockTenantId,
        period: '2024-06',
      });

      expect(result.isValid).toBe(false);
      expect(result.invalidRecords).toBe(1);
    });

    it('should detect warnings', async () => {
      mockPrismaService.dC3.findMany.mockResolvedValue([
        { ...mockDC3Record, course: { ...mockDC3Record.course, durationHours: null } },
      ]);

      const result = await service.validateExportData({
        tenantId: mockTenantId,
        period: '2024-06',
      });

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('regenerateExport', () => {
    it('should regenerate export with new format', async () => {
      mockPrismaService.sIRCEExport.findUnique.mockResolvedValue(mockExportRecord);
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.dC3.findMany.mockResolvedValue([mockDC3Record]);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.sIRCEExport.create.mockResolvedValue(mockExportRecord);

      const result = await service.regenerateExport('export-1', SIRCEExportFormat.CSV);

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException for invalid export ID', async () => {
      mockPrismaService.sIRCEExport.findUnique.mockResolvedValue(null);

      await expect(
        service.regenerateExport('invalid-id', SIRCEExportFormat.XML),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('period parsing', () => {
    beforeEach(() => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.dC3.findMany.mockResolvedValue([]);
      mockPrismaService.sIRCEExport.create.mockResolvedValue(mockExportRecord);
    });

    it('should throw BadRequestException for invalid period format', async () => {
      await expect(
        service.createExport({
          tenantId: mockTenantId,
          period: 'invalid-period',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
