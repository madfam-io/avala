import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { TenantService } from "./tenant.service";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { UpdateTenantDto } from "./dto/update-tenant.dto";
import { TenantQueryDto } from "./dto/tenant-query.dto";
import { RolesGuard, UserRole } from "./guards/roles.guard";
import { Roles } from "./decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("tenants")
@Controller("tenants")
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "List all tenants with pagination (Super Admin only)",
  })
  @ApiResponse({ status: 200, description: "Paginated list of tenants" })
  findAll(@Query() query: TenantQueryDto) {
    return this.tenantService.findAll(query);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get tenant by ID" })
  @ApiParam({ name: "id", description: "Tenant ID" })
  @ApiResponse({ status: 200, description: "Tenant details" })
  @ApiResponse({ status: 404, description: "Tenant not found" })
  findById(@Param("id") id: string) {
    return this.tenantService.findById(id);
  }

  @Get("slug/:slug")
  @ApiOperation({ summary: "Get tenant by slug (public)" })
  @ApiParam({ name: "slug", description: "Tenant slug", example: "acme-corp" })
  @ApiResponse({ status: 200, description: "Tenant details" })
  @ApiResponse({ status: 404, description: "Tenant not found" })
  findBySlug(@Param("slug") slug: string) {
    return this.tenantService.findBySlug(slug);
  }

  @Get(":id/stats")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get tenant statistics" })
  @ApiParam({ name: "id", description: "Tenant ID" })
  @ApiResponse({ status: 200, description: "Tenant statistics" })
  getStats(@Param("id") id: string) {
    return this.tenantService.getStats(id);
  }

  @Get(":id/limits")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Check tenant plan limits" })
  @ApiParam({ name: "id", description: "Tenant ID" })
  @ApiResponse({ status: 200, description: "Plan limits status" })
  checkLimits(@Param("id") id: string) {
    return this.tenantService.checkPlanLimits(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new tenant (Super Admin only)" })
  @ApiResponse({ status: 201, description: "Tenant created successfully" })
  @ApiResponse({
    status: 409,
    description: "Tenant slug or admin email already exists",
  })
  create(@Body() dto: CreateTenantDto) {
    return this.tenantService.create(dto);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update tenant" })
  @ApiParam({ name: "id", description: "Tenant ID" })
  @ApiResponse({ status: 200, description: "Tenant updated successfully" })
  @ApiResponse({ status: 404, description: "Tenant not found" })
  update(@Param("id") id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantService.update(id, dto);
  }

  @Patch(":id/settings")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update tenant settings" })
  @ApiParam({ name: "id", description: "Tenant ID" })
  @ApiResponse({ status: 200, description: "Settings updated successfully" })
  updateSettings(
    @Param("id") id: string,
    @Body() settings: Record<string, any>,
  ) {
    return this.tenantService.updateSettings(id, settings);
  }

  @Post(":id/suspend")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Suspend tenant (Super Admin only)" })
  @ApiParam({ name: "id", description: "Tenant ID" })
  @ApiResponse({ status: 200, description: "Tenant suspended" })
  suspend(@Param("id") id: string, @Body("reason") reason?: string) {
    return this.tenantService.suspend(id, reason);
  }

  @Post(":id/reactivate")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reactivate suspended tenant (Super Admin only)" })
  @ApiParam({ name: "id", description: "Tenant ID" })
  @ApiResponse({ status: 200, description: "Tenant reactivated" })
  reactivate(@Param("id") id: string) {
    return this.tenantService.reactivate(id);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Soft delete tenant (Super Admin only)" })
  @ApiParam({ name: "id", description: "Tenant ID" })
  @ApiResponse({ status: 200, description: "Tenant cancelled" })
  delete(@Param("id") id: string) {
    return this.tenantService.delete(id);
  }

  @Delete(":id/hard")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      "Hard delete tenant and all data (Super Admin only, use with caution)",
  })
  @ApiParam({ name: "id", description: "Tenant ID" })
  @ApiResponse({ status: 204, description: "Tenant permanently deleted" })
  @ApiResponse({ status: 400, description: "Tenant must be cancelled first" })
  hardDelete(@Param("id") id: string) {
    return this.tenantService.hardDelete(id);
  }
}
