import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsBoolean,
  IsUrl,
  IsDate,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PortfolioItemDto {
  @ApiProperty({
    description: 'Item title',
    example: 'Certificación en Seguridad Industrial',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Item description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Related certificate ID',
  })
  @IsOptional()
  @IsString()
  certificateId?: string;

  @ApiPropertyOptional({
    description: 'Related course ID',
  })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional({
    description: 'Date achieved',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  achievedAt?: Date;

  @ApiPropertyOptional({
    description: 'Whether to show in public portfolio',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Display order',
    default: 0,
  })
  @IsOptional()
  orderIndex?: number;
}

export class CreatePortfolioDto {
  @ApiProperty({
    description: 'Portfolio display name',
    example: 'Mi Portafolio Profesional',
  })
  @IsString()
  @IsNotEmpty()
  displayName: string;

  @ApiPropertyOptional({
    description: 'Professional headline',
    example: 'Especialista en Seguridad Industrial',
  })
  @IsOptional()
  @IsString()
  headline?: string;

  @ApiPropertyOptional({
    description: 'Bio/summary',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    description: 'Custom portfolio URL slug',
    example: 'juan-perez',
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({
    description: 'LinkedIn profile URL',
  })
  @IsOptional()
  @IsUrl()
  linkedInUrl?: string;

  @ApiPropertyOptional({
    description: 'Personal website URL',
  })
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @ApiPropertyOptional({
    description: 'Whether the portfolio is public',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Theme/color scheme',
    example: 'professional',
  })
  @IsOptional()
  @IsString()
  theme?: string;

  @ApiPropertyOptional({
    description: 'Skills to highlight',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({
    description: 'Portfolio items',
    type: [PortfolioItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PortfolioItemDto)
  items?: PortfolioItemDto[];
}
