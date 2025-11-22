import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CoursesService, CreateCourseDto, UpdateCourseDto } from './courses.service';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new course' })
  create(
    @TenantId() tenantId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateCourseDto,
  ) {
    return this.coursesService.create(tenantId, {
      ...dto,
      ownerId: userId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List all courses' })
  findAll(@TenantId() tenantId: string) {
    return this.coursesService.findAll(tenantId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search courses by title or code' })
  @ApiQuery({ name: 'q', required: true })
  search(@TenantId() tenantId: string, @Query('q') query: string) {
    return this.coursesService.search(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  findById(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.coursesService.findById(tenantId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update course' })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.coursesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Archive course' })
  delete(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.coursesService.delete(tenantId, id);
  }
}
