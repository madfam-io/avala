import { Test, TestingModule } from '@nestjs/testing';
import { CompetencyService } from './competency.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CompetencyService', () => {
  let service: CompetencyService;

  const mockTenantId = 'tenant-123';
  const mockStandardId = 'standard-123';

  const mockStandard = {
    id: mockStandardId,
    code: 'EC0001',
    title: 'Test Competency Standard',
    status: 'ACTIVE',
    version: '1.0',
    createdAt: new Date(),
    elements: [
      {
        id: 'element-1',
        title: 'Element 1',
        index: 0,
        criteria: [
          { id: 'crit-1', code: 'C1', text: 'Criterion 1', lessons: [] },
          { id: 'crit-2', code: 'C2', text: 'Criterion 2', lessons: [{ id: 'lesson-1' }] },
        ],
      },
    ],
  };

  const mockTenantClient = {
    competencyStandard: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockPrismaService = {
    forTenant: jest.fn().mockReturnValue(mockTenantClient),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompetencyService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CompetencyService>(CompetencyService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('search', () => {
    it('should search competency standards by query', async () => {
      const mockStandards = [mockStandard];
      mockTenantClient.competencyStandard.findMany.mockResolvedValue(mockStandards);

      const result = await service.search(mockTenantId, 'EC0001');

      expect(mockPrismaService.forTenant).toHaveBeenCalledWith(mockTenantId);
      expect(mockTenantClient.competencyStandard.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { code: { contains: 'EC0001', mode: 'insensitive' } },
            { title: { contains: 'EC0001', mode: 'insensitive' } },
          ],
          status: 'ACTIVE',
        },
        include: {
          elements: {
            include: {
              criteria: true,
            },
          },
        },
        orderBy: { code: 'asc' },
      });
      expect(result).toEqual(mockStandards);
    });
  });

  describe('findByCode', () => {
    it('should find competency standard by code', async () => {
      mockTenantClient.competencyStandard.findFirst.mockResolvedValue(mockStandard);

      const result = await service.findByCode(mockTenantId, 'EC0001');

      expect(result).toEqual(mockStandard);
    });

    it('should find competency standard by code and version', async () => {
      mockTenantClient.competencyStandard.findFirst.mockResolvedValue(mockStandard);

      const result = await service.findByCode(mockTenantId, 'EC0001', '1.0');

      expect(mockTenantClient.competencyStandard.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            code: 'EC0001',
            version: '1.0',
          }),
        }),
      );
      expect(result).toEqual(mockStandard);
    });

    it('should throw NotFoundException when standard not found', async () => {
      mockTenantClient.competencyStandard.findFirst.mockResolvedValue(null);

      await expect(service.findByCode(mockTenantId, 'EC9999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all competency standards', async () => {
      const mockStandards = [
        { ...mockStandard, _count: { elements: 1, courses: 2 } },
      ];
      mockTenantClient.competencyStandard.findMany.mockResolvedValue(mockStandards);

      const result = await service.findAll(mockTenantId);

      expect(mockTenantClient.competencyStandard.findMany).toHaveBeenCalledWith({
        where: { status: 'ACTIVE' },
        include: {
          _count: {
            select: {
              elements: true,
              courses: true,
            },
          },
        },
        orderBy: { code: 'asc' },
      });
      expect(result).toEqual(mockStandards);
    });
  });

  describe('getCoverage', () => {
    it('should calculate coverage for a standard', async () => {
      mockTenantClient.competencyStandard.findUnique.mockResolvedValue(mockStandard);

      const result = await service.getCoverage(mockTenantId, mockStandardId);

      expect(result.standardId).toBe(mockStandardId);
      expect(result.code).toBe('EC0001');
      expect(result.totalCriteria).toBe(2);
      expect(result.coveredCriteria).toBe(1);
      expect(result.coveragePercentage).toBe(50);
      expect(result.gaps).toHaveLength(1);
      expect(result.gaps[0].code).toBe('C1');
    });

    it('should throw NotFoundException when standard not found', async () => {
      mockTenantClient.competencyStandard.findUnique.mockResolvedValue(null);

      await expect(service.getCoverage(mockTenantId, 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return 0% coverage when no criteria', async () => {
      const emptyStandard = { ...mockStandard, elements: [] };
      mockTenantClient.competencyStandard.findUnique.mockResolvedValue(emptyStandard);

      const result = await service.getCoverage(mockTenantId, mockStandardId);

      expect(result.coveragePercentage).toBe(0);
      expect(result.totalCriteria).toBe(0);
    });
  });
});
