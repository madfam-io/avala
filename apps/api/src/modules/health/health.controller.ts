import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { HealthService, HealthStatus } from "./health.service";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: "Health check endpoint for load balancers and orchestrators" })
  @ApiResponse({
    status: 200,
    description: "Service is healthy",
    schema: {
      type: "object",
      properties: {
        status: { type: "string", example: "healthy" },
        timestamp: { type: "string", example: "2024-01-15T10:30:00.000Z" },
        version: { type: "string", example: "1.0.0" },
        uptime: { type: "number", example: 3600 },
        checks: {
          type: "object",
          properties: {
            database: { type: "string", example: "healthy" },
            memory: { type: "string", example: "healthy" },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 503, description: "Service is unhealthy" })
  async check(): Promise<HealthStatus> {
    return this.healthService.check();
  }

  @Get("live")
  @ApiOperation({ summary: "Liveness probe - is the service running?" })
  @ApiResponse({ status: 200, description: "Service is alive" })
  live(): { status: string } {
    return { status: "alive" };
  }

  @Get("ready")
  @ApiOperation({ summary: "Readiness probe - is the service ready to accept traffic?" })
  @ApiResponse({ status: 200, description: "Service is ready" })
  @ApiResponse({ status: 503, description: "Service is not ready" })
  async ready(): Promise<{ status: string; ready: boolean }> {
    const health = await this.healthService.check();
    return {
      status: health.status === "healthy" ? "ready" : "not_ready",
      ready: health.status === "healthy",
    };
  }
}
