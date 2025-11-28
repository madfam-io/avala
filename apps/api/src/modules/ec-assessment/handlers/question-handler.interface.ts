export interface QuestionData {
  options?: { text: string; isCorrect?: boolean }[];
  correctIndex?: number;
  correctAnswer?: boolean;
  sampleAnswer?: string;
  keywords?: string[];
  pairs?: { left: string; right: string }[];
}

export interface Question {
  id: string;
  type: string;
  questionData: QuestionData;
  points?: number;
  explanation?: string;
}

export interface GradeResult {
  isCorrect: boolean;
  earnedPoints: number;
  feedback?: string;
}

export interface QuestionHandler {
  readonly questionType: string;
  grade(question: Question, response: unknown): GradeResult;
  validate(questionData: QuestionData): boolean;
}

export abstract class BaseQuestionHandler implements QuestionHandler {
  abstract readonly questionType: string;
  abstract grade(question: Question, response: unknown): GradeResult;

  validate(_questionData: QuestionData): boolean {
    return true;
  }

  protected getPoints(question: Question): number {
    return question.points || 10;
  }

  protected noResponse(): GradeResult {
    return { isCorrect: false, earnedPoints: 0 };
  }
}
