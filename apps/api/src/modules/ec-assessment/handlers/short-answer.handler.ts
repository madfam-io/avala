import { Injectable } from '@nestjs/common';
import {
  BaseQuestionHandler,
  Question,
  GradeResult,
  QuestionData,
} from './question-handler.interface';

@Injectable()
export class ShortAnswerHandler extends BaseQuestionHandler {
  readonly questionType = 'SHORT_ANSWER';

  private readonly passingThreshold = 0.7;

  grade(question: Question, response: unknown): GradeResult {
    if (response === undefined || response === null) {
      return this.noResponse();
    }

    const points = this.getPoints(question);
    const keywords = question.questionData.keywords || [];

    if (keywords.length === 0) {
      return {
        isCorrect: false,
        earnedPoints: 0,
        feedback: 'No keywords configured for grading',
      };
    }

    const responseText = String(response).toLowerCase();
    const matchedKeywords = keywords.filter((kw) =>
      responseText.includes(kw.toLowerCase()),
    );

    const score = matchedKeywords.length / keywords.length;
    const isCorrect = score >= this.passingThreshold;

    return {
      isCorrect,
      earnedPoints: Math.round(points * score),
      feedback: `Matched ${matchedKeywords.length}/${keywords.length} keywords`,
    };
  }

  validate(questionData: QuestionData): boolean {
    return (
      Array.isArray(questionData.keywords) && questionData.keywords.length > 0
    );
  }
}
