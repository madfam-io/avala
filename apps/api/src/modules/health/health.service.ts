import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

export interface HealthCheck {
  status: "healthy" | "unhealthy" | "degraded";
  message?: string;
  responseTime?: number;
}

export interface HealthStatus {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: HealthCheck;
    memory: HealthCheck;
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthStatus> {
    const [databaseCheck, memoryCheck] = await Promise.all([
      this.checkDatabase(),
      this.checkMemory(),
    ]);

    const checks = {
      database: databaseCheck,
      memory: memoryCheck,
    };

    // Determine overall status
    const statuses = Object.values(checks).map((c) => c.status);
    let overallStatus: "healthy" | "unhealthy" | "degraded" = "healthy";

    if (statuses.includes("unhealthy")) {
      overallStatus = "unhealthy";
    } else if (statuses.includes("degraded")) {
      overallStatus = "degraded";
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      checks,
    };
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: "healthy",
        responseTime: Date.now() - start,
      };
    } catch (error) {
      this.logger.error("Database health check failed", error);
      return {
        status: "unhealthy",
        message: "Database connection failed",
        responseTime: Date.now() - start,
      };
    }
  }

  private async checkMemory(): Promise<HealthCheck> {
    const used = process.memoryUsage();
    const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
    const usagePercent = (used.heapUsed / used.heapTotal) * 100;

    // Memory thresholds
    if (usagePercent > 90) {
      return {
        status: "unhealthy",
        message: `Memory usage critical: ${heapUsedMB}MB / ${heapTotalMB}MB (${usagePercent.toFixed(1)}%)`,
      };
    } else if (usagePercent > 75) {
      return {
        status: "degraded",
        message: `Memory usage high: ${heapUsedMB}MB / ${heapTotalMB}MB (${usagePercent.toFixed(1)}%)`,
      };
    }

    return {
      status: "healthy",
      message: `${heapUsedMB}MB / ${heapTotalMB}MB (${usagePercent.toFixed(1)}%)`,
    };
  }
}
