import { Module, Global } from "@nestjs/common";
import { CacheModule as NestCacheModule } from "@nestjs/cache-manager";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { redisStore } from "cache-manager-redis-yet";
import { CacheService } from "./cache.service";

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>("REDIS_URL");

        // If Redis is configured, use it; otherwise use in-memory cache
        if (redisUrl) {
          return {
            store: redisStore,
            url: redisUrl,
            ttl: 300000, // 5 minutes default TTL in ms
          };
        }

        // Fallback to in-memory cache for development without Redis
        return {
          ttl: 300000, // 5 minutes default TTL
          max: 100, // Maximum number of items in cache
        };
      },
    }),
  ],
  providers: [CacheService],
  exports: [NestCacheModule, CacheService],
})
export class CacheModule {}
