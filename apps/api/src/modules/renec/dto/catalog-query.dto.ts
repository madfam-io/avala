import { IsOptional, IsEnum, IsInt, Min, Max, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export enum RenecItemType {
  OCCUPATION = 'OCCUPATION',
  COMPETENCY = 'COMPETENCY',
  NORM = 'NORM',
}

export enum RenecLevel {
  LEVEL_1 = 'LEVEL_1',
  LEVEL_2 = 'LEVEL_2',
  LEVEL_3 = 'LEVEL_3',
  LEVEL_4 = 'LEVEL_4',
  LEVEL_5 = 'LEVEL_5',
}

export class RenecCatalogQueryDto {
  @ApiPropertyOptional({ description: 'Search by name or code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by item type', enum: RenecItemType })
  @IsOptional()
  @IsEnum(RenecItemType)
  type?: RenecItemType;

  @ApiPropertyOptional({ description: 'Filter by competency level', enum: RenecLevel })
  @IsOptional()
  @IsEnum(RenecLevel)
  level?: RenecLevel;

  @ApiPropertyOptional({ description: 'Filter by sector/category code' })
  @IsOptional()
  @IsString()
  sectorCode?: string;

  @ApiPropertyOptional({ description: 'Filter by area code' })
  @IsOptional()
  @IsString()
  areaCode?: string;

  @ApiPropertyOptional({ description: 'Filter active items only', default: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  activeOnly?: boolean;

  @ApiPropertyOptional({ description: 'Include related competencies' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeCompetencies?: boolean;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
