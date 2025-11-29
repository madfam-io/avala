import { Test, TestingModule } from "@nestjs/testing";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { CacheService, CachePrefix, CacheTTL } from "./cache.service";

describe("CacheService", () => {
  let service: CacheService;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    store: {
      reset: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("get", () => {
    it("should return cached value on cache hit", async () => {
      const testValue = { data: "test" };
      mockCacheManager.get.mockResolvedValue(testValue);

      const result = await service.get("test-key");

      expect(result).toEqual(testValue);
      expect(mockCacheManager.get).toHaveBeenCalledWith("test-key");
    });

    it("should return undefined on cache miss", async () => {
      mockCacheManager.get.mockResolvedValue(undefined);

      const result = await service.get("missing-key");

      expect(result).toBeUndefined();
    });

    it("should return undefined on cache error", async () => {
      mockCacheManager.get.mockRejectedValue(new Error("Redis error"));

      const result = await service.get("error-key");

      expect(result).toBeUndefined();
    });
  });

  describe("set", () => {
    it("should set value in cache", async () => {
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set("test-key", { data: "value" });

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        "test-key",
        { data: "value" },
        undefined,
      );
    });

    it("should set value with TTL", async () => {
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set("test-key", "value", CacheTTL.MEDIUM);

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        "test-key",
        "value",
        CacheTTL.MEDIUM,
      );
    });

    it("should handle set errors gracefully", async () => {
      mockCacheManager.set.mockRejectedValue(new Error("Redis error"));

      await expect(service.set("test-key", "value")).resolves.not.toThrow();
    });
  });

  describe("del", () => {
    it("should delete value from cache", async () => {
      mockCacheManager.del.mockResolvedValue(undefined);

      await service.del("test-key");

      expect(mockCacheManager.del).toHaveBeenCalledWith("test-key");
    });

    it("should handle delete errors gracefully", async () => {
      mockCacheManager.del.mockRejectedValue(new Error("Redis error"));

      await expect(service.del("test-key")).resolves.not.toThrow();
    });
  });

  describe("getOrSet", () => {
    it("should return cached value if exists", async () => {
      const cachedValue = { cached: true };
      mockCacheManager.get.mockResolvedValue(cachedValue);

      const factory = jest.fn().mockResolvedValue({ fresh: true });

      const result = await service.getOrSet("test-key", factory);

      expect(result).toEqual(cachedValue);
      expect(factory).not.toHaveBeenCalled();
    });

    it("should call factory and cache result if not cached", async () => {
      mockCacheManager.get.mockResolvedValue(undefined);
      mockCacheManager.set.mockResolvedValue(undefined);

      const freshValue = { fresh: true };
      const factory = jest.fn().mockResolvedValue(freshValue);

      const result = await service.getOrSet("test-key", factory);

      expect(result).toEqual(freshValue);
      expect(factory).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        "test-key",
        freshValue,
        undefined,
      );
    });

    it("should pass TTL when caching new value", async () => {
      mockCacheManager.get.mockResolvedValue(undefined);
      mockCacheManager.set.mockResolvedValue(undefined);

      const factory = jest.fn().mockResolvedValue("value");

      await service.getOrSet("test-key", factory, CacheTTL.HOUR);

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        "test-key",
        "value",
        CacheTTL.HOUR,
      );
    });
  });

  describe("invalidateByPrefix", () => {
    it("should handle prefix invalidation", async () => {
      await expect(
        service.invalidateByPrefix(CachePrefix.EC_STANDARD),
      ).resolves.not.toThrow();
    });
  });

  describe("clear", () => {
    it("should clear cache when store supports reset", async () => {
      mockCacheManager.store.reset.mockResolvedValue(undefined);

      await service.clear();

      expect(mockCacheManager.store.reset).toHaveBeenCalled();
    });

    it("should handle stores without reset support", async () => {
      const cacheManagerWithoutReset = {
        ...mockCacheManager,
        store: {},
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CacheService,
          { provide: CACHE_MANAGER, useValue: cacheManagerWithoutReset },
        ],
      }).compile();

      const serviceWithoutReset = module.get<CacheService>(CacheService);

      await expect(serviceWithoutReset.clear()).resolves.not.toThrow();
    });

    it("should handle clear errors gracefully", async () => {
      mockCacheManager.store.reset.mockRejectedValue(new Error("Clear error"));

      await expect(service.clear()).resolves.not.toThrow();
    });
  });

  describe("EC Standard key generators", () => {
    it("should generate EC Standard key", () => {
      const key = service.getECStandardKey("EC0249");

      expect(key).toBe(`${CachePrefix.EC_STANDARD}EC0249`);
    });

    it("should generate EC Standards list key", () => {
      const key = service.getECStandardsListKey("hash123");

      expect(key).toBe(`${CachePrefix.EC_STANDARDS_LIST}hash123`);
    });

    it("should generate EC Overview key", () => {
      const key = service.getECOverviewKey("EC0249");

      expect(key).toBe(`${CachePrefix.EC_OVERVIEW}EC0249`);
    });
  });

  describe("invalidateECStandard", () => {
    it("should invalidate EC Standard and Overview cache", async () => {
      mockCacheManager.del.mockResolvedValue(undefined);

      await service.invalidateECStandard("EC0249");

      expect(mockCacheManager.del).toHaveBeenCalledTimes(2);
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        `${CachePrefix.EC_STANDARD}EC0249`,
      );
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        `${CachePrefix.EC_OVERVIEW}EC0249`,
      );
    });
  });

  describe("Leaderboard key generators", () => {
    it("should generate Leaderboard key", () => {
      const key = service.getLeaderboardKey("tenant-123", "weekly");

      expect(key).toBe(`${CachePrefix.LEADERBOARD}tenant-123:weekly`);
    });

    it("should generate User Rank key", () => {
      const key = service.getUserRankKey("tenant-123", "user-456", "monthly");

      expect(key).toBe(`${CachePrefix.USER_RANK}tenant-123:user-456:monthly`);
    });
  });

  describe("invalidateLeaderboard", () => {
    it("should invalidate specific leaderboard type", async () => {
      mockCacheManager.del.mockResolvedValue(undefined);

      await service.invalidateLeaderboard("tenant-123", "weekly");

      expect(mockCacheManager.del).toHaveBeenCalledWith(
        `${CachePrefix.LEADERBOARD}tenant-123:weekly`,
      );
    });

    it("should handle invalidation without type", async () => {
      await service.invalidateLeaderboard("tenant-123");

      // Should not call del when no type provided
      expect(mockCacheManager.del).not.toHaveBeenCalled();
    });
  });

  describe("CachePrefix enum", () => {
    it("should have correct prefix values", () => {
      expect(CachePrefix.EC_STANDARD).toBe("ec:standard:");
      expect(CachePrefix.EC_STANDARDS_LIST).toBe("ec:standards:list:");
      expect(CachePrefix.EC_OVERVIEW).toBe("ec:overview:");
      expect(CachePrefix.LEADERBOARD).toBe("leaderboard:");
      expect(CachePrefix.USER_RANK).toBe("user:rank:");
    });
  });

  describe("CacheTTL enum", () => {
    it("should have correct TTL values in milliseconds", () => {
      expect(CacheTTL.SHORT).toBe(60000); // 1 minute
      expect(CacheTTL.MEDIUM).toBe(300000); // 5 minutes
      expect(CacheTTL.LONG).toBe(900000); // 15 minutes
      expect(CacheTTL.HOUR).toBe(3600000); // 1 hour
      expect(CacheTTL.DAY).toBe(86400000); // 24 hours
    });
  });
});
