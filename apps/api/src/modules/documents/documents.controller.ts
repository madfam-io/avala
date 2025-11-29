import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import { DocumentsService } from "./documents.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateDocumentDto, UpdateDocumentDto } from "./dto/document.dto";
import { DocumentQueryDto, TemplateQueryDto } from "./dto/document-query.dto";
import { AuthenticatedRequest } from "../../common/interfaces";

@ApiTags("Documents")
@Controller("documents")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // ============================================
  // TEMPLATES
  // ============================================

  @Get("templates")
  @ApiOperation({ summary: "Get all document templates with pagination" })
  @ApiResponse({
    status: 200,
    description: "Paginated list of document templates",
  })
  async findAllTemplates(@Query() query: TemplateQueryDto) {
    return this.documentsService.findAllTemplates(query);
  }

  @Get("templates/element/:element")
  @ApiOperation({ summary: "Get templates by element (E0875, E0876, E0877)" })
  @ApiResponse({
    status: 200,
    description: "Templates for the specified element",
  })
  async findTemplatesByElement(@Param("element") element: string) {
    return this.documentsService.findTemplatesByElement(element);
  }

  @Get("templates/:code")
  @ApiOperation({ summary: "Get a template by code" })
  @ApiResponse({ status: 200, description: "Template details" })
  @ApiResponse({ status: 404, description: "Template not found" })
  async findTemplateByCode(@Param("code") code: string) {
    return this.documentsService.findTemplateByCode(code);
  }

  // ============================================
  // USER DOCUMENTS
  // ============================================

  @Get()
  @ApiOperation({
    summary: "Get all documents for the current user with pagination",
  })
  @ApiResponse({ status: 200, description: "Paginated list of user documents" })
  async findUserDocuments(
    @Request() req: AuthenticatedRequest,
    @Query() query: DocumentQueryDto,
  ) {
    return this.documentsService.findUserDocuments(
      req.user.id,
      req.user.tenantId,
      query,
    );
  }

  @Get("element/:element")
  @ApiOperation({ summary: "Get documents by element" })
  @ApiResponse({
    status: 200,
    description: "Documents for the specified element",
  })
  async findDocumentsByElement(
    @Param("element") element: string,
    @Request() req: any,
  ) {
    return this.documentsService.findDocumentsByElement(
      element,
      req.user.id,
      req.user.tenantId,
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a document by ID" })
  @ApiResponse({ status: 200, description: "Document details" })
  @ApiResponse({ status: 404, description: "Document not found" })
  async findDocument(@Param("id") id: string, @Request() req: any) {
    return this.documentsService.findDocument(id, req.user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a new document from a template" })
  @ApiResponse({ status: 201, description: "Document created" })
  @ApiResponse({ status: 404, description: "Template not found" })
  async createDocument(@Body() dto: CreateDocumentDto, @Request() req: any) {
    return this.documentsService.createDocument(
      req.user.id,
      req.user.tenantId,
      dto,
    );
  }

  @Put(":id")
  @ApiOperation({ summary: "Update document content" })
  @ApiResponse({ status: 200, description: "Document updated" })
  @ApiResponse({ status: 404, description: "Document not found" })
  async updateDocument(
    @Param("id") id: string,
    @Body() dto: UpdateDocumentDto,
    @Request() req: any,
  ) {
    return this.documentsService.updateDocument(id, req.user.id, dto);
  }

  @Post(":id/submit")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Submit document for review" })
  @ApiResponse({ status: 200, description: "Document submitted" })
  @ApiResponse({
    status: 400,
    description: "Document not ready for submission",
  })
  async submitDocument(@Param("id") id: string, @Request() req: any) {
    return this.documentsService.submitDocument(id, req.user.id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a document" })
  @ApiResponse({ status: 204, description: "Document deleted" })
  @ApiResponse({ status: 404, description: "Document not found" })
  async deleteDocument(@Param("id") id: string, @Request() req: any) {
    return this.documentsService.deleteDocument(id, req.user.id);
  }

  // ============================================
  // PORTFOLIO PROGRESS
  // ============================================

  @Get("portfolio/progress")
  @ApiOperation({ summary: "Get document portfolio progress" })
  @ApiResponse({ status: 200, description: "Portfolio progress by element" })
  async getPortfolioProgress(@Request() req: any) {
    return this.documentsService.updatePortfolioProgress(
      req.user.id,
      req.user.tenantId,
      "EC0249",
    );
  }
}
