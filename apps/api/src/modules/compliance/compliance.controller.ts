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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SIRCEService } from './sirce.service';
import { LFTPlanService } from './lft-plan.service';
import {
  CreateSIRCEExportDto,
  SIRCEExportQueryDto,
  SIRCEExportFormat,
} from './dto/sirce.dto';
import {
  CreateLFTPlanDto,
  UpdateLFTPlanDto,
  LFTPlanQueryDto,
  TrainingProgramDto,
  LockLFTPlanDto,
} from './dto/lft-plan.dto';

@ApiTags('Compliance')
@ApiBearerAuth()
@Controller('compliance')
export class ComplianceController {
  constructor(
    private readonly sirceService: SIRCEService,
    private readonly lftPlanService: LFTPlanService,
  ) {}

  // ============================================
  // SIRCE EXPORT ENDPOINTS
  // ============================================

  @Post('sirce/export')
  @ApiOperation({ summary: 'Create SIRCE export' })
  @ApiResponse({ status: 201, description: 'SIRCE export created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid period format or data' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async createSIRCEExport(@Body() dto: CreateSIRCEExportDto) {
    return this.sirceService.createExport(dto);
  }

  @Get('sirce/exports')
  @ApiOperation({ summary: 'List SIRCE exports' })
  @ApiResponse({ status: 200, description: 'Paginated list of exports' })
  async listSIRCEExports(@Query() query: SIRCEExportQueryDto) {
    return this.sirceService.listExports(query);
  }

  @Get('sirce/exports/:id')
  @ApiOperation({ summary: 'Get SIRCE export by ID' })
  @ApiParam({ name: 'id', description: 'Export ID' })
  @ApiResponse({ status: 200, description: 'Export details' })
  @ApiResponse({ status: 404, description: 'Export not found' })
  async getSIRCEExport(@Param('id') id: string) {
    return this.sirceService.getExport(id);
  }

  @Post('sirce/validate')
  @ApiOperation({ summary: 'Validate data before SIRCE export' })
  @ApiResponse({ status: 200, description: 'Validation results' })
  async validateSIRCEData(@Body() dto: CreateSIRCEExportDto) {
    return this.sirceService.validateExportData(dto);
  }

  @Post('sirce/exports/:id/regenerate')
  @ApiOperation({ summary: 'Regenerate SIRCE export in different format' })
  @ApiParam({ name: 'id', description: 'Export ID' })
  @ApiResponse({ status: 200, description: 'Regenerated export' })
  async regenerateSIRCEExport(
    @Param('id') id: string,
    @Body() body: { format: SIRCEExportFormat },
  ) {
    return this.sirceService.regenerateExport(id, body.format);
  }

  // ============================================
  // LFT PLAN ENDPOINTS
  // ============================================

  @Post('lft-plans')
  @ApiOperation({ summary: 'Create LFT annual training plan' })
  @ApiResponse({ status: 201, description: 'Plan created successfully' })
  @ApiResponse({ status: 409, description: 'Plan already exists for year/business unit' })
  async createLFTPlan(@Body() dto: CreateLFTPlanDto) {
    return this.lftPlanService.create(dto);
  }

  @Get('lft-plans')
  @ApiOperation({ summary: 'List LFT plans' })
  @ApiResponse({ status: 200, description: 'Paginated list of plans' })
  async listLFTPlans(@Query() query: LFTPlanQueryDto) {
    return this.lftPlanService.findAll(query);
  }

  @Get('lft-plans/summary')
  @ApiOperation({ summary: 'Get LFT plans summary statistics' })
  @ApiResponse({ status: 200, description: 'Summary statistics' })
  async getLFTSummary(
    @Query('tenantId') tenantId: string,
    @Query('year') year?: number,
  ) {
    return this.lftPlanService.getSummary(tenantId, year);
  }

  @Get('lft-plans/year-overview')
  @ApiOperation({ summary: 'Get year overview with progress tracking' })
  @ApiResponse({ status: 200, description: 'Year overview with completion rates' })
  async getYearOverview(
    @Query('tenantId') tenantId: string,
    @Query('year') year: number,
  ) {
    return this.lftPlanService.getYearOverview(tenantId, year);
  }

  @Get('lft-plans/:id')
  @ApiOperation({ summary: 'Get LFT plan by ID' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({ status: 200, description: 'Plan details' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async getLFTPlan(@Param('id') id: string) {
    return this.lftPlanService.findById(id);
  }

  @Put('lft-plans/:id')
  @ApiOperation({ summary: 'Update LFT plan' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({ status: 200, description: 'Plan updated successfully' })
  @ApiResponse({ status: 400, description: 'Plan is locked' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async updateLFTPlan(@Param('id') id: string, @Body() dto: UpdateLFTPlanDto) {
    return this.lftPlanService.update(id, dto);
  }

  @Delete('lft-plans/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete LFT plan' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({ status: 200, description: 'Plan deleted successfully' })
  @ApiResponse({ status: 400, description: 'Plan is locked' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async deleteLFTPlan(@Param('id') id: string) {
    return this.lftPlanService.delete(id);
  }

  @Patch('lft-plans/:id/lock')
  @ApiOperation({ summary: 'Lock or unlock LFT plan' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({ status: 200, description: 'Lock status updated' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async setLFTPlanLock(@Param('id') id: string, @Body() dto: LockLFTPlanDto) {
    return this.lftPlanService.setLock(id, dto.lock);
  }

  @Post('lft-plans/:id/programs')
  @ApiOperation({ summary: 'Add program to LFT plan' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({ status: 201, description: 'Program added successfully' })
  @ApiResponse({ status: 400, description: 'Plan is locked' })
  async addProgramToLFTPlan(
    @Param('id') id: string,
    @Body() program: TrainingProgramDto,
  ) {
    return this.lftPlanService.addProgram(id, program);
  }

  @Delete('lft-plans/:id/programs/:index')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove program from LFT plan' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiParam({ name: 'index', description: 'Program index (0-based)' })
  @ApiResponse({ status: 200, description: 'Program removed successfully' })
  @ApiResponse({ status: 400, description: 'Plan is locked or invalid index' })
  async removeProgramFromLFTPlan(
    @Param('id') id: string,
    @Param('index') index: number,
  ) {
    return this.lftPlanService.removeProgram(id, Number(index));
  }

  @Post('lft-plans/:id/clone')
  @ApiOperation({ summary: 'Clone LFT plan to new year' })
  @ApiParam({ name: 'id', description: 'Plan ID to clone' })
  @ApiResponse({ status: 201, description: 'Plan cloned successfully' })
  @ApiResponse({ status: 409, description: 'Plan already exists in target year' })
  async cloneLFTPlan(@Param('id') id: string, @Body() body: { year: number }) {
    return this.lftPlanService.cloneToYear(id, body.year);
  }
}
