import { IsOptional, IsInt, Min, Max, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ActivityQueryDto {
  @ApiPropertyOptional({
    description: 'Number of days to fetch activity for',
    default: 30,
    minimum: 1,
    maximum: 365,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number = 30;

  @ApiPropertyOptional({
    description: 'Start date for activity query',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for activity query',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CalendarQueryDto {
  @ApiPropertyOptional({
    description: 'Year to fetch activity calendar for',
    example: 2025,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2100)
  year?: number = new Date().getFullYear();
}
