import { PartialType, OmitType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateTenantDto } from './create-tenant.dto';

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
}

export class UpdateTenantDto extends PartialType(
  OmitType(CreateTenantDto, ['slug', 'adminEmail'] as const),
) {
  @ApiPropertyOptional({
    description: 'Tenant status',
    enum: TenantStatus,
  })
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;
}
