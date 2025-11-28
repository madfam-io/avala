import {
  Controller,
  Get,
  Post,
  Put,
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
import { ECPortfolioService } from './ec-portfolio.service';
import {
  CreateECTemplateDto,
  UpdateECTemplateDto,
  ECTemplateQueryDto,
  CreateECDocumentDto,
  SaveDocumentContentDto,
  ECDocumentQueryDto,
  ECTemplateResponseDto,
  ECDocumentResponseDto,
  PortfolioSummaryDto,
  ValidationResultDto,
} from './dto/ec-document.dto';

@ApiTags('EC Portfolio')
@ApiBearerAuth()
@Controller('ec-portfolio')
export class ECPortfolioController {
  constructor(private readonly ecPortfolioService: ECPortfolioService) {}

  // ============================================
  // TEMPLATES
  // ============================================

  @Post('templates/:ecCode')
  @ApiOperation({ summary: 'Create document template for EC Standard' })
  @ApiParam({ name: 'ecCode', example: 'EC0249' })
  @ApiResponse({ status: 201, type: ECTemplateResponseDto })
  async createTemplate(
    @Param('ecCode') ecCode: string,
    @Body() dto: CreateECTemplateDto,
  ) {
    return this.ecPortfolioService.createTemplate(ecCode, dto);
  }

  @Get('templates/:ecCode')
  @ApiOperation({ summary: 'Get templates for EC Standard' })
  @ApiParam({ name: 'ecCode', example: 'EC0249' })
  @ApiResponse({ status: 200, type: [ECTemplateResponseDto] })
  async findTemplates(
    @Param('ecCode') ecCode: string,
    @Query() query: ECTemplateQueryDto,
  ) {
    return this.ecPortfolioService.findTemplatesByStandard(ecCode, query);
  }

  @Get('templates/by-id/:id')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiResponse({ status: 200, type: ECTemplateResponseDto })
  async findTemplateById(@Param('id') id: string) {
    return this.ecPortfolioService.findTemplateById(id);
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Update template' })
  @ApiResponse({ status: 200, type: ECTemplateResponseDto })
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateECTemplateDto,
  ) {
    return this.ecPortfolioService.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete template' })
  @ApiResponse({ status: 200, description: 'Template deleted' })
  async deleteTemplate(@Param('id') id: string) {
    return this.ecPortfolioService.deleteTemplate(id);
  }

  // ============================================
  // DOCUMENTS
  // ============================================

  @Post('enrollments/:enrollmentId/documents')
  @ApiOperation({ summary: 'Create document from template' })
  @ApiResponse({ status: 201, type: ECDocumentResponseDto })
  async createDocument(
    @Param('enrollmentId') enrollmentId: string,
    @Body() dto: CreateECDocumentDto,
  ) {
    return this.ecPortfolioService.createDocument(enrollmentId, dto);
  }

  @Get('enrollments/:enrollmentId/documents')
  @ApiOperation({ summary: 'Get documents for enrollment' })
  @ApiResponse({ status: 200, type: [ECDocumentResponseDto] })
  async findDocuments(
    @Param('enrollmentId') enrollmentId: string,
    @Query() query: ECDocumentQueryDto,
  ) {
    return this.ecPortfolioService.findDocumentsByEnrollment(enrollmentId, query);
  }

  @Get('documents/:id')
  @ApiOperation({ summary: 'Get document by ID' })
  @ApiResponse({ status: 200, type: ECDocumentResponseDto })
  async findDocumentById(@Param('id') id: string) {
    return this.ecPortfolioService.findDocumentById(id);
  }

  @Put('documents/:id/content')
  @ApiOperation({ summary: 'Save document content' })
  @ApiResponse({ status: 200, type: ECDocumentResponseDto })
  async updateDocumentContent(
    @Param('id') id: string,
    @Body() dto: SaveDocumentContentDto,
  ) {
    return this.ecPortfolioService.updateDocumentContent(id, dto);
  }

  @Put('documents/:id/autosave')
  @ApiOperation({ summary: 'Auto-save document content' })
  @ApiResponse({ status: 200, description: 'Content auto-saved' })
  async autoSaveDocument(
    @Param('id') id: string,
    @Body() body: { content: Record<string, any> },
  ) {
    return this.ecPortfolioService.autoSaveDocument(id, body.content);
  }

  @Post('documents/:id/submit')
  @ApiOperation({ summary: 'Submit document for review' })
  @ApiResponse({ status: 200, type: ECDocumentResponseDto })
  async submitDocument(@Param('id') id: string) {
    return this.ecPortfolioService.submitDocument(id);
  }

  @Post('documents/:id/approve')
  @ApiOperation({ summary: 'Approve submitted document' })
  @ApiResponse({ status: 200, type: ECDocumentResponseDto })
  async approveDocument(@Param('id') id: string) {
    return this.ecPortfolioService.approveDocument(id);
  }

  @Post('documents/:id/reject')
  @ApiOperation({ summary: 'Reject submitted document' })
  @ApiResponse({ status: 200, type: ECDocumentResponseDto })
  async rejectDocument(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.ecPortfolioService.rejectDocument(id, body.reason);
  }

  @Delete('documents/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete document' })
  @ApiResponse({ status: 200, description: 'Document deleted' })
  async deleteDocument(@Param('id') id: string) {
    return this.ecPortfolioService.deleteDocument(id);
  }

  // ============================================
  // VALIDATION
  // ============================================

  @Get('documents/:id/validate')
  @ApiOperation({ summary: 'Validate document content' })
  @ApiResponse({ status: 200, type: ValidationResultDto })
  async validateDocument(@Param('id') id: string) {
    return this.ecPortfolioService.validateDocument(id);
  }

  // ============================================
  // PORTFOLIO
  // ============================================

  @Get('enrollments/:enrollmentId/summary')
  @ApiOperation({ summary: 'Get portfolio summary' })
  @ApiResponse({ status: 200, type: PortfolioSummaryDto })
  async getPortfolioSummary(@Param('enrollmentId') enrollmentId: string) {
    return this.ecPortfolioService.getPortfolioSummary(enrollmentId);
  }

  @Post('enrollments/:enrollmentId/initialize')
  @ApiOperation({ summary: 'Initialize portfolio with all templates' })
  @ApiResponse({ status: 201, type: [ECDocumentResponseDto] })
  async initializePortfolio(@Param('enrollmentId') enrollmentId: string) {
    return this.ecPortfolioService.initializePortfolio(enrollmentId);
  }

  // ============================================
  // EXPORT
  // ============================================

  @Post('documents/:id/export')
  @ApiOperation({ summary: 'Export document' })
  @ApiResponse({ status: 200, description: 'Document exported' })
  async exportDocument(@Param('id') id: string) {
    return this.ecPortfolioService.exportDocument(id);
  }
}
