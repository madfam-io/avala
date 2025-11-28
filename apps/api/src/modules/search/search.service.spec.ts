import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../../database/prisma.service';
import { SearchStrategyRegistry } from './search-strategy.registry';
import { SearchEntityType } from './dto/search.dto';

describe('SearchService', () => {
  let service: SearchService;

  const mockTenantId = 'tenant-123';

  const mockSearchResult = {
    id: 'result-1',
    title: 'Test Course',
    description: 'A test course description',
    entityType: SearchEntityType.COURSE,
    score: 0.9,
  };

  const mockStrategy = {
    search: jest.fn().mockResolvedValue([mockSearchResult]),
  };

  const mockStrategyRegistry = {
    getAllEntityTypes: jest.fn().mockReturnValue([
      SearchEntityType.COURSE,
      SearchEntityType.USER,
      SearchEntityType.EC_STANDARD,
    ]),
    getStrategiesForTypes: jest.fn().mockReturnValue([mockStrategy]),
    getStrategy: jest.fn().mockReturnValue(mockStrategy),
  };

  const mockPrismaService = {
    eCStandard: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SearchStrategyRegistry, useValue: mockStrategyRegistry },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('globalSearch', () => {
    it('should perform global search across all entity types', async () => {
      const result = await service.globalSearch({
        query: 'test',
        tenantId: mockTenantId,
      });

      expect(result.query).toBe('test');
      expect(result.results).toBeDefined();
      expect(result.totalResults).toBeGreaterThanOrEqual(0);
      expect(result.took).toBeGreaterThanOrEqual(0);
    });

    it('should filter by specific entity types', async () => {
      const result = await service.globalSearch({
        query: 'test',
        entityTypes: [SearchEntityType.COURSE],
        tenantId: mockTenantId,
      });

      expect(mockStrategyRegistry.getStrategiesForTypes).toHaveBeenCalledWith([
        SearchEntityType.COURSE,
      ]);
      expect(result.results).toBeDefined();
    });

    it('should add highlights when requested', async () => {
      const result = await service.globalSearch({
        query: 'test',
        tenantId: mockTenantId,
        highlightMatches: true,
      });

      expect(result.results).toBeDefined();
    });

    it('should paginate results', async () => {
      const result = await service.globalSearch({
        query: 'test',
        tenantId: mockTenantId,
        skip: 0,
        limit: 5,
      });

      expect(result.results.length).toBeLessThanOrEqual(5);
    });

    it('should include grouped results', async () => {
      const result = await service.globalSearch({
        query: 'test',
        tenantId: mockTenantId,
      });

      expect(result.groupedResults).toBeDefined();
    });

    it('should include facets', async () => {
      const result = await service.globalSearch({
        query: 'test',
        tenantId: mockTenantId,
      });

      expect(result.facets).toBeDefined();
    });
  });

  describe('advancedSearch', () => {
    it('should perform advanced search with filters', async () => {
      const result = await service.advancedSearch({
        query: 'test',
        tenantId: mockTenantId,
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
        minScore: 0.5,
      });

      expect(result.query).toBe('test');
      expect(result.results).toBeDefined();
    });

    it('should filter by minimum score', async () => {
      mockStrategy.search.mockResolvedValue([
        { ...mockSearchResult, score: 0.9 },
        { ...mockSearchResult, id: 'result-2', score: 0.3 },
      ]);

      const result = await service.advancedSearch({
        query: 'test',
        tenantId: mockTenantId,
        minScore: 0.5,
      });

      expect(result.results.every((r) => r.score >= 0.5)).toBe(true);
    });

    it('should apply date filters', async () => {
      await service.advancedSearch({
        query: 'test',
        tenantId: mockTenantId,
        dateFrom: '2024-01-01',
        dateTo: '2024-06-30',
      });

      expect(mockStrategy.search).toHaveBeenCalled();
    });
  });

  describe('autocomplete', () => {
    it('should return autocomplete suggestions', async () => {
      const result = await service.autocomplete({
        query: 'te',
        tenantId: mockTenantId,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array for short queries', async () => {
      const result = await service.autocomplete({
        query: 't',
        tenantId: mockTenantId,
      });

      expect(result).toEqual([]);
    });

    it('should limit suggestions', async () => {
      const result = await service.autocomplete({
        query: 'test',
        tenantId: mockTenantId,
        limit: 3,
      });

      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should filter by entity types', async () => {
      await service.autocomplete({
        query: 'test',
        entityTypes: [SearchEntityType.COURSE],
        tenantId: mockTenantId,
      });

      expect(mockStrategyRegistry.getStrategiesForTypes).toHaveBeenCalled();
    });
  });

  describe('getSearchAnalytics', () => {
    it('should return search analytics', async () => {
      const result = await service.getSearchAnalytics();

      expect(result).toBeDefined();
      expect(result.totalSearches).toBeDefined();
      expect(result.uniqueQueries).toBeDefined();
      expect(result.entityTypeDistribution).toBeDefined();
    });
  });
});
