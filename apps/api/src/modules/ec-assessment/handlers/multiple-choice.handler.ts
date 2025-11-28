import { Injectable } from '@nestjs/common';
import {
  BaseQuestionHandler,
  Question,
  GradeResult,
  QuestionData,
} from './question-handler.interface';

@Injectable()
export class MultipleChoiceHandler extends BaseQuestionHandler {
  readonly questionType = 'MULTIPLE_CHOICE';

  grade(question: Question, response: unknown): GradeResult {
    if (response === undefined || response === null) {
      return this.noResponse();
    }

    const points = this.getPoints(question);
    const { questionData } = question;

    const isCorrect =
      questionData.correctIndex === response ||
      questionData.options?.[response as number]?.isCorrect === true;

    return {
      isCorrect,
      earnedPoints: isCorrect ? points : 0,
    };
  }

  validate(questionData: QuestionData): boolean {
    if (!questionData.options || questionData.options.length < 2) {
      return false;
    }

    const hasCorrectAnswer =
      questionData.correctIndex !== undefined ||
      questionData.options.some((opt) => opt.isCorrect);

    return hasCorrectAnswer;
  }
}
