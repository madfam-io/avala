import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsEnum,
  IsArray,
  IsObject,
  ValidateNested,
  Min,
  Max,
  IsUUID,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";

// ============================================
// QUESTION DTOs
// ============================================

export class QuestionOptionDto {
  @ApiProperty()
  @IsString()
  text: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;
}

export class QuestionDataDto {
  @ApiPropertyOptional({
    type: [QuestionOptionDto],
    description: "Options for multiple choice",
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[];

  @ApiPropertyOptional({
    description: "Correct answer index for multiple choice",
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  correctIndex?: number;

  @ApiPropertyOptional({ description: "Correct answer for true/false" })
  @IsOptional()
  @IsBoolean()
  correctAnswer?: boolean;

  @ApiPropertyOptional({ description: "Sample answer for short answer" })
  @IsOptional()
  @IsString()
  sampleAnswer?: string;

  @ApiPropertyOptional({
    type: [String],
    description: "Keywords for short answer validation",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @ApiPropertyOptional({ description: "Matching pairs" })
  @IsOptional()
  @IsArray()
  pairs?: { left: string; right: string }[];

  @ApiPropertyOptional({ description: "Rubric for essay questions" })
  @IsOptional()
  @IsArray()
  rubric?: { criterion: string; maxPoints: number }[];
}

export class CreateQuestionDto {
  @ApiProperty({
    enum: [
      "MULTIPLE_CHOICE",
      "TRUE_FALSE",
      "SHORT_ANSWER",
      "ESSAY",
      "MATCHING",
    ],
  })
  @IsEnum([
    "MULTIPLE_CHOICE",
    "TRUE_FALSE",
    "SHORT_ANSWER",
    "ESSAY",
    "MATCHING",
  ])
  type: string;

  @ApiProperty()
  @IsString()
  questionText: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  competency?: string;

  @ApiProperty({ type: QuestionDataDto })
  @ValidateNested()
  @Type(() => QuestionDataDto)
  questionData: QuestionDataDto;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}

// ============================================
// ASSESSMENT DTOs
// ============================================

export class CreateECAssessmentDto {
  @ApiProperty({ example: "fundamentals_quiz" })
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiPropertyOptional({ description: "Module ID (optional)" })
  @IsOptional()
  @IsUUID()
  moduleId?: string;

  @ApiPropertyOptional({
    enum: [
      "KNOWLEDGE_TEST",
      "COMPETENCY_ASSESSMENT",
      "PRACTICE_QUIZ",
      "DIAGNOSTIC",
      "FINAL_EXAM",
    ],
    default: "KNOWLEDGE_TEST",
  })
  @IsOptional()
  @IsEnum([
    "KNOWLEDGE_TEST",
    "COMPETENCY_ASSESSMENT",
    "PRACTICE_QUIZ",
    "DIAGNOSTIC",
    "FINAL_EXAM",
  ])
  category?: string;

  @ApiPropertyOptional({ description: "Time limit in seconds" })
  @IsOptional()
  @IsInt()
  @Min(60)
  timeLimit?: number;

  @ApiPropertyOptional({ default: 70 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @ApiPropertyOptional({ default: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  allowedAttempts?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  shuffleOptions?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  showResults?: boolean;

  @ApiPropertyOptional({ type: [CreateQuestionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions?: CreateQuestionDto[];
}

export class UpdateECAssessmentDto extends PartialType(CreateECAssessmentDto) {}

// ============================================
// SIMULATION DTOs
// ============================================

export class SimulationScenarioDto {
  @ApiProperty()
  @IsString()
  context: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  prompts?: { id: string; text: string; type: string }[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  resources?: Record<string, any>;
}

export class SimulationRubricItemDto {
  @ApiProperty()
  @IsString()
  criterion: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  maxPoints: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  indicators?: string[];
}

export class CreateECSimulationDto {
  @ApiProperty({ example: "training_simulation" })
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({
    enum: ["INTERVIEW", "PRESENTATION", "ROLE_PLAY", "CASE_STUDY"],
  })
  @IsEnum(["INTERVIEW", "PRESENTATION", "ROLE_PLAY", "CASE_STUDY"])
  type: string;

  @ApiProperty({ type: SimulationScenarioDto })
  @ValidateNested()
  @Type(() => SimulationScenarioDto)
  scenario: SimulationScenarioDto;

  @ApiPropertyOptional({ type: [SimulationRubricItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SimulationRubricItemDto)
  rubric?: SimulationRubricItemDto[];
}

export class UpdateECSimulationDto extends PartialType(CreateECSimulationDto) {}

// ============================================
// ATTEMPT DTOs
// ============================================

export class AnswerDto {
  @ApiProperty()
  @IsString()
  questionId: string;

  @ApiProperty({ description: "Answer value (type depends on question type)" })
  response: number | boolean | string | { left: string; right: string }[];
}

export class StartAttemptDto {
  // No additional fields needed, attempt is created from assessment/simulation ID
}

export class SubmitAnswerDto {
  @ApiProperty()
  @IsString()
  questionId: string;

  @ApiProperty()
  response: any;

  @ApiPropertyOptional({
    description: "Time spent on this question in seconds",
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  timeSpent?: number;
}

export class SubmitAttemptDto {
  @ApiProperty({ type: [AnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];

  @ApiPropertyOptional({ description: "Total time spent in seconds" })
  @IsOptional()
  @IsInt()
  @Min(0)
  timeSpent?: number;
}

export class SimulationResponseDto {
  @ApiProperty()
  @IsString()
  promptId: string;

  @ApiProperty()
  @IsString()
  response: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class SubmitSimulationDto {
  @ApiProperty({ type: [SimulationResponseDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SimulationResponseDto)
  responses: SimulationResponseDto[];
}

// ============================================
// RESPONSE DTOs
// ============================================

export class QuestionResponseDto {
  @ApiProperty()
  questionId: string;

  @ApiProperty()
  isCorrect: boolean;

  @ApiProperty()
  pointsEarned: number;

  @ApiProperty()
  maxPoints: number;

  @ApiPropertyOptional()
  explanation?: string;

  @ApiPropertyOptional()
  correctAnswer?: any;
}

export class AttemptResultDto {
  @ApiProperty()
  attemptId: string;

  @ApiProperty()
  assessmentId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  score: number;

  @ApiProperty()
  maxScore: number;

  @ApiProperty()
  percentage: number;

  @ApiProperty()
  passed: boolean;

  @ApiProperty()
  timeSpent: number;

  @ApiPropertyOptional({ type: [QuestionResponseDto] })
  questionResults?: QuestionResponseDto[];

  @ApiPropertyOptional()
  competencyResults?: Record<
    string,
    {
      points: number;
      maxPoints: number;
      percentage: number;
      passed: boolean;
    }
  >;

  @ApiProperty()
  completedAt: Date;
}

export class ECAssessmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ecId: string;

  @ApiPropertyOptional()
  moduleId?: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  titleEn?: string;

  @ApiProperty()
  category: string;

  @ApiPropertyOptional()
  timeLimit?: number;

  @ApiProperty()
  passingScore: number;

  @ApiProperty()
  allowedAttempts: number;

  @ApiProperty()
  shuffleQuestions: boolean;

  @ApiProperty()
  shuffleOptions: boolean;

  @ApiProperty()
  showResults: boolean;

  @ApiProperty()
  questionCount: number;

  @ApiProperty()
  totalPoints: number;

  @ApiPropertyOptional()
  module?: {
    code: string;
    title: string;
  };
}

export class ECSimulationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ecId: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  titleEn?: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  scenario: SimulationScenarioDto;

  @ApiProperty({ type: [SimulationRubricItemDto] })
  rubric: SimulationRubricItemDto[];
}

export class AssessmentAttemptResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  enrollmentId: string;

  @ApiProperty()
  assessmentId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  startedAt: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiPropertyOptional()
  timeSpent?: number;

  @ApiPropertyOptional()
  score?: number;

  @ApiPropertyOptional()
  passed?: boolean;

  @ApiPropertyOptional()
  assessment?: ECAssessmentResponseDto;
}

export class UserAssessmentSummaryDto {
  @ApiProperty()
  assessmentId: string;

  @ApiProperty()
  assessmentTitle: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  attemptCount: number;

  @ApiProperty()
  allowedAttempts: number;

  @ApiProperty()
  bestScore: number;

  @ApiProperty()
  passed: boolean;

  @ApiPropertyOptional()
  lastAttemptAt?: Date;
}
