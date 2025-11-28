import { ShortAnswerHandler } from "./short-answer.handler";
import { Question } from "./question-handler.interface";

describe("ShortAnswerHandler", () => {
  let handler: ShortAnswerHandler;

  beforeEach(() => {
    handler = new ShortAnswerHandler();
  });

  it("should have correct question type", () => {
    expect(handler.questionType).toBe("SHORT_ANSWER");
  });

  describe("grade", () => {
    const mockQuestion: Question = {
      id: "q1",
      type: "SHORT_ANSWER",
      questionData: {
        keywords: ["photosynthesis", "sunlight", "carbon dioxide", "oxygen"],
      },
      points: 10,
    };

    it("should return correct when 70%+ keywords matched", () => {
      const result = handler.grade(
        mockQuestion,
        "Photosynthesis uses sunlight and carbon dioxide to produce oxygen"
      );
      expect(result.isCorrect).toBe(true);
      expect(result.earnedPoints).toBe(10);
      expect(result.feedback).toContain("4/4");
    });

    it("should return incorrect when less than 70% keywords matched", () => {
      const result = handler.grade(mockQuestion, "Plants make food with sunlight");
      expect(result.isCorrect).toBe(false);
      expect(result.earnedPoints).toBeLessThan(7);
    });

    it("should be case-insensitive", () => {
      const result = handler.grade(
        mockQuestion,
        "PHOTOSYNTHESIS SUNLIGHT CARBON DIOXIDE OXYGEN"
      );
      expect(result.isCorrect).toBe(true);
    });

    it("should handle null response", () => {
      const result = handler.grade(mockQuestion, null);
      expect(result.isCorrect).toBe(false);
      expect(result.earnedPoints).toBe(0);
    });

    it("should handle undefined response", () => {
      const result = handler.grade(mockQuestion, undefined);
      expect(result.isCorrect).toBe(false);
      expect(result.earnedPoints).toBe(0);
    });

    it("should handle question with no keywords", () => {
      const noKeywordsQuestion: Question = {
        id: "q2",
        type: "SHORT_ANSWER",
        questionData: {},
        points: 10,
      };
      const result = handler.grade(noKeywordsQuestion, "Some answer");
      expect(result.isCorrect).toBe(false);
      expect(result.feedback).toBe("No keywords configured for grading");
    });

    it("should calculate partial points correctly", () => {
      const result = handler.grade(mockQuestion, "Photosynthesis uses sunlight");
      // 2 of 4 keywords = 50% = 5 points
      expect(result.earnedPoints).toBe(5);
      expect(result.feedback).toContain("2/4");
    });
  });

  describe("validate", () => {
    it("should return true for valid keywords array", () => {
      expect(handler.validate({ keywords: ["a", "b"] })).toBe(true);
    });

    it("should return false for missing keywords", () => {
      expect(handler.validate({})).toBe(false);
    });

    it("should return false for empty keywords array", () => {
      expect(handler.validate({ keywords: [] })).toBe(false);
    });
  });
});
