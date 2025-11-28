import { Injectable } from "@nestjs/common";
import {
  QuestionHandler,
  Question,
  GradeResult,
  MultipleChoiceHandler,
  TrueFalseHandler,
  ShortAnswerHandler,
  MatchingHandler,
  EssayHandler,
} from "../handlers";

export interface QuestionResult {
  questionId: string;
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
  explanation?: string;
  feedback?: string;
}

export interface GradingResult {
  totalPoints: number;
  maxPoints: number;
  percentage: number;
  passed: boolean;
  questionResults: QuestionResult[];
}

@Injectable()
export class GradingService {
  private readonly handlers: Map<string, QuestionHandler>;

  constructor(
    multipleChoiceHandler: MultipleChoiceHandler,
    trueFalseHandler: TrueFalseHandler,
    shortAnswerHandler: ShortAnswerHandler,
    matchingHandler: MatchingHandler,
    essayHandler: EssayHandler,
  ) {
    this.handlers = new Map<string, QuestionHandler>();
    this.handlers.set("MULTIPLE_CHOICE", multipleChoiceHandler);
    this.handlers.set("TRUE_FALSE", trueFalseHandler);
    this.handlers.set("SHORT_ANSWER", shortAnswerHandler);
    this.handlers.set("MATCHING", matchingHandler);
    this.handlers.set("ESSAY", essayHandler);
  }

  gradeAttempt(
    questions: Question[],
    responses: Array<{ questionId: string; response: unknown }>,
    passingScore: number,
  ): GradingResult {
    let totalPoints = 0;
    let maxPoints = 0;
    const questionResults: QuestionResult[] = [];

    for (const question of questions) {
      const points = question.points || 10;
      maxPoints += points;

      const response = responses.find((r) => r.questionId === question.id);
      const result = this.gradeQuestion(question, response?.response);

      totalPoints += result.earnedPoints;
      questionResults.push({
        questionId: question.id,
        isCorrect: result.isCorrect,
        pointsEarned: result.earnedPoints,
        maxPoints: points,
        explanation: question.explanation,
        feedback: result.feedback,
      });
    }

    const percentage = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;

    return {
      totalPoints,
      maxPoints,
      percentage,
      passed: percentage >= passingScore,
      questionResults,
    };
  }

  gradeQuestion(question: Question, response: unknown): GradeResult {
    const handler = this.handlers.get(question.type);

    if (!handler) {
      return { isCorrect: false, earnedPoints: 0 };
    }

    return handler.grade(question, response);
  }

  validateQuestion(question: Question): boolean {
    const handler = this.handlers.get(question.type);

    if (!handler) {
      return false;
    }

    return handler.validate(question.questionData);
  }

  getSupportedQuestionTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}
