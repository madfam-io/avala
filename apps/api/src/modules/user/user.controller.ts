import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateUserDto,
  UpdateUserDto,
  QueryUsersDto,
} from './dto/create-user.dto';

/**
 * UsersController
 * Handles user management with pagination and CRUD operations
 */
@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * List users with pagination and filtering
   */
  @Get()
  @ApiOperation({ summary: 'List users with pagination' })
  async findAll(
    @TenantId() tenantId: string,
    @Query() query: QueryUsersDto,
  ) {
    return this.userService.findAll(tenantId, {
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 10,
      role: query.role,
      status: query.status,
      search: query.search,
    });
  }

  /**
   * Get user statistics by role
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics by role' })
  countByRole(@TenantId() tenantId: string) {
    return this.userService.countByRole(tenantId);
  }

  /**
   * Get user by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findById(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.userService.findById(tenantId, id);
  }

  /**
   * Create new user
   */
  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @TenantId() tenantId: string,
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.userService.create(tenantId, createUserDto);
  }

  /**
   * Update user
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(tenantId, id, updateUserDto);
  }

  /**
   * Delete user (soft delete)
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete user (soft delete)' })
  @HttpCode(HttpStatus.OK)
  async delete(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.userService.delete(tenantId, id);
  }
}
