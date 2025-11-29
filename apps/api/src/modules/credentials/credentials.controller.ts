import {
  Controller,
  Get,
  Post,
  Patch,
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
import { OpenBadgeService } from './open-badge.service';
import {
  IssueBadgeDto,
  BulkIssueBadgeDto,
  RevokeBadgeDto,
  CredentialQueryDto,
  CredentialResponseDto,
  VerifyCredentialResponseDto,
  CredentialStatisticsDto,
} from './dto/open-badge.dto';

@ApiTags('Credentials')
@Controller('credentials')
export class CredentialsController {
  constructor(private readonly openBadgeService: OpenBadgeService) {}

  // ============================================
  // BADGE ISSUANCE ENDPOINTS
  // ============================================

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Issue Open Badge credential' })
  @ApiResponse({
    status: 201,
    description: 'Credential issued successfully',
    type: CredentialResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 404, description: 'Trainee or tenant not found' })
  async issueBadge(@Body() dto: IssueBadgeDto): Promise<CredentialResponseDto> {
    return this.openBadgeService.issue(dto);
  }

  @Post('bulk')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk issue badges to multiple trainees' })
  @ApiResponse({ status: 201, description: 'Bulk issuance results' })
  async bulkIssueBadge(@Body() dto: BulkIssueBadgeDto) {
    return this.openBadgeService.bulkIssue(dto);
  }

  // ============================================
  // QUERY ENDPOINTS
  // ============================================

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List credentials' })
  @ApiResponse({ status: 200, description: 'Paginated list of credentials' })
  async listCredentials(@Query() query: CredentialQueryDto) {
    return this.openBadgeService.findAll(query);
  }

  @Get('statistics')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get credential statistics' })
  @ApiResponse({ status: 200, description: 'Credential statistics', type: CredentialStatisticsDto })
  async getStatistics(
    @Query('tenantId') tenantId: string,
    @Query('year') year?: number,
  ): Promise<CredentialStatisticsDto> {
    return this.openBadgeService.getStatistics(tenantId, year);
  }

  @Get('trainee/:traineeId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get credentials for a trainee' })
  @ApiParam({ name: 'traineeId', description: 'Trainee ID' })
  @ApiResponse({
    status: 200,
    description: 'List of credentials',
    type: [CredentialResponseDto],
  })
  async getByTrainee(
    @Query('tenantId') tenantId: string,
    @Param('traineeId') traineeId: string,
  ): Promise<CredentialResponseDto[]> {
    return this.openBadgeService.findByTrainee(tenantId, traineeId);
  }

  // ============================================
  // PUBLIC VERIFICATION ENDPOINT
  // ============================================

  @Get('verify/:id')
  @ApiOperation({ summary: 'Verify credential (public endpoint)' })
  @ApiParam({ name: 'id', description: 'Credential ID' })
  @ApiResponse({
    status: 200,
    description: 'Verification result',
    type: VerifyCredentialResponseDto,
  })
  async verifyCredential(@Param('id') id: string): Promise<VerifyCredentialResponseDto> {
    return this.openBadgeService.verify(id);
  }

  // ============================================
  // CREDENTIAL DETAIL ENDPOINTS
  // ============================================

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get credential by ID' })
  @ApiParam({ name: 'id', description: 'Credential ID' })
  @ApiResponse({
    status: 200,
    description: 'Credential details',
    type: CredentialResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Credential not found' })
  async getById(@Param('id') id: string): Promise<CredentialResponseDto> {
    return this.openBadgeService.findById(id);
  }

  @Get(':id/payload')
  @ApiOperation({ summary: 'Get raw OBv3 credential JSON-LD (for sharing/export)' })
  @ApiParam({ name: 'id', description: 'Credential ID' })
  @ApiResponse({ status: 200, description: 'OBv3 JSON-LD credential' })
  @ApiResponse({ status: 404, description: 'Credential not found' })
  async getPayload(@Param('id') id: string) {
    return this.openBadgeService.getCredentialPayload(id);
  }

  // ============================================
  // REVOCATION ENDPOINTS
  // ============================================

  @Patch(':id/revoke')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke credential' })
  @ApiParam({ name: 'id', description: 'Credential ID' })
  @ApiResponse({
    status: 200,
    description: 'Credential revoked',
    type: CredentialResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Credential already revoked' })
  @ApiResponse({ status: 404, description: 'Credential not found' })
  async revokeCredential(
    @Param('id') id: string,
    @Body() dto: RevokeBadgeDto,
  ): Promise<CredentialResponseDto> {
    return this.openBadgeService.revoke(id, dto);
  }
}
