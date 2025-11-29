import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { SIRCEService } from "./sirce.service";
import { LFTPlanService } from "./lft-plan.service";
import { DC3Service } from "./dc3.service";
import {
  CreateSIRCEExportDto,
  SIRCEExportQueryDto,
  SIRCEExportFormat,
} from "./dto/sirce.dto";
import {
  CreateLFTPlanDto,
  UpdateLFTPlanDto,
  LFTPlanQueryDto,
  TrainingProgramDto,
  LockLFTPlanDto,
} from "./dto/lft-plan.dto";
import {
  CreateDC3Dto,
  DC3QueryDto,
  RevokeDC3Dto,
  BulkCreateDC3Dto,
  DC3ResponseDto,
  VerifyDC3ResponseDto,
} from "./dto/dc3.dto";

@ApiTags("Compliance")
@ApiBearerAuth()
@Controller("compliance")
export class ComplianceController {
  constructor(
    private readonly sirceService: SIRCEService,
    private readonly lftPlanService: LFTPlanService,
    private readonly dc3Service: DC3Service,
  ) {}

  // ============================================
  // DC-3 ENDPOINTS
  // ============================================

  @Post("dc3")
  @ApiOperation({ summary: "Create DC-3 constancia" })
  @ApiResponse({
    status: 201,
    description: "DC-3 created successfully",
    type: DC3ResponseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid data" })
  @ApiResponse({ status: 404, description: "Trainee or course not found" })
  @ApiResponse({
    status: 409,
    description: "DC-3 already exists for trainee/course",
  })
  async createDC3(@Body() dto: CreateDC3Dto) {
    return this.dc3Service.create(dto);
  }

  @Post("dc3/bulk")
  @ApiOperation({ summary: "Bulk create DC-3 for multiple trainees" })
  @ApiResponse({ status: 201, description: "Bulk creation results" })
  async bulkCreateDC3(@Body() dto: BulkCreateDC3Dto) {
    return this.dc3Service.bulkCreate(dto);
  }

  @Get("dc3")
  @ApiOperation({ summary: "List DC-3 records" })
  @ApiResponse({ status: 200, description: "Paginated list of DC-3 records" })
  async listDC3(@Query() query: DC3QueryDto) {
    return this.dc3Service.findAll(query);
  }

  @Get("dc3/verify/:serial")
  @ApiOperation({ summary: "Verify DC-3 by serial (public)" })
  @ApiParam({ name: "serial", description: "DC-3 serial number" })
  @ApiResponse({
    status: 200,
    description: "Verification result",
    type: VerifyDC3ResponseDto,
  })
  async verifyDC3(@Param("serial") serial: string) {
    return this.dc3Service.verify(serial);
  }

  @Get("dc3/trainee/:traineeId")
  @ApiOperation({ summary: "Get DC-3 records for trainee" })
  @ApiParam({ name: "traineeId", description: "Trainee ID" })
  @ApiResponse({
    status: 200,
    description: "List of DC-3 records",
    type: [DC3ResponseDto],
  })
  async getDC3ByTrainee(
    @Query("tenantId") tenantId: string,
    @Param("traineeId") traineeId: string,
  ) {
    return this.dc3Service.findByTrainee(tenantId, traineeId);
  }

  @Get("dc3/statistics")
  @ApiOperation({ summary: "Get DC-3 statistics" })
  @ApiResponse({ status: 200, description: "DC-3 statistics" })
  async getDC3Statistics(
    @Query("tenantId") tenantId: string,
    @Query("year") year?: number,
  ) {
    return this.dc3Service.getStatistics(tenantId, year);
  }

  @Get("dc3/:id")
  @ApiOperation({ summary: "Get DC-3 by ID" })
  @ApiParam({ name: "id", description: "DC-3 ID" })
  @ApiResponse({
    status: 200,
    description: "DC-3 details",
    type: DC3ResponseDto,
  })
  @ApiResponse({ status: 404, description: "DC-3 not found" })
  async getDC3ById(@Param("id") id: string) {
    return this.dc3Service.findById(id);
  }

  @Get("dc3/serial/:serial")
  @ApiOperation({ summary: "Get DC-3 by serial number" })
  @ApiParam({ name: "serial", description: "DC-3 serial number" })
  @ApiResponse({
    status: 200,
    description: "DC-3 details",
    type: DC3ResponseDto,
  })
  @ApiResponse({ status: 404, description: "DC-3 not found" })
  async getDC3BySerial(@Param("serial") serial: string) {
    return this.dc3Service.findBySerial(serial);
  }

  @Patch("dc3/:id/revoke")
  @ApiOperation({ summary: "Revoke DC-3" })
  @ApiParam({ name: "id", description: "DC-3 ID" })
  @ApiResponse({
    status: 200,
    description: "DC-3 revoked",
    type: DC3ResponseDto,
  })
  @ApiResponse({ status: 400, description: "DC-3 already revoked" })
  @ApiResponse({ status: 404, description: "DC-3 not found" })
  async revokeDC3(@Param("id") id: string, @Body() dto: RevokeDC3Dto) {
    return this.dc3Service.revoke(id, dto);
  }

  @Patch("dc3/:id/pdf")
  @ApiOperation({ summary: "Update DC-3 PDF reference" })
  @ApiParam({ name: "id", description: "DC-3 ID" })
  @ApiResponse({
    status: 200,
    description: "PDF reference updated",
    type: DC3ResponseDto,
  })
  async updateDC3Pdf(
    @Param("id") id: string,
    @Body() body: { pdfRef: string },
  ) {
    return this.dc3Service.updatePdfRef(id, body.pdfRef);
  }

  // ============================================
  // SIRCE EXPORT ENDPOINTS
  // ============================================

  @Post("sirce/export")
  @ApiOperation({ summary: "Create SIRCE export" })
  @ApiResponse({
    status: 201,
    description: "SIRCE export created successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid period format or data" })
  @ApiResponse({ status: 404, description: "Tenant not found" })
  async createSIRCEExport(@Body() dto: CreateSIRCEExportDto) {
    return this.sirceService.createExport(dto);
  }

  @Get("sirce/exports")
  @ApiOperation({ summary: "List SIRCE exports" })
  @ApiResponse({ status: 200, description: "Paginated list of exports" })
  async listSIRCEExports(@Query() query: SIRCEExportQueryDto) {
    return this.sirceService.listExports(query);
  }

  @Get("sirce/exports/:id")
  @ApiOperation({ summary: "Get SIRCE export by ID" })
  @ApiParam({ name: "id", description: "Export ID" })
  @ApiResponse({ status: 200, description: "Export details" })
  @ApiResponse({ status: 404, description: "Export not found" })
  async getSIRCEExport(@Param("id") id: string) {
    return this.sirceService.getExport(id);
  }

  @Post("sirce/validate")
  @ApiOperation({ summary: "Validate data before SIRCE export" })
  @ApiResponse({ status: 200, description: "Validation results" })
  async validateSIRCEData(@Body() dto: CreateSIRCEExportDto) {
    return this.sirceService.validateExportData(dto);
  }

  @Post("sirce/exports/:id/regenerate")
  @ApiOperation({ summary: "Regenerate SIRCE export in different format" })
  @ApiParam({ name: "id", description: "Export ID" })
  @ApiResponse({ status: 200, description: "Regenerated export" })
  async regenerateSIRCEExport(
    @Param("id") id: string,
    @Body() body: { format: SIRCEExportFormat },
  ) {
    return this.sirceService.regenerateExport(id, body.format);
  }

  // ============================================
  // LFT PLAN ENDPOINTS
  // ============================================

  @Post("lft-plans")
  @ApiOperation({ summary: "Create LFT annual training plan" })
  @ApiResponse({ status: 201, description: "Plan created successfully" })
  @ApiResponse({
    status: 409,
    description: "Plan already exists for year/business unit",
  })
  async createLFTPlan(@Body() dto: CreateLFTPlanDto) {
    return this.lftPlanService.create(dto);
  }

  @Get("lft-plans")
  @ApiOperation({ summary: "List LFT plans" })
  @ApiResponse({ status: 200, description: "Paginated list of plans" })
  async listLFTPlans(@Query() query: LFTPlanQueryDto) {
    return this.lftPlanService.findAll(query);
  }

  @Get("lft-plans/summary")
  @ApiOperation({ summary: "Get LFT plans summary statistics" })
  @ApiResponse({ status: 200, description: "Summary statistics" })
  async getLFTSummary(
    @Query("tenantId") tenantId: string,
    @Query("year") year?: number,
  ) {
    return this.lftPlanService.getSummary(tenantId, year);
  }

  @Get("lft-plans/year-overview")
  @ApiOperation({ summary: "Get year overview with progress tracking" })
  @ApiResponse({
    status: 200,
    description: "Year overview with completion rates",
  })
  async getYearOverview(
    @Query("tenantId") tenantId: string,
    @Query("year") year: number,
  ) {
    return this.lftPlanService.getYearOverview(tenantId, year);
  }

  @Get("lft-plans/:id")
  @ApiOperation({ summary: "Get LFT plan by ID" })
  @ApiParam({ name: "id", description: "Plan ID" })
  @ApiResponse({ status: 200, description: "Plan details" })
  @ApiResponse({ status: 404, description: "Plan not found" })
  async getLFTPlan(@Param("id") id: string) {
    return this.lftPlanService.findById(id);
  }

  @Put("lft-plans/:id")
  @ApiOperation({ summary: "Update LFT plan" })
  @ApiParam({ name: "id", description: "Plan ID" })
  @ApiResponse({ status: 200, description: "Plan updated successfully" })
  @ApiResponse({ status: 400, description: "Plan is locked" })
  @ApiResponse({ status: 404, description: "Plan not found" })
  async updateLFTPlan(@Param("id") id: string, @Body() dto: UpdateLFTPlanDto) {
    return this.lftPlanService.update(id, dto);
  }

  @Delete("lft-plans/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete LFT plan" })
  @ApiParam({ name: "id", description: "Plan ID" })
  @ApiResponse({ status: 200, description: "Plan deleted successfully" })
  @ApiResponse({ status: 400, description: "Plan is locked" })
  @ApiResponse({ status: 404, description: "Plan not found" })
  async deleteLFTPlan(@Param("id") id: string) {
    return this.lftPlanService.delete(id);
  }

  @Patch("lft-plans/:id/lock")
  @ApiOperation({ summary: "Lock or unlock LFT plan" })
  @ApiParam({ name: "id", description: "Plan ID" })
  @ApiResponse({ status: 200, description: "Lock status updated" })
  @ApiResponse({ status: 404, description: "Plan not found" })
  async setLFTPlanLock(@Param("id") id: string, @Body() dto: LockLFTPlanDto) {
    return this.lftPlanService.setLock(id, dto.lock);
  }

  @Post("lft-plans/:id/programs")
  @ApiOperation({ summary: "Add program to LFT plan" })
  @ApiParam({ name: "id", description: "Plan ID" })
  @ApiResponse({ status: 201, description: "Program added successfully" })
  @ApiResponse({ status: 400, description: "Plan is locked" })
  async addProgramToLFTPlan(
    @Param("id") id: string,
    @Body() program: TrainingProgramDto,
  ) {
    return this.lftPlanService.addProgram(id, program);
  }

  @Delete("lft-plans/:id/programs/:index")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Remove program from LFT plan" })
  @ApiParam({ name: "id", description: "Plan ID" })
  @ApiParam({ name: "index", description: "Program index (0-based)" })
  @ApiResponse({ status: 200, description: "Program removed successfully" })
  @ApiResponse({ status: 400, description: "Plan is locked or invalid index" })
  async removeProgramFromLFTPlan(
    @Param("id") id: string,
    @Param("index") index: number,
  ) {
    return this.lftPlanService.removeProgram(id, Number(index));
  }

  @Post("lft-plans/:id/clone")
  @ApiOperation({ summary: "Clone LFT plan to new year" })
  @ApiParam({ name: "id", description: "Plan ID to clone" })
  @ApiResponse({ status: 201, description: "Plan cloned successfully" })
  @ApiResponse({
    status: 409,
    description: "Plan already exists in target year",
  })
  async cloneLFTPlan(@Param("id") id: string, @Body() body: { year: number }) {
    return this.lftPlanService.cloneToYear(id, body.year);
  }
}
