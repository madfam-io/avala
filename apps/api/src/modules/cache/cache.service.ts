import { Injectable, Inject, Logger } from "@nestjs/common";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";

/**
 * Cache key prefixes for different data types
 */
export enum CachePrefix {
  EC_STANDARD = "ec:standard:",
  EC_STANDARDS_LIST = "ec:standards:list:",
  EC_OVERVIEW = "ec:overview:",
  LEADERBOARD = "leaderboard:",
  USER_RANK = "user:rank:",
}

/**
 * Cache TTL values in milliseconds
 */
export enum CacheTTL {
  SHORT = 60000, // 1 minute
  MEDIUM = 300000, // 5 minutes
  LONG = 900000, // 15 minutes
  HOUR = 3600000, // 1 hour
  DAY = 86400000, // 24 hours
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value) {
        this.logger.debug(`Cache HIT: ${key}`);
      } else {
        this.logger.debug(`Cache MISS: ${key}`);
      }
      return value;
    } catch (error) {
      this.logger.warn(`Cache GET error for key ${key}: ${error}`);
      return undefined;
    }
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.logger.debug(`Cache SET: ${key} (TTL: ${ttl || "default"}ms)`);
    } catch (error) {
      this.logger.warn(`Cache SET error for key ${key}: ${error}`);
    }
  }

  /**
   * Delete a value from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache DEL: ${key}`);
    } catch (error) {
      this.logger.warn(`Cache DEL error for key ${key}: ${error}`);
    }
  }

  /**
   * Get or set pattern - fetches from cache or executes factory if not cached
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Invalidate all cache entries matching a prefix pattern
   */
  async invalidateByPrefix(prefix: CachePrefix): Promise<void> {
    try {
      // Note: This requires Redis SCAN or storing keys separately
      // For now, we'll use specific key deletion
      this.logger.debug(`Cache invalidation requested for prefix: ${prefix}`);
    } catch (error) {
      this.logger.warn(
        `Cache invalidation error for prefix ${prefix}: ${error}`,
      );
    }
  }

  /**
   * Clear entire cache (use sparingly)
   * Note: Not all cache stores support this operation
   */
  async clear(): Promise<void> {
    try {
      // cache-manager v5+ uses store.reset() or doesn't support clear
      const store = (this.cacheManager as any).store;
      if (store && typeof store.reset === "function") {
        await store.reset();
        this.logger.log("Cache cleared");
      } else {
        this.logger.warn("Cache clear not supported by current store");
      }
    } catch (error) {
      this.logger.warn(`Cache clear error: ${error}`);
    }
  }

  // ============================================
  // EC STANDARD SPECIFIC METHODS
  // ============================================

  /**
   * Get EC Standard cache key
   */
  getECStandardKey(code: string): string {
    return `${CachePrefix.EC_STANDARD}${code}`;
  }

  /**
   * Get EC Standards list cache key
   */
  getECStandardsListKey(queryHash: string): string {
    return `${CachePrefix.EC_STANDARDS_LIST}${queryHash}`;
  }

  /**
   * Get EC Overview cache key
   */
  getECOverviewKey(code: string): string {
    return `${CachePrefix.EC_OVERVIEW}${code}`;
  }

  /**
   * Invalidate all cache entries for an EC Standard
   */
  async invalidateECStandard(code: string): Promise<void> {
    await Promise.all([
      this.del(this.getECStandardKey(code)),
      this.del(this.getECOverviewKey(code)),
    ]);
    this.logger.debug(`Invalidated EC Standard cache: ${code}`);
  }

  // ============================================
  // LEADERBOARD SPECIFIC METHODS
  // ============================================

  /**
   * Get Leaderboard cache key
   */
  getLeaderboardKey(tenantId: string, type: string): string {
    return `${CachePrefix.LEADERBOARD}${tenantId}:${type}`;
  }

  /**
   * Get User Rank cache key
   */
  getUserRankKey(tenantId: string, userId: string, type: string): string {
    return `${CachePrefix.USER_RANK}${tenantId}:${userId}:${type}`;
  }

  /**
   * Invalidate leaderboard cache for a tenant
   */
  async invalidateLeaderboard(tenantId: string, type?: string): Promise<void> {
    if (type) {
      await this.del(this.getLeaderboardKey(tenantId, type));
    }
    this.logger.debug(
      `Invalidated leaderboard cache: ${tenantId}${type ? `:${type}` : ""}`,
    );
  }
}
