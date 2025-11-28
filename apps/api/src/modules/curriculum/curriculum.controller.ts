import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import {
  ModulesService,
  CreateModuleDto,
  UpdateModuleDto,
} from "./modules.service";
import {
  LessonsService,
  CreateLessonDto,
  UpdateLessonDto,
  UpdateLessonContentDto,
} from "./lessons.service";
import { CompetencyMappingService } from "./competency-mapping.service";
import { TenantId } from "../../common/decorators/tenant.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("curriculum")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class CurriculumController {
  constructor(
    private readonly modulesService: ModulesService,
    private readonly lessonsService: LessonsService,
    private readonly competencyMappingService: CompetencyMappingService,
  ) {}

  // ============================================
  // MODULE ENDPOINTS
  // ============================================

  @Post("courses/:courseId/modules")
  @ApiOperation({ summary: "Create a module in a course" })
  createModule(
    @TenantId() tenantId: string,
    @Param("courseId") courseId: string,
    @Body() dto: CreateModuleDto,
  ) {
    return this.modulesService.create(tenantId, courseId, dto);
  }

  @Get("courses/:courseId/modules")
  @ApiOperation({ summary: "Get all modules for a course" })
  getModulesByCourse(
    @TenantId() tenantId: string,
    @Param("courseId") courseId: string,
  ) {
    return this.modulesService.findByCourse(tenantId, courseId);
  }

  @Get("modules/:moduleId")
  @ApiOperation({ summary: "Get a module by ID" })
  getModule(@TenantId() tenantId: string, @Param("moduleId") moduleId: string) {
    return this.modulesService.findById(tenantId, moduleId);
  }

  @Put("modules/:moduleId")
  @ApiOperation({ summary: "Update a module" })
  updateModule(
    @TenantId() tenantId: string,
    @Param("moduleId") moduleId: string,
    @Body() dto: UpdateModuleDto,
  ) {
    return this.modulesService.update(tenantId, moduleId, dto);
  }

  @Delete("modules/:moduleId")
  @ApiOperation({ summary: "Delete a module (cascades to lessons)" })
  deleteModule(
    @TenantId() tenantId: string,
    @Param("moduleId") moduleId: string,
  ) {
    return this.modulesService.delete(tenantId, moduleId);
  }

  @Put("courses/:courseId/modules/reorder")
  @ApiOperation({ summary: "Reorder modules in a course" })
  reorderModules(
    @TenantId() tenantId: string,
    @Param("courseId") courseId: string,
    @Body() moduleOrders: { id: string; order: number }[],
  ) {
    return this.modulesService.reorder(tenantId, courseId, moduleOrders);
  }

  // ============================================
  // LESSON ENDPOINTS
  // ============================================

  @Post("modules/:moduleId/lessons")
  @ApiOperation({ summary: "Create a lesson in a module" })
  createLesson(
    @TenantId() tenantId: string,
    @Param("moduleId") moduleId: string,
    @Body() dto: CreateLessonDto,
  ) {
    return this.lessonsService.create(tenantId, moduleId, dto);
  }

  @Get("modules/:moduleId/lessons")
  @ApiOperation({ summary: "Get all lessons for a module" })
  getLessonsByModule(
    @TenantId() tenantId: string,
    @Param("moduleId") moduleId: string,
  ) {
    return this.lessonsService.findByModule(tenantId, moduleId);
  }

  @Get("lessons/:lessonId")
  @ApiOperation({ summary: "Get a lesson by ID" })
  getLesson(@TenantId() tenantId: string, @Param("lessonId") lessonId: string) {
    return this.lessonsService.findById(tenantId, lessonId);
  }

  @Put("lessons/:lessonId")
  @ApiOperation({ summary: "Update a lesson" })
  updateLesson(
    @TenantId() tenantId: string,
    @Param("lessonId") lessonId: string,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.lessonsService.update(tenantId, lessonId, dto);
  }

  @Delete("lessons/:lessonId")
  @ApiOperation({ summary: "Delete a lesson" })
  deleteLesson(
    @TenantId() tenantId: string,
    @Param("lessonId") lessonId: string,
  ) {
    return this.lessonsService.delete(tenantId, lessonId);
  }

  @Put("modules/:moduleId/lessons/reorder")
  @ApiOperation({ summary: "Reorder lessons in a module" })
  reorderLessons(
    @TenantId() tenantId: string,
    @Param("moduleId") moduleId: string,
    @Body() lessonOrders: { id: string; order: number }[],
  ) {
    return this.lessonsService.reorder(tenantId, moduleId, lessonOrders);
  }

  @Put("lessons/:lessonId/content")
  @ApiOperation({ summary: "Update lesson content (title, content, video)" })
  updateLessonContent(
    @TenantId() tenantId: string,
    @Param("lessonId") lessonId: string,
    @Body() dto: UpdateLessonContentDto,
  ) {
    return this.lessonsService.updateContent(tenantId, lessonId, dto);
  }

  // ============================================
  // COMPETENCY MAPPING ENDPOINTS
  // ============================================

  @Get("courses/:courseId/criteria")
  @ApiOperation({
    summary: "Get available criteria for a course (from linked standards)",
  })
  getAvailableCriteria(
    @TenantId() tenantId: string,
    @Param("courseId") courseId: string,
  ) {
    return this.competencyMappingService.getAvailableCriteria(
      tenantId,
      courseId,
    );
  }

  @Get("lessons/:lessonId/mapping")
  @ApiOperation({ summary: "Get criterion mappings for a lesson" })
  getLessonMapping(
    @TenantId() tenantId: string,
    @Param("lessonId") lessonId: string,
  ) {
    return this.competencyMappingService.getLessonMapping(tenantId, lessonId);
  }

  @Post("lessons/:lessonId/mapping/:criterionId")
  @ApiOperation({ summary: "Toggle criterion mapping for a lesson" })
  toggleMapping(
    @TenantId() tenantId: string,
    @Param("lessonId") lessonId: string,
    @Param("criterionId") criterionId: string,
  ) {
    return this.competencyMappingService.toggleMapping(
      tenantId,
      lessonId,
      criterionId,
    );
  }

  @Put("lessons/:lessonId/mapping")
  @ApiOperation({ summary: "Set all criterion mappings for a lesson" })
  setLessonMappings(
    @TenantId() tenantId: string,
    @Param("lessonId") lessonId: string,
    @Body() body: { criteriaIds: string[] },
  ) {
    return this.competencyMappingService.setLessonMappings(
      tenantId,
      lessonId,
      body.criteriaIds,
    );
  }

  @Get("courses/:courseId/mapping-stats")
  @ApiOperation({ summary: "Get mapping statistics for a course" })
  getCourseMappingStats(
    @TenantId() tenantId: string,
    @Param("courseId") courseId: string,
  ) {
    return this.competencyMappingService.getCourseMappingStats(
      tenantId,
      courseId,
    );
  }
}
