import { Injectable } from '@nestjs/common';
import {
  BaseQuestionHandler,
  Question,
  GradeResult,
  QuestionData,
} from './question-handler.interface';

@Injectable()
export class TrueFalseHandler extends BaseQuestionHandler {
  readonly questionType = 'TRUE_FALSE';

  grade(question: Question, response: unknown): GradeResult {
    if (response === undefined || response === null) {
      return this.noResponse();
    }

    const points = this.getPoints(question);
    const isCorrect = question.questionData.correctAnswer === response;

    return {
      isCorrect,
      earnedPoints: isCorrect ? points : 0,
    };
  }

  validate(questionData: QuestionData): boolean {
    return questionData.correctAnswer !== undefined;
  }
}
