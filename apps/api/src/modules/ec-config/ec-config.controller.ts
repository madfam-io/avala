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
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { ECConfigService } from "./ec-config.service";
import {
  CreateECStandardDto,
  UpdateECStandardDto,
  ECStandardQueryDto,
  CreateECElementDto,
  UpdateECElementDto,
  CreateECModuleDto,
  UpdateECModuleDto,
  CreateECLessonDto,
  UpdateECLessonDto,
  ECStandardResponseDto,
  ECElementResponseDto,
  ECModuleResponseDto,
  ECLessonResponseDto,
} from "./dto/ec-standard.dto";

@ApiTags("EC Configuration")
@ApiBearerAuth()
@Controller("ec")
export class ECConfigController {
  constructor(private readonly ecConfigService: ECConfigService) {}

  // ============================================
  // EC STANDARDS
  // ============================================

  @Post("standards")
  @ApiOperation({ summary: "Create a new EC Standard" })
  @ApiResponse({
    status: 201,
    description: "EC Standard created",
    type: ECStandardResponseDto,
  })
  @ApiResponse({ status: 409, description: "EC Standard already exists" })
  async createStandard(@Body() dto: CreateECStandardDto) {
    return this.ecConfigService.createStandard(dto);
  }

  @Get("standards")
  @ApiOperation({ summary: "List all EC Standards" })
  @ApiResponse({ status: 200, description: "Paginated list of EC Standards" })
  async findAllStandards(@Query() query: ECStandardQueryDto) {
    return this.ecConfigService.findAllStandards(query);
  }

  @Get("standards/:code")
  @ApiOperation({ summary: "Get EC Standard by code" })
  @ApiParam({ name: "code", example: "EC0249" })
  @ApiResponse({
    status: 200,
    description: "EC Standard details",
    type: ECStandardResponseDto,
  })
  @ApiResponse({ status: 404, description: "EC Standard not found" })
  async findStandardByCode(@Param("code") code: string) {
    return this.ecConfigService.findStandardByCode(code);
  }

  @Get("standards/:code/overview")
  @ApiOperation({ summary: "Get EC Standard overview with statistics" })
  @ApiParam({ name: "code", example: "EC0249" })
  @ApiResponse({ status: 200, description: "EC Standard overview" })
  async getStandardOverview(@Param("code") code: string) {
    return this.ecConfigService.getStandardOverview(code);
  }

  @Put("standards/:code")
  @ApiOperation({ summary: "Update EC Standard" })
  @ApiParam({ name: "code", example: "EC0249" })
  @ApiResponse({
    status: 200,
    description: "EC Standard updated",
    type: ECStandardResponseDto,
  })
  @ApiResponse({ status: 404, description: "EC Standard not found" })
  async updateStandard(
    @Param("code") code: string,
    @Body() dto: UpdateECStandardDto,
  ) {
    return this.ecConfigService.updateStandard(code, dto);
  }

  @Delete("standards/:code")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete EC Standard" })
  @ApiParam({ name: "code", example: "EC0249" })
  @ApiResponse({ status: 200, description: "EC Standard deleted" })
  @ApiResponse({ status: 404, description: "EC Standard not found" })
  @ApiResponse({ status: 409, description: "Cannot delete - has enrollments" })
  async deleteStandard(@Param("code") code: string) {
    return this.ecConfigService.deleteStandard(code);
  }

  @Post("standards/:code/publish")
  @ApiOperation({ summary: "Publish EC Standard" })
  @ApiParam({ name: "code", example: "EC0249" })
  @ApiResponse({ status: 200, description: "EC Standard published" })
  async publishStandard(@Param("code") code: string) {
    return this.ecConfigService.publishStandard(code);
  }

  @Post("standards/:code/deprecate")
  @ApiOperation({ summary: "Deprecate EC Standard" })
  @ApiParam({ name: "code", example: "EC0249" })
  @ApiResponse({ status: 200, description: "EC Standard deprecated" })
  async deprecateStandard(@Param("code") code: string) {
    return this.ecConfigService.deprecateStandard(code);
  }

  @Post("standards/:sourceCode/clone")
  @ApiOperation({ summary: "Clone EC Standard to create a new one" })
  @ApiParam({ name: "sourceCode", example: "EC0249" })
  @ApiResponse({ status: 201, description: "EC Standard cloned" })
  async cloneStandard(
    @Param("sourceCode") sourceCode: string,
    @Body() body: { newCode: string; newTitle: string },
  ) {
    return this.ecConfigService.cloneStandard(
      sourceCode,
      body.newCode,
      body.newTitle,
    );
  }

  // ============================================
  // EC ELEMENTS
  // ============================================

