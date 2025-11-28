import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateModuleProgressDto {
  @ApiProperty({
    description: 'Module ID',
  })
  @IsString()
  @IsNotEmpty()
  moduleId: string;

  @ApiPropertyOptional({
    description: 'Progress percentage (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progressPercent?: number;

  @ApiPropertyOptional({
    description: 'Time spent on module in seconds',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  timeSpentSeconds?: number;

  @ApiPropertyOptional({
    description: 'Whether the module is completed',
  })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}

export class UpdateLessonProgressDto {
  @ApiProperty({
    description: 'Lesson ID',
  })
  @IsString()
  @IsNotEmpty()
  lessonId: string;

  @ApiPropertyOptional({
    description: 'Progress percentage (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progressPercent?: number;

  @ApiPropertyOptional({
    description: 'Video playback position in seconds',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  videoPosition?: number;

  @ApiPropertyOptional({
    description: 'Whether the lesson is completed',
  })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}

export class ProgressSummaryDto {
  enrollmentId: string;
  courseId: string;
  userId: string;
  overallProgress: number;
  modulesCompleted: number;
  totalModules: number;
  lessonsCompleted: number;
  totalLessons: number;
  quizzesCompleted: number;
  totalQuizzes: number;
  averageQuizScore: number;
  totalTimeSpent: number;
  lastActivityAt: Date | null;
  estimatedCompletionDate: Date | null;
}
