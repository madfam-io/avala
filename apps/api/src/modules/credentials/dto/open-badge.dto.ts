import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsDateString,
  IsEnum,
  IsNumber,
  IsArray,
  IsUrl,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Open Badges 3.0 DTOs
 * Implements W3C Verifiable Credentials / Open Badges 3.0 specification
 * https://www.imsglobal.org/spec/ob/v3p0/
 */

export enum CredentialStatusDto {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

export enum AchievementType {
  Achievement = 'Achievement',
  Assessment = 'Assessment',
  Competency = 'Competency',
  Course = 'Course',
  Certificate = 'Certificate',
  Certification = 'Certification',
  License = 'License',
  MicroCredential = 'MicroCredential',
}

export enum AlignmentTargetType {
  CONOCER = 'CONOCER',
  STPS = 'STPS',
  CFT = 'cft',
  CE = 'ce',
  ECTS = 'ects',
  SKILL = 'skill',
}

// ============================================
// ALIGNMENT DTOs (for EC/competency mapping)
// ============================================

export class AlignmentDto {
  @ApiProperty({ description: 'Alignment target framework' })
  @IsString()
  targetName: string;

  @ApiPropertyOptional({ description: 'URL to framework definition' })
  @IsOptional()
  @IsUrl()
  targetUrl?: string;

  @ApiPropertyOptional({ description: 'Framework identifier' })
  @IsOptional()
  @IsString()
  targetCode?: string;

  @ApiPropertyOptional({ description: 'Description of alignment' })
  @IsOptional()
  @IsString()
  targetDescription?: string;

  @ApiPropertyOptional({ enum: AlignmentTargetType })
  @IsOptional()
  @IsEnum(AlignmentTargetType)
  targetFramework?: AlignmentTargetType;
}

// ============================================
// ISSUER DTOs
// ============================================

export class IssuerProfileDto {
  @ApiProperty({ description: 'Issuer name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Issuer URL' })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({ description: 'Issuer email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Issuer description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Issuer image URL' })
  @IsOptional()
  @IsUrl()
  image?: string;
}

// ============================================
// ACHIEVEMENT DTOs
// ============================================

export class AchievementDto {
  @ApiProperty({ description: 'Achievement name/title' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Achievement description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: AchievementType, default: AchievementType.Achievement })
  @IsOptional()
  @IsEnum(AchievementType)
  achievementType?: AchievementType;

  @ApiPropertyOptional({ description: 'Criteria narrative or URL' })
  @IsOptional()
  @IsString()
  criteria?: string;

  @ApiPropertyOptional({ description: 'Achievement image URL' })
  @IsOptional()
  @IsUrl()
  image?: string;

