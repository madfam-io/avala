import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  IsObject,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";

/**
 * Simulation types
 */
export enum SimulationType {
  INTERVIEW = "INTERVIEW",
  PRESENTATION = "PRESENTATION",
  ROLE_PLAY = "ROLE_PLAY",
}

/**
 * Simulation difficulty levels
 */
export enum SimulationDifficulty {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
}

/**
 * Session status
 */
export enum SessionStatus {
  IN_PROGRESS = "IN_PROGRESS",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  ABANDONED = "ABANDONED",
}

/**
 * Action types during simulation
 */
export enum ActionType {
  SPEAK = "speak",
  TAKE_NOTES = "take_notes",
  PRESENT = "present",
  ASK_QUESTION = "ask_question",
  RESPOND = "respond",
  USE_VISUAL = "use_visual",
  DEMONSTRATE = "demonstrate",
}

// ============================================
// SCENARIO DTOs
// ============================================

export class CreateScenarioDto {
  @IsString()
  ecStandardId: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  titleEn?: string;

  @IsString()
  description: string;

  @IsEnum(SimulationType)
  type: SimulationType;

  @IsOptional()
  @IsObject()
  scenario?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  rubric?: Array<Record<string, unknown>>;
}

export class UpdateScenarioDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  titleEn?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(SimulationType)
  type?: SimulationType;

  @IsOptional()
  @IsObject()
  scenario?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  rubric?: Array<Record<string, unknown>>;
}

export class ScenarioQueryDto {
  @IsOptional()
  @IsString()
  ecStandardId?: string;

  @IsOptional()
  @IsEnum(SimulationType)
  type?: SimulationType;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  skip?: number = 0;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

// ============================================
// SESSION DTOs
// ============================================

export class StartSessionDto {
  @IsString()
  simulationId: string;

  @IsString()
  enrollmentId: string;
}

export class SubmitActionDto {
  @IsEnum(ActionType)
  type: ActionType;

  @IsString()
  content: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

// ============================================
// RESULT DTOs
// ============================================

export class SessionResultDto {
  sessionId: string;
  simulationId: string;
  status: SessionStatus;
  completedAt: Date;
  duration: number;
  overallScore: number;
  passed: boolean;
  criteriaScores: Record<string, number>;
  feedback: Record<string, unknown>;
  recommendations: Array<{
    area: string;
    priority: string;
    suggestion: string;
  }>;
}
