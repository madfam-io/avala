import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { PortfolioService } from "./portfolio.service";
import { TenantId } from "../../common/decorators/tenant.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("portfolios")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("portfolios")
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get("trainee/:traineeId")
  @ApiOperation({ summary: "Get all portfolios for a trainee" })
  findByTrainee(
    @TenantId() tenantId: string,
    @Param("traineeId") traineeId: string,
  ) {
    return this.portfolioService.findByTrainee(tenantId, traineeId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get portfolio by ID" })
  findById(@TenantId() tenantId: string, @Param("id") id: string) {
    return this.portfolioService.findById(tenantId, id);
  }

  @Get(":id/export")
  @ApiOperation({
    summary: "Export portfolio with integrity hashes",
  })
  exportPortfolio(@TenantId() tenantId: string, @Param("id") id: string) {
    return this.portfolioService.exportPortfolio(tenantId, id);
  }
}
