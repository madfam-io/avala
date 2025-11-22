import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ModulesService, CreateModuleDto, UpdateModuleDto } from './modules.service';
import { LessonsService, CreateLessonDto, UpdateLessonDto } from './lessons.service';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('curriculum')
@Controller()
export class CurriculumController {
  constructor(
    private readonly modulesService: ModulesService,
    private readonly lessonsService: LessonsService,
  ) {}

  // ============================================
  // MODULE ENDPOINTS
  // ============================================

  @Post('courses/:courseId/modules')
  @ApiOperation({ summary: 'Create a module in a course' })
  createModule(
    @TenantId() tenantId: string,
    @Param('courseId') courseId: string,
    @Body() dto: CreateModuleDto,
  ) {
    return this.modulesService.create(tenantId, courseId, dto);
  }

  @Get('courses/:courseId/modules')
  @ApiOperation({ summary: 'Get all modules for a course' })
  getModulesByCourse(
    @TenantId() tenantId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.modulesService.findByCourse(tenantId, courseId);
  }

  @Get('modules/:moduleId')
  @ApiOperation({ summary: 'Get a module by ID' })
  getModule(@TenantId() tenantId: string, @Param('moduleId') moduleId: string) {
    return this.modulesService.findById(tenantId, moduleId);
  }

  @Put('modules/:moduleId')
  @ApiOperation({ summary: 'Update a module' })
  updateModule(
    @TenantId() tenantId: string,
    @Param('moduleId') moduleId: string,
    @Body() dto: UpdateModuleDto,
  ) {
    return this.modulesService.update(tenantId, moduleId, dto);
  }

  @Delete('modules/:moduleId')
  @ApiOperation({ summary: 'Delete a module (cascades to lessons)' })
  deleteModule(
    @TenantId() tenantId: string,
    @Param('moduleId') moduleId: string,
  ) {
    return this.modulesService.delete(tenantId, moduleId);
  }

  @Put('courses/:courseId/modules/reorder')
  @ApiOperation({ summary: 'Reorder modules in a course' })
  reorderModules(
    @TenantId() tenantId: string,
    @Param('courseId') courseId: string,
    @Body() moduleOrders: { id: string; order: number }[],
  ) {
    return this.modulesService.reorder(tenantId, courseId, moduleOrders);
  }

  // ============================================
  // LESSON ENDPOINTS
  // ============================================

  @Post('modules/:moduleId/lessons')
  @ApiOperation({ summary: 'Create a lesson in a module' })
  createLesson(
    @TenantId() tenantId: string,
    @Param('moduleId') moduleId: string,
    @Body() dto: CreateLessonDto,
  ) {
    return this.lessonsService.create(tenantId, moduleId, dto);
  }

  @Get('modules/:moduleId/lessons')
  @ApiOperation({ summary: 'Get all lessons for a module' })
  getLessonsByModule(
    @TenantId() tenantId: string,
    @Param('moduleId') moduleId: string,
  ) {
    return this.lessonsService.findByModule(tenantId, moduleId);
  }

  @Get('lessons/:lessonId')
  @ApiOperation({ summary: 'Get a lesson by ID' })
  getLesson(@TenantId() tenantId: string, @Param('lessonId') lessonId: string) {
    return this.lessonsService.findById(tenantId, lessonId);
  }

  @Put('lessons/:lessonId')
  @ApiOperation({ summary: 'Update a lesson' })
  updateLesson(
    @TenantId() tenantId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.lessonsService.update(tenantId, lessonId, dto);
  }

  @Delete('lessons/:lessonId')
  @ApiOperation({ summary: 'Delete a lesson' })
  deleteLesson(
    @TenantId() tenantId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.lessonsService.delete(tenantId, lessonId);
  }

  @Put('modules/:moduleId/lessons/reorder')
  @ApiOperation({ summary: 'Reorder lessons in a module' })
  reorderLessons(
    @TenantId() tenantId: string,
    @Param('moduleId') moduleId: string,
    @Body() lessonOrders: { id: string; order: number }[],
  ) {
    return this.lessonsService.reorder(tenantId, moduleId, lessonOrders);
  }
}
