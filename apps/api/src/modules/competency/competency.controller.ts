import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { CompetencyService } from "./competency.service";
import { TenantId } from "../../common/decorators/tenant.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("competency")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("ec")
export class CompetencyController {
  constructor(private readonly competencyService: CompetencyService) {}

  @Get()
  @ApiOperation({ summary: "List all competency standards" })
  findAll(@TenantId() tenantId: string) {
    return this.competencyService.findAll(tenantId);
  }

  @Get("search")
  @ApiOperation({ summary: "Search competency standards by code or title" })
  @ApiQuery({ name: "q", required: true })
  search(@TenantId() tenantId: string, @Query("q") query: string) {
    return this.competencyService.search(tenantId, query);
  }

  @Get(":code")
  @ApiOperation({ summary: "Get competency standard by code" })
  @ApiQuery({ name: "version", required: false })
  findByCode(
    @TenantId() tenantId: string,
    @Param("code") code: string,
    @Query("version") version?: string,
  ) {
    return this.competencyService.findByCode(tenantId, code, version);
  }

  @Get(":id/coverage")
  @ApiOperation({
    summary: "Get coverage analysis for a competency standard",
  })
  getCoverage(@TenantId() tenantId: string, @Param("id") id: string) {
    return this.competencyService.getCoverage(tenantId, id);
  }
}
