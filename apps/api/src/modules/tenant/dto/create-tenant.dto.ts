import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum TenantPlan {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export class TenantSettingsDto {
  @ApiPropertyOptional({ description: 'Primary brand color', example: '#3B82F6' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Invalid hex color format' })
  primaryColor?: string;

  @ApiPropertyOptional({ description: 'Secondary brand color', example: '#10B981' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Invalid hex color format' })
  secondaryColor?: string;

  @ApiPropertyOptional({ description: 'Tenant logo URL' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Favicon URL' })
  @IsOptional()
  @IsString()
  faviconUrl?: string;

  @ApiPropertyOptional({ description: 'Custom domain for tenant', example: 'training.acme.com' })
  @IsOptional()
  @IsString()
  customDomain?: string;

  @ApiPropertyOptional({ description: 'Timezone', example: 'America/Mexico_City' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Default language', example: 'es-MX' })
  @IsOptional()
  @IsString()
  defaultLanguage?: string;

  @ApiPropertyOptional({ description: 'Enable DC-3 compliance features' })
  @IsOptional()
  dc3Enabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable STPS compliance features' })
  @IsOptional()
  stpsEnabled?: boolean;
}

export class CreateTenantDto {
  @ApiProperty({
    description: 'Organization name',
    example: 'ACME Corporation',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Unique URL slug for the tenant',
    example: 'acme-corp',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric with hyphens only',
  })
  slug: string;

  @ApiProperty({
    description: 'Admin email for the tenant',
    example: 'admin@acme.com',
  })
  @IsEmail()
  @IsNotEmpty()
  adminEmail: string;

  @ApiPropertyOptional({
    description: 'Admin first name',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  adminFirstName?: string;

  @ApiPropertyOptional({
    description: 'Admin last name',
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  adminLastName?: string;

  @ApiPropertyOptional({
    description: 'Subscription plan',
    enum: TenantPlan,
    default: TenantPlan.FREE,
  })
  @IsOptional()
  @IsEnum(TenantPlan)
  plan?: TenantPlan;

  @ApiPropertyOptional({
    description: 'Tenant settings and branding',
    type: TenantSettingsDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => TenantSettingsDto)
  settings?: TenantSettingsDto;

  @ApiPropertyOptional({
    description: 'RFC (Tax ID) for Mexican compliance',
    example: 'AAA010101AAA',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, {
    message: 'Invalid RFC format',
  })
  rfc?: string;

  @ApiPropertyOptional({
    description: 'Business legal name',
    example: 'ACME Corporation S.A. de C.V.',
  })
  @IsOptional()
  @IsString()
  legalName?: string;
}
