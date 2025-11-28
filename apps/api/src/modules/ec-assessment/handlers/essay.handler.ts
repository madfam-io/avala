import { Injectable } from '@nestjs/common';
import {
  BaseQuestionHandler,
  Question,
  GradeResult,
} from './question-handler.interface';

@Injectable()
export class EssayHandler extends BaseQuestionHandler {
  readonly questionType = 'ESSAY';

  grade(_question: Question, response: unknown): GradeResult {
    if (response === undefined || response === null || response === '') {
      return this.noResponse();
    }

    // Essays require manual review - return pending state
    return {
      isCorrect: false,
      earnedPoints: 0,
      feedback: 'Essay requires manual review',
    };
  }

  /**
   * Manual grading for essays
   */
  manualGrade(
    question: Question,
    earnedPoints: number,
    feedback?: string,
  ): GradeResult {
    const maxPoints = this.getPoints(question);
    const clampedPoints = Math.min(Math.max(0, earnedPoints), maxPoints);

    return {
      isCorrect: clampedPoints >= maxPoints * 0.7,
      earnedPoints: clampedPoints,
      feedback,
    };
  }
}
