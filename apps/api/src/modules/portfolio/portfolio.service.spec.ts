import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioService } from './portfolio.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('PortfolioService', () => {
  let service: PortfolioService;

  const mockTenantId = 'tenant-123';
  const mockTraineeId = 'trainee-123';
  const mockPortfolioId = 'portfolio-123';
  const mockArtifactId = 'artifact-123';

  const mockPortfolio = {
    id: mockPortfolioId,
    traineeId: mockTraineeId,
    title: 'Test Portfolio',
    status: 'IN_PROGRESS',
    artifacts: [
      {
        order: 0,
        notes: 'Test notes',
        artifact: {
          id: mockArtifactId,
          type: 'DOCUMENT',
          ref: '/docs/test.pdf',
          hash: 'abc123',
          signedAt: new Date(),
          signer: { id: 'signer-1', firstName: 'John', lastName: 'Doe', role: 'INSTRUCTOR' },
        },
      },
    ],
    trainee: {
      id: mockTraineeId,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockArtifact = {
    id: mockArtifactId,
    traineeId: mockTraineeId,
    type: 'DOCUMENT',
    ref: '/docs/test.pdf',
    hash: 'abc123',
  };

  const mockTenantClient = {
    portfolio: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    portfolioArtifact: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockPrismaService = {
    forTenant: jest.fn().mockReturnValue(mockTenantClient),
    artifact: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByTrainee', () => {
    it('should return portfolios for trainee', async () => {
      mockTenantClient.portfolio.findMany.mockResolvedValue([mockPortfolio]);

      const result = await service.findByTrainee(mockTenantId, mockTraineeId);

      expect(mockPrismaService.forTenant).toHaveBeenCalledWith(mockTenantId);
      expect(result).toHaveLength(1);
      expect(result[0].traineeId).toBe(mockTraineeId);
    });
  });

  describe('findById', () => {
    it('should return portfolio by ID', async () => {
      mockTenantClient.portfolio.findUnique.mockResolvedValue(mockPortfolio);

      const result = await service.findById(mockTenantId, mockPortfolioId);

      expect(result).toEqual(mockPortfolio);
    });

    it('should throw NotFoundException if not found', async () => {
      mockTenantClient.portfolio.findUnique.mockResolvedValue(null);

      await expect(
        service.findById(mockTenantId, 'invalid-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createArtifact', () => {
    it('should create artifact with hash', async () => {
      mockPrismaService.artifact.create.mockResolvedValue(mockArtifact);

      const result = await service.createArtifact(mockTenantId, mockTraineeId, {
        type: 'DOCUMENT',
        ref: '/docs/test.pdf',
        hash: 'abc123',
      });

      expect(result).toEqual(mockArtifact);
      expect(mockPrismaService.artifact.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          traineeId: mockTraineeId,
          type: 'DOCUMENT',
          hash: 'abc123',
        }),
      });
    });

    it('should set signedAt when signerId provided', async () => {
      mockPrismaService.artifact.create.mockResolvedValue({
        ...mockArtifact,
        signerId: 'signer-1',
        signedAt: new Date(),
      });

      await service.createArtifact(mockTenantId, mockTraineeId, {
        type: 'DOCUMENT',
        ref: '/docs/test.pdf',
        hash: 'abc123',
        signerId: 'signer-1',
      });

      expect(mockPrismaService.artifact.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          signerId: 'signer-1',
          signedAt: expect.any(Date),
        }),
      });
    });
  });

  describe('addArtifactToPortfolio', () => {
    it('should add artifact to portfolio', async () => {
      mockTenantClient.portfolio.findUnique.mockResolvedValue(mockPortfolio);
      mockTenantClient.portfolioArtifact.findFirst.mockResolvedValue({ order: 2 });
      mockTenantClient.portfolioArtifact.create.mockResolvedValue({
        portfolioId: mockPortfolioId,
        artifactId: mockArtifactId,
        order: 3,
        artifact: mockArtifact,
      });

      const result = await service.addArtifactToPortfolio(
        mockTenantId,
        mockPortfolioId,
        mockArtifactId,
        'Notes',
      );

      expect(result.order).toBe(3);
    });

    it('should start at order 0 for first artifact', async () => {
      mockTenantClient.portfolio.findUnique.mockResolvedValue(mockPortfolio);
      mockTenantClient.portfolioArtifact.findFirst.mockResolvedValue(null);
      mockTenantClient.portfolioArtifact.create.mockResolvedValue({
        portfolioId: mockPortfolioId,
        artifactId: mockArtifactId,
        order: 0,
      });

      const result = await service.addArtifactToPortfolio(
        mockTenantId,
        mockPortfolioId,
        mockArtifactId,
      );

      expect(result.order).toBe(0);
    });
  });

  describe('exportPortfolio', () => {
    it('should export portfolio with artifacts', async () => {
      mockTenantClient.portfolio.findUnique.mockResolvedValue(mockPortfolio);

      const result = await service.exportPortfolio(mockTenantId, mockPortfolioId);

      expect(result.portfolio.id).toBe(mockPortfolioId);
      expect(result.artifacts).toHaveLength(1);
      expect(result.integrity.totalArtifacts).toBe(1);
      expect(result.integrity.signedArtifacts).toBe(1);
      expect(result.integrity.exportedAt).toBeDefined();
    });

    it('should count signed artifacts correctly', async () => {
      const portfolioWithUnsigned = {
        ...mockPortfolio,
        artifacts: [
          ...mockPortfolio.artifacts,
          { order: 1, artifact: { ...mockArtifact, signedAt: null } },
        ],
      };
      mockTenantClient.portfolio.findUnique.mockResolvedValue(portfolioWithUnsigned);

      const result = await service.exportPortfolio(mockTenantId, mockPortfolioId);

      expect(result.integrity.totalArtifacts).toBe(2);
      expect(result.integrity.signedArtifacts).toBe(1);
    });
  });
});
