import { TrueFalseHandler } from "./true-false.handler";
import { Question } from "./question-handler.interface";

describe("TrueFalseHandler", () => {
  let handler: TrueFalseHandler;

  beforeEach(() => {
    handler = new TrueFalseHandler();
  });

  it("should have correct question type", () => {
    expect(handler.questionType).toBe("TRUE_FALSE");
  });

  describe("grade", () => {
    const trueQuestion: Question = {
      id: "q1",
      type: "TRUE_FALSE",
      questionData: { correctAnswer: true },
      points: 5,
    };

    const falseQuestion: Question = {
      id: "q2",
      type: "TRUE_FALSE",
      questionData: { correctAnswer: false },
      points: 10,
    };

    it("should return correct when answer matches (true)", () => {
      const result = handler.grade(trueQuestion, true);
      expect(result.isCorrect).toBe(true);
      expect(result.earnedPoints).toBe(5);
    });

    it("should return correct when answer matches (false)", () => {
      const result = handler.grade(falseQuestion, false);
      expect(result.isCorrect).toBe(true);
      expect(result.earnedPoints).toBe(10);
    });

    it("should return incorrect when answer does not match", () => {
      const result = handler.grade(trueQuestion, false);
      expect(result.isCorrect).toBe(false);
      expect(result.earnedPoints).toBe(0);
    });

    it("should handle null response", () => {
      const result = handler.grade(trueQuestion, null);
      expect(result.isCorrect).toBe(false);
      expect(result.earnedPoints).toBe(0);
    });

    it("should handle undefined response", () => {
      const result = handler.grade(trueQuestion, undefined);
      expect(result.isCorrect).toBe(false);
      expect(result.earnedPoints).toBe(0);
    });

    it("should use default points when not specified", () => {
      const questionWithoutPoints: Question = {
        id: "q3",
        type: "TRUE_FALSE",
        questionData: { correctAnswer: true },
      };
      const result = handler.grade(questionWithoutPoints, true);
      expect(result.earnedPoints).toBe(10); // default
    });
  });

  describe("validate", () => {
    it("should return true when correctAnswer is defined", () => {
      expect(handler.validate({ correctAnswer: true })).toBe(true);
      expect(handler.validate({ correctAnswer: false })).toBe(true);
    });

    it("should return false when correctAnswer is undefined", () => {
      expect(handler.validate({})).toBe(false);
    });
  });
});
