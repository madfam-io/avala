import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SsoLoginDto {
  @ApiPropertyOptional({
    description: 'Tenant slug for organization-specific login',
    example: 'acme-corp',
  })
  @IsOptional()
  @IsString()
  tenantSlug?: string;

  @ApiPropertyOptional({
    description: 'State parameter for CSRF protection',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Redirect URL after successful authentication',
    example: 'https://app.avala.mx/dashboard',
  })
  @IsOptional()
  @IsString()
  redirectUrl?: string;
}