  @ApiPropertyOptional({ description: 'Alignments to external frameworks', type: [AlignmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AlignmentDto)
  alignment?: AlignmentDto[];
}

// ============================================
// CREDENTIAL SUBJECT DTOs
// ============================================

export class CredentialSubjectDto {
  @ApiProperty({ description: 'Subject identifier (usually trainee ID or DID)' })
  @IsString()
  id: string;

  @ApiPropertyOptional({ description: 'Subject name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Subject email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'Achievement earned', type: AchievementDto })
  @ValidateNested()
  @Type(() => AchievementDto)
  achievement: AchievementDto;
}

// ============================================
// CREATE/ISSUE DTOs
// ============================================

export class IssueBadgeDto {
  @ApiProperty({ description: 'Tenant ID' })
  @IsUUID()
  tenantId: string;

  @ApiProperty({ description: 'Trainee/recipient ID' })
  @IsUUID()
  traineeId: string;

  @ApiPropertyOptional({ description: 'Course ID (if badge is for course completion)' })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional({ description: 'EC Standard ID (if badge is for competency)' })
  @IsOptional()
  @IsUUID()
  ecStandardId?: string;

  @ApiPropertyOptional({ description: 'DC-3 ID to link credential' })
  @IsOptional()
  @IsUUID()
  dc3Id?: string;

  @ApiProperty({ description: 'Achievement details', type: AchievementDto })
  @ValidateNested()
  @Type(() => AchievementDto)
  achievement: AchievementDto;

  @ApiPropertyOptional({ description: 'Alignments to frameworks', type: [AlignmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AlignmentDto)
  alignments?: AlignmentDto[];

  @ApiPropertyOptional({ description: 'Expiration date' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Evidence URLs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  evidence?: string[];
}

export class BulkIssueBadgeDto {
  @ApiProperty({ description: 'Tenant ID' })
  @IsUUID()
  tenantId: string;

  @ApiProperty({ description: 'Trainee IDs', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  traineeIds: string[];

  @ApiPropertyOptional({ description: 'Course ID' })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiProperty({ description: 'Achievement details', type: AchievementDto })
  @ValidateNested()
  @Type(() => AchievementDto)
  achievement: AchievementDto;

  @ApiPropertyOptional({ description: 'Alignments', type: [AlignmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AlignmentDto)
  alignments?: AlignmentDto[];

  @ApiPropertyOptional({ description: 'Expiration date' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

// ============================================
// REVOCATION DTOs
// ============================================

export class RevokeBadgeDto {
  @ApiProperty({ description: 'Reason for revocation' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

// ============================================
// QUERY DTOs
// ============================================

export class CredentialQueryDto {
  @ApiProperty({ description: 'Tenant ID' })
  @IsUUID()
  tenantId: string;

  @ApiPropertyOptional({ description: 'Filter by trainee ID' })
  @IsOptional()
  @IsUUID()
  traineeId?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: CredentialStatusDto })
  @IsOptional()
  @IsEnum(CredentialStatusDto)
  status?: CredentialStatusDto;

  @ApiPropertyOptional({ description: 'Filter by achievement type', enum: AchievementType })
  @IsOptional()
  @IsEnum(AchievementType)
  achievementType?: AchievementType;

  @ApiPropertyOptional({ description: 'Filter by course ID' })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional({ description: 'Issued from date' })
  @IsOptional()
  @IsDateString()
  issuedFrom?: string;

  @ApiPropertyOptional({ description: 'Issued to date' })
  @IsOptional()
  @IsDateString()
  issuedTo?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

// ============================================
// RESPONSE DTOs
// ============================================

export class OpenBadgeCredentialDto {
  @ApiProperty({ description: 'JSON-LD context' })
  '@context': string[];

  @ApiProperty({ description: 'Credential ID (URI)' })
  id: string;

  @ApiProperty({ description: 'Credential types' })
  type: string[];

  @ApiProperty({ description: 'Issuer profile' })
  issuer: IssuerProfileDto;

  @ApiProperty({ description: 'Issuance date' })
  issuanceDate: string;

  @ApiPropertyOptional({ description: 'Expiration date' })
  expirationDate?: string;

  @ApiProperty({ description: 'Credential subject with achievement' })
  credentialSubject: CredentialSubjectDto;

  @ApiPropertyOptional({ description: 'Evidence URLs' })
  evidence?: { id: string; type: string[] }[];

  @ApiPropertyOptional({ description: 'Credential status' })
  credentialStatus?: {
    id: string;
    type: string;
    statusPurpose: string;
    statusListIndex: string;
    statusListCredential: string;
  };
}

export class CredentialResponseDto {
  @ApiProperty({ description: 'Internal credential ID' })
  id: string;

  @ApiProperty({ description: 'Tenant ID' })
  tenantId: string;

  @ApiProperty({ description: 'Trainee ID' })
  traineeId: string;

  @ApiProperty({ description: 'Credential type (OBV3, VC)' })
  type: string;

  @ApiProperty({ description: 'Credential status' })
  status: CredentialStatusDto;

  @ApiProperty({ description: 'Issuance date' })
  issuedAt: Date;

  @ApiPropertyOptional({ description: 'Expiration date' })
  expiresAt?: Date;

  @ApiPropertyOptional({ description: 'Revocation date' })
  revokedAt?: Date;

  @ApiProperty({ description: 'Full OBv3 credential payload' })
  credential: OpenBadgeCredentialDto;
}

export class VerifyCredentialResponseDto {
  @ApiProperty({ description: 'Whether credential is valid' })
  valid: boolean;

  @ApiProperty({ description: 'Credential ID' })
  credentialId: string;

  @ApiProperty({ description: 'Credential status' })
  status: CredentialStatusDto;

  @ApiPropertyOptional({ description: 'Verification message' })
  message?: string;

  @ApiPropertyOptional({ description: 'Achievement name' })
  achievementName?: string;

  @ApiPropertyOptional({ description: 'Recipient name' })
  recipientName?: string;

  @ApiPropertyOptional({ description: 'Issuer name' })
  issuerName?: string;

  @ApiPropertyOptional({ description: 'Issuance date' })
  issuedAt?: Date;

  @ApiPropertyOptional({ description: 'Expiration date' })
  expiresAt?: Date;
}

export class CredentialStatisticsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  active: number;

  @ApiProperty()
  revoked: number;

  @ApiProperty()
  expired: number;

  @ApiProperty({ description: 'Breakdown by achievement type' })
  byType: { type: string; count: number }[];

  @ApiProperty({ description: 'Monthly issuance' })
  byMonth: { month: number; count: number }[];
}
