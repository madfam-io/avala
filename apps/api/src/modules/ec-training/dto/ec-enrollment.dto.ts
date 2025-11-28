import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsUUID,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

// ============================================
// EC ENROLLMENT DTOs
// ============================================

export class CreateECEnrollmentDto {
  @ApiProperty({ description: "User ID to enroll" })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: "EC Standard code (e.g., EC0249)" })
  @IsString()
  ecCode: string;

  @ApiProperty({ description: "Tenant ID" })
  @IsUUID()
  tenantId: string;
}

export class ECEnrollmentQueryDto {
  @ApiPropertyOptional({ description: "Filter by EC code" })
  @IsOptional()
  @IsString()
  ecCode?: string;

  @ApiPropertyOptional({ description: "Filter by tenant" })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ description: "Filter by status" })
  @IsOptional()
  @IsEnum(["IN_PROGRESS", "COMPLETED", "CERTIFIED", "EXPIRED"])
  status?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class UserEnrollmentQueryDto {
  @ApiPropertyOptional({ description: "Filter by status" })
  @IsOptional()
  @IsEnum(["IN_PROGRESS", "COMPLETED", "CERTIFIED", "EXPIRED"])
  status?: string;

  @ApiPropertyOptional({ description: "Include progress details" })
  @IsOptional()
  @IsBoolean()
  includeProgress?: boolean;
}

// ============================================
// PROGRESS TRACKING DTOs
// ============================================

export class UpdateLessonProgressDto {
  @ApiPropertyOptional({ enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] })
  @IsOptional()
  @IsEnum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"])
  status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

  @ApiPropertyOptional({
    description: "Video progress 0-100",
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  videoProgress?: number;

  @ApiPropertyOptional({ description: "Mark as completed" })
  @IsOptional()
  @IsBoolean()
  markCompleted?: boolean;
}

export class UpdateModuleProgressDto {
  @ApiPropertyOptional({ enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] })
  @IsOptional()
  @IsEnum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"])
  status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

  @ApiPropertyOptional({ description: "Progress percentage 0-100" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;
}

export class VideoProgressDto {
  @ApiProperty({ description: "Video progress percentage 0-100" })
  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number;

  @ApiPropertyOptional({ description: "Current time in seconds" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentTime?: number;

  @ApiPropertyOptional({ description: "Total duration in seconds" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;
}

// ============================================
// RESPONSE DTOs
// ============================================

export class ECEnrollmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  ecId: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  enrolledAt: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiProperty()
  overallProgress: number;

  // Nested data
  @ApiPropertyOptional()
  ec?: {
    code: string;
    title: string;
    description: string;
  };

  @ApiPropertyOptional()
  moduleProgress?: ModuleProgressResponseDto[];

  @ApiPropertyOptional()
  lessonProgress?: LessonProgressResponseDto[];
}

export class ModuleProgressResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  enrollmentId: string;

  @ApiProperty()
  moduleId: string;

  @ApiProperty()
  progress: number;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  startedAt?: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiPropertyOptional()
  module?: {
    code: string;
    title: string;
    estimatedMinutes: number;
  };
}

export class LessonProgressResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  enrollmentId: string;

  @ApiProperty()
  lessonId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  videoProgress: number;

  @ApiPropertyOptional()
  startedAt?: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiPropertyOptional()
  lesson?: {
    code: string;
    title: string;
    videoId?: string;
    estimatedMinutes: number;
  };
}

export class ProgressSummaryDto {
  @ApiProperty()
  enrollmentId: string;

  @ApiProperty()
  ecCode: string;

  @ApiProperty()
  overallProgress: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  modulesCompleted: number;

  @ApiProperty()
  modulesTotal: number;

  @ApiProperty()
  lessonsCompleted: number;

  @ApiProperty()
  lessonsTotal: number;

  @ApiProperty()
  videosWatched: number;

  @ApiProperty()
  videosTotal: number;

  @ApiProperty()
  assessmentsPassed: number;

  @ApiProperty()
  assessmentsTotal: number;

  @ApiProperty()
  documentsCompleted: number;

  @ApiProperty()
  documentsTotal: number;

  @ApiProperty()
  estimatedTimeRemaining: number; // minutes

  @ApiProperty()
  timeSpent: number; // minutes

  @ApiPropertyOptional()
  nextLesson?: {
    id: string;
    moduleId: string;
    title: string;
  };

  @ApiPropertyOptional()
  certificationReady: boolean;
}

export class LeaderboardEntryDto {
  @ApiProperty()
  rank: number;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  displayName: string;

  @ApiProperty()
  progress: number;

  @ApiProperty()
  modulesCompleted: number;

  @ApiPropertyOptional()
  avatarUrl?: string;
}