  @Post("standards/:code/elements")
  @ApiOperation({ summary: "Create element for EC Standard" })
  @ApiParam({ name: "code", example: "EC0249" })
  @ApiResponse({
    status: 201,
    description: "Element created",
    type: ECElementResponseDto,
  })
  async createElement(
    @Param("code") code: string,
    @Body() dto: CreateECElementDto,
  ) {
    return this.ecConfigService.createElement(code, dto);
  }

  @Get("standards/:code/elements")
  @ApiOperation({ summary: "Get elements for EC Standard" })
  @ApiParam({ name: "code", example: "EC0249" })
  @ApiResponse({ status: 200, description: "List of elements" })
  async findElements(@Param("code") code: string) {
    return this.ecConfigService.findElementsByStandard(code);
  }

  @Get("elements/:id")
  @ApiOperation({ summary: "Get element by ID" })
  @ApiResponse({
    status: 200,
    description: "Element details",
    type: ECElementResponseDto,
  })
  async findElementById(@Param("id") id: string) {
    return this.ecConfigService.findElementById(id);
  }

  @Put("elements/:id")
  @ApiOperation({ summary: "Update element" })
  @ApiResponse({
    status: 200,
    description: "Element updated",
    type: ECElementResponseDto,
  })
  async updateElement(
    @Param("id") id: string,
    @Body() dto: UpdateECElementDto,
  ) {
    return this.ecConfigService.updateElement(id, dto);
  }

  @Delete("elements/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete element" })
  @ApiResponse({ status: 200, description: "Element deleted" })
  async deleteElement(@Param("id") id: string) {
    return this.ecConfigService.deleteElement(id);
  }

  // ============================================
  // EC MODULES
  // ============================================

  @Post("standards/:code/modules")
  @ApiOperation({ summary: "Create module for EC Standard" })
  @ApiParam({ name: "code", example: "EC0249" })
  @ApiResponse({
    status: 201,
    description: "Module created",
    type: ECModuleResponseDto,
  })
  async createModule(
    @Param("code") code: string,
    @Body() dto: CreateECModuleDto,
  ) {
    return this.ecConfigService.createModule(code, dto);
  }

  @Get("standards/:code/modules")
  @ApiOperation({ summary: "Get modules for EC Standard" })
  @ApiParam({ name: "code", example: "EC0249" })
  @ApiResponse({ status: 200, description: "List of modules" })
  async findModules(@Param("code") code: string) {
    return this.ecConfigService.findModulesByStandard(code);
  }

  @Get("modules/:id")
  @ApiOperation({ summary: "Get module by ID" })
  @ApiResponse({
    status: 200,
    description: "Module details",
    type: ECModuleResponseDto,
  })
  async findModuleById(@Param("id") id: string) {
    return this.ecConfigService.findModuleById(id);
  }

  @Put("modules/:id")
  @ApiOperation({ summary: "Update module" })
  @ApiResponse({
    status: 200,
    description: "Module updated",
    type: ECModuleResponseDto,
  })
  async updateModule(@Param("id") id: string, @Body() dto: UpdateECModuleDto) {
    return this.ecConfigService.updateModule(id, dto);
  }

  @Delete("modules/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete module" })
  @ApiResponse({ status: 200, description: "Module deleted" })
  async deleteModule(@Param("id") id: string) {
    return this.ecConfigService.deleteModule(id);
  }

  // ============================================
  // EC LESSONS
  // ============================================

  @Post("modules/:moduleId/lessons")
  @ApiOperation({ summary: "Create lesson for module" })
  @ApiResponse({
    status: 201,
    description: "Lesson created",
    type: ECLessonResponseDto,
  })
  async createLesson(
    @Param("moduleId") moduleId: string,
    @Body() dto: CreateECLessonDto,
  ) {
    return this.ecConfigService.createLesson(moduleId, dto);
  }

  @Get("modules/:moduleId/lessons")
  @ApiOperation({ summary: "Get lessons for module" })
  @ApiResponse({ status: 200, description: "List of lessons" })
  async findLessons(@Param("moduleId") moduleId: string) {
    return this.ecConfigService.findLessonsByModule(moduleId);
  }

  @Get("lessons/:id")
  @ApiOperation({ summary: "Get lesson by ID" })
  @ApiResponse({
    status: 200,
    description: "Lesson details",
    type: ECLessonResponseDto,
  })
  async findLessonById(@Param("id") id: string) {
    return this.ecConfigService.findLessonById(id);
  }

  @Put("lessons/:id")
  @ApiOperation({ summary: "Update lesson" })
  @ApiResponse({
    status: 200,
    description: "Lesson updated",
    type: ECLessonResponseDto,
  })
  async updateLesson(@Param("id") id: string, @Body() dto: UpdateECLessonDto) {
    return this.ecConfigService.updateLesson(id, dto);
  }

  @Delete("lessons/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete lesson" })
  @ApiResponse({ status: 200, description: "Lesson deleted" })
  async deleteLesson(@Param("id") id: string) {
    return this.ecConfigService.deleteLesson(id);
  }
}
