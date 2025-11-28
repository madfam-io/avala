import { Injectable } from '@nestjs/common';
import {
  BaseQuestionHandler,
  Question,
  GradeResult,
  QuestionData,
} from './question-handler.interface';

interface MatchingPair {
  left: string;
  right: string;
}

@Injectable()
export class MatchingHandler extends BaseQuestionHandler {
  readonly questionType = 'MATCHING';

  grade(question: Question, response: unknown): GradeResult {
    if (response === undefined || response === null) {
      return this.noResponse();
    }

    const points = this.getPoints(question);
    const pairs = question.questionData.pairs || [];

    if (pairs.length === 0) {
      return this.noResponse();
    }

    const responsePairs = response as MatchingPair[];
    if (!Array.isArray(responsePairs)) {
      return this.noResponse();
    }

    let correctCount = 0;
    for (const pair of pairs) {
      const match = responsePairs.find(
        (r) => r.left === pair.left && r.right === pair.right,
      );
      if (match) correctCount++;
    }

    const score = correctCount / pairs.length;
    const isCorrect = score === 1;

    return {
      isCorrect,
      earnedPoints: Math.round(points * score),
      feedback: `Matched ${correctCount}/${pairs.length} pairs correctly`,
    };
  }

  validate(questionData: QuestionData): boolean {
    return Array.isArray(questionData.pairs) && questionData.pairs.length > 0;
  }
}
