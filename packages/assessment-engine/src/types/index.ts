/**
 * @avala/assessment-engine types
 *
 * Type definitions for EC-aligned competency assessments
 */

import { z } from 'zod';

// ============================================
// Question Types
// ============================================

export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'short_answer'
  | 'essay'
  | 'matching'
  | 'ordering'
  | 'fill_blank'
  | 'hotspot'
  | 'drag_drop';

// Base question schema
export const BaseQuestionSchema = z.object({
  id: z.string().uuid(),
  type: z.enum([
    'multiple_choice',
    'true_false',
    'short_answer',
    'essay',
    'matching',
    'ordering',
    'fill_blank',
    'hotspot',
    'drag_drop',
  ]),
  question: z.string().min(1),
  points: z.number().positive().default(10),
  explanation: z.string().optional(),
  hint: z.string().optional(),
  tags: z.array(z.string()).default([]),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  // EC alignment
  ecCode: z.string().optional(), // e.g., "EC0217.01"
  criterionCode: z.string().optional(), // e.g., "D1", "C2", "P3"
  criterionType: z.enum(['DESEMPENO', 'CONOCIMIENTO', 'PRODUCTO', 'ACTITUD']).optional(),
  elementIndex: z.number().optional(),
  // Metadata
  timeLimit: z.number().positive().optional(), // seconds
  required: z.boolean().default(true),
  randomizeOptions: z.boolean().default(true),
});

export type BaseQuestion = z.infer<typeof BaseQuestionSchema>;

// Multiple Choice Question
export const MultipleChoiceQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('multiple_choice'),
  options: z.array(z.string()).min(2),
  correct: z.number().min(0), // Index of correct option
  multiSelect: z.boolean().default(false),
  correctMultiple: z.array(z.number()).optional(), // For multi-select
});

export type MultipleChoiceQuestion = z.infer<typeof MultipleChoiceQuestionSchema>;

// True/False Question
export const TrueFalseQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('true_false'),
  correct: z.boolean(),
});

export type TrueFalseQuestion = z.infer<typeof TrueFalseQuestionSchema>;

// Short Answer Question
export const ShortAnswerQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('short_answer'),
  sampleAnswer: z.string().min(1),
  keywords: z.array(z.string()).default([]),
  minLength: z.number().positive().optional(),
  maxLength: z.number().positive().optional(),
  caseSensitive: z.boolean().default(false),
  exactMatch: z.boolean().default(false),
});

export type ShortAnswerQuestion = z.infer<typeof ShortAnswerQuestionSchema>;

// Essay Question
export const EssayQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('essay'),
  rubric: z.array(
    z.object({
      criterion: z.string(),
      description: z.string(),
      maxPoints: z.number().positive(),
      levels: z.array(
        z.object({
          score: z.number(),
          description: z.string(),
        })
      ),
    })
  ),
  minWords: z.number().positive().optional(),
  maxWords: z.number().positive().optional(),
  sampleAnswer: z.string().optional(),
});

export type EssayQuestion = z.infer<typeof EssayQuestionSchema>;

// Matching Question
export const MatchingQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('matching'),
  pairs: z.array(
    z.object({
      left: z.string(),
      right: z.string(),
    })
  ).min(2),
  shuffleRight: z.boolean().default(true),
});

export type MatchingQuestion = z.infer<typeof MatchingQuestionSchema>;

// Ordering Question
export const OrderingQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('ordering'),
  items: z.array(z.string()).min(2),
  correctOrder: z.array(z.number()), // Indices in correct order
});

export type OrderingQuestion = z.infer<typeof OrderingQuestionSchema>;

// Fill in the Blank Question
export const FillBlankQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('fill_blank'),
  template: z.string(), // Text with {{blank}} placeholders
  blanks: z.array(
    z.object({
      id: z.string(),
      acceptedAnswers: z.array(z.string()),
      caseSensitive: z.boolean().default(false),
    })
  ),
});

export type FillBlankQuestion = z.infer<typeof FillBlankQuestionSchema>;

// Union of all question types
export const QuestionSchema = z.discriminatedUnion('type', [
  MultipleChoiceQuestionSchema,
  TrueFalseQuestionSchema,
  ShortAnswerQuestionSchema,
  EssayQuestionSchema,
  MatchingQuestionSchema,
  OrderingQuestionSchema,
  FillBlankQuestionSchema,
]);

export type Question = z.infer<typeof QuestionSchema>;

// ============================================
// Assessment Types
// ============================================

export type AssessmentType =
  | 'quiz'
  | 'exam'
  | 'diagnostic'
  | 'practice'
  | 'certification';

