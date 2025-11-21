import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UserService } from './user.service';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { Role } from '@avala/db';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'List users for tenant' })
  @ApiQuery({ name: 'role', required: false, enum: Role })
  async findAll(
    @TenantId() tenantId: string,
    @Query('role') role?: Role,
  ) {
    if (role) {
      return this.userService.findByRole(tenantId, role);
    }
    return this.userService.findAll(tenantId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics by role' })
  countByRole(@TenantId() tenantId: string) {
    return this.userService.countByRole(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findById(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.userService.findById(tenantId, id);
  }
}
