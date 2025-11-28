import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SsoCallbackDto {
  @ApiProperty({
    description: 'Authorization code from Janua OAuth flow',
  })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiPropertyOptional({
    description: 'State parameter for CSRF verification',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Error code if authorization failed',
  })
  @IsOptional()
  @IsString()
  error?: string;

  @ApiPropertyOptional({
    description: 'Error description if authorization failed',
  })
  @IsOptional()
  @IsString()
  error_description?: string;
}
