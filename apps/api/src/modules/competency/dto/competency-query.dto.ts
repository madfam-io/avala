import { IsOptional, IsEnum, IsInt, Min, Max, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { CompetencyLevel, CompetencyType } from './create-competency.dto';

export class CompetencyQueryDto {
  @ApiPropertyOptional({ description: 'Search by name or code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by type', enum: CompetencyType })
  @IsOptional()
  @IsEnum(CompetencyType)
  type?: CompetencyType;

  @ApiPropertyOptional({ description: 'Filter by level', enum: CompetencyLevel })
  @IsOptional()
  @IsEnum(CompetencyLevel)
  level?: CompetencyLevel;

  @ApiPropertyOptional({ description: 'Filter by parent competency ID' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Include child competencies', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeChildren?: boolean;

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
