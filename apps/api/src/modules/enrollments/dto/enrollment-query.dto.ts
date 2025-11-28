import { IsOptional, IsEnum, IsInt, Min, Max, IsString, IsBoolean, IsDate } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { EnrollmentStatus } from './update-enrollment.dto';

export class EnrollmentQueryDto {
  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by course ID' })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: EnrollmentStatus })
  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;

  @ApiPropertyOptional({ description: 'Filter overdue enrollments' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  overdue?: boolean;

  @ApiPropertyOptional({ description: 'Filter enrollments due before this date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueBefore?: Date;

  @ApiPropertyOptional({ description: 'Filter enrollments created after this date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  createdAfter?: Date;

  @ApiPropertyOptional({ description: 'Include course details', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeCourse?: boolean;

  @ApiPropertyOptional({ description: 'Include user details', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeUser?: boolean;

  @ApiPropertyOptional({ description: 'Include progress details', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeProgress?: boolean;

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

  @ApiPropertyOptional({ description: 'Sort field', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
