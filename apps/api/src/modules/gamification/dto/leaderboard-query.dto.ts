import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum LeaderboardType {
  WEEKLY_POINTS = 'WEEKLY_POINTS',
  MONTHLY_POINTS = 'MONTHLY_POINTS',
  ALL_TIME_POINTS = 'ALL_TIME_POINTS',
  STREAK = 'STREAK',
}

export class LeaderboardQueryDto {
  @ApiPropertyOptional({
    description: 'Type of leaderboard',
    enum: LeaderboardType,
    default: LeaderboardType.WEEKLY_POINTS,
  })
  @IsOptional()
  @IsEnum(LeaderboardType)
  type?: LeaderboardType = LeaderboardType.WEEKLY_POINTS;

  @ApiPropertyOptional({
    description: 'Number of entries to return',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
