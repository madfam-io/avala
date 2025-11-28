/**
 * Shared Quiz Types
 * Unified type definitions for quiz components
 */

export type QuestionType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "SHORT_ANSWER"
  | "ESSAY"
  | "MATCHING"
  | "single"
  | "multiple"
  | "open";

export interface QuestionOption {
  id: string;
  text: string;
}

export interface BaseQuestion {
  id: string;
  points: number;
}

export interface StandardQuestion extends BaseQuestion {
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY" | "MATCHING";
  questionText: string;
  orderIndex: number;
  questionData: {
    options?: string[];
    leftItems?: string[];
    rightItems?: string[];
    maxLength?: number;
    minWords?: number;
    maxWords?: number;
  };
}

export interface ECQuestion extends BaseQuestion {
  type: "single" | "multiple" | "open";
  text: string;
  options?: QuestionOption[];
}

export type Question = StandardQuestion | ECQuestion;

export interface QuizData {
  id: string;
  title: string;
  description: string | null;
  timeLimit: number | null;
  passingScore: number;
  questions: StandardQuestion[];
}

export interface QuizConfig {
  id: string;
  title: string;
  description?: string | null;
  timeLimit: number | null;
  passingScore?: number;
}

export type AnswerValue = string | string[] | Record<string, string>;

export interface QuestionAnswer {
  questionId: string;
  answer: AnswerValue;
  timeSpent?: number;
}

export interface QuizResult {
  score: number;
  passed: boolean;
  totalPoints: number;
  correctAnswers?: number;
  totalQuestions: number;
}

export type QuestionStatus = "unanswered" | "answered" | "flagged";

// Type guards
export function isStandardQuestion(q: Question): q is StandardQuestion {
  return "questionText" in q && "questionData" in q;
}

export function isECQuestion(q: Question): q is ECQuestion {
  return "text" in q && !("questionText" in q);
}

export function getQuestionText(q: Question): string {
  return isStandardQuestion(q) ? q.questionText : q.text;
}

export function getQuestionOptions(q: Question): string[] | QuestionOption[] | undefined {
  if (isStandardQuestion(q)) {
    return q.questionData.options;
  }
  return q.options;
}