export const AssessmentSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  courseId: z.string().uuid().optional(),

  // Basic info
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['quiz', 'exam', 'diagnostic', 'practice', 'certification']),

  // Questions
  questions: z.array(QuestionSchema),

  // Configuration
  timeLimit: z.number().positive().optional(), // Total time in seconds
  passingScore: z.number().min(0).max(100).default(70),
  allowedAttempts: z.number().positive().default(3),
  shuffleQuestions: z.boolean().default(true),
  shuffleOptions: z.boolean().default(true),
  showCorrectAnswers: z.boolean().default(true),
  showExplanations: z.boolean().default(true),

  // Scoring
  scoringMethod: z.enum(['standard', 'weighted', 'competency', 'adaptive']).default('standard'),
  weights: z.record(z.string(), z.number()).optional(),

  // EC alignment
  ecCodes: z.array(z.string()).default([]),
  elementIndices: z.array(z.number()).default([]),

  // Status
  status: z.enum(['draft', 'published', 'archived']).default('draft'),

  // Metadata
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().uuid(),
});

export type Assessment = z.infer<typeof AssessmentSchema>;

// ============================================
// Session & Response Types
// ============================================

export const AssessmentSessionSchema = z.object({
  id: z.string(),
  assessmentId: z.string().uuid(),
  userId: z.string().uuid(),

  // State
  status: z.enum(['in_progress', 'paused', 'completed', 'expired', 'abandoned']),
  currentQuestionIndex: z.number().min(0),

  // Questions (may be shuffled)
  questionOrder: z.array(z.string()), // Question IDs in presentation order

  // Timing
  startedAt: z.date(),
  pausedAt: z.date().optional(),
  completedAt: z.date().optional(),
  timeRemaining: z.number().optional(), // seconds

  // Responses
  responses: z.map(z.string(), z.any()), // questionId -> response
});

export type AssessmentSession = z.infer<typeof AssessmentSessionSchema>;

export interface QuestionResponse {
  questionId: string;
  answer: unknown;
  timestamp: Date;
  timeSpent: number; // seconds
}

// ============================================
// Scoring Types
// ============================================

export interface QuestionResult {
  questionId: string;
  isCorrect: boolean;
  points: number;
  maxPoints: number;
  feedback?: string;
  correctAnswer?: unknown;
  userAnswer: unknown;
  requiresManualReview?: boolean;
  partialCredit?: number;
}

export interface CompetencyResult {
  competency: string;
  ecCode?: string;
  criterionType?: string;
  points: number;
  maxPoints: number;
  percentage: number;
  passed: boolean;
  questionResults: QuestionResult[];
}

export interface ScoreResult {
  // Totals
  totalPoints: number;
  maxPoints: number;
  percentage: number;

  // Counts
  correctAnswers: number;
  totalQuestions: number;

  // Pass/fail
  passed: boolean;
  passingScore: number;

  // Details
  questionResults: QuestionResult[];
  competencyResults?: Record<string, CompetencyResult>;

  // Extras
  gradeLetter: string;
  timeBonus?: number;
  finalScore: number;
  scoringMethod: string;

  // Manual review
  requiresManualReview: boolean;
  manualReviewQuestions: string[];
}

export interface ScoringOptions {
  method?: 'standard' | 'weighted' | 'competency' | 'adaptive';
  weights?: Record<string, number>;
  competencyThreshold?: number;
  timeSpent?: number;
  includeTimeBonus?: boolean;
}

// ============================================
// Evaluation Types (for manual review)
// ============================================

export interface EvaluationRubric {
  criterion: string;
  description: string;
  maxPoints: number;
  levels: {
    score: number;
    description: string;
  }[];
}

export interface ManualEvaluation {
  questionId: string;
  evaluatorId: string;
  score: number;
  maxScore: number;
  feedback: string;
  rubricScores?: Record<string, number>;
  evaluatedAt: Date;
}

// ============================================
// Report Types
// ============================================

export interface PerformanceReport {
  summary: {
    score: number;
    grade: string;
    passed: boolean;
    totalQuestions: number;
    correctAnswers: number;
  };
  performance: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  details: QuestionResult[];
  competencyAnalysis?: Record<string, CompetencyResult>;
  timeAnalysis?: {
    totalTime: number;
    averageTimePerQuestion: number;
    fastestQuestion: string;
    slowestQuestion: string;
  };
}

// ============================================
// Question Bank Types
// ============================================

export interface QuestionBank {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  questions: Question[];
  tags: string[];
  ecCodes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionFilter {
  type?: QuestionType | QuestionType[];
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  ecCode?: string;
  criterionType?: 'DESEMPENO' | 'CONOCIMIENTO' | 'PRODUCTO' | 'ACTITUD';
  elementIndex?: number;
}
