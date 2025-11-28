import { MatchingHandler } from "./matching.handler";
import { Question } from "./question-handler.interface";

describe("MatchingHandler", () => {
  let handler: MatchingHandler;

  beforeEach(() => {
    handler = new MatchingHandler();
  });

  it("should have correct question type", () => {
    expect(handler.questionType).toBe("MATCHING");
  });

  describe("grade", () => {
    const mockQuestion: Question = {
      id: "q1",
      type: "MATCHING",
      questionData: {
        pairs: [
          { left: "Dog", right: "Bark" },
          { left: "Cat", right: "Meow" },
          { left: "Cow", right: "Moo" },
        ],
      },
      points: 15,
    };

    it("should return correct when all pairs matched", () => {
      const response = [
        { left: "Dog", right: "Bark" },
        { left: "Cat", right: "Meow" },
        { left: "Cow", right: "Moo" },
      ];
      const result = handler.grade(mockQuestion, response);
      expect(result.isCorrect).toBe(true);
      expect(result.earnedPoints).toBe(15);
      expect(result.feedback).toContain("3/3");
    });

    it("should return partial credit for some correct pairs", () => {
      const response = [
        { left: "Dog", right: "Bark" },
        { left: "Cat", right: "Moo" }, // wrong
        { left: "Cow", right: "Meow" }, // wrong
      ];
      const result = handler.grade(mockQuestion, response);
      expect(result.isCorrect).toBe(false);
      expect(result.earnedPoints).toBe(5); // 1/3 = ~33% of 15
      expect(result.feedback).toContain("1/3");
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

    it("should handle non-array response", () => {
      const result = handler.grade(mockQuestion, "invalid");
      expect(result.isCorrect).toBe(false);
      expect(result.earnedPoints).toBe(0);
    });

    it("should handle question with no pairs", () => {
      const noPairsQuestion: Question = {
        id: "q2",
        type: "MATCHING",
        questionData: {},
        points: 10,
      };
      const result = handler.grade(noPairsQuestion, []);
      expect(result.isCorrect).toBe(false);
      expect(result.earnedPoints).toBe(0);
    });

    it("should handle empty pairs array", () => {
      const emptyPairsQuestion: Question = {
        id: "q3",
        type: "MATCHING",
        questionData: { pairs: [] },
        points: 10,
      };
      const result = handler.grade(emptyPairsQuestion, []);
      expect(result.isCorrect).toBe(false);
      expect(result.earnedPoints).toBe(0);
    });
  });

  describe("validate", () => {
    it("should return true for valid pairs array", () => {
      expect(handler.validate({
        pairs: [{ left: "A", right: "1" }],
      })).toBe(true);
    });

    it("should return false for missing pairs", () => {
      expect(handler.validate({})).toBe(false);
    });

    it("should return false for empty pairs array", () => {
      expect(handler.validate({ pairs: [] })).toBe(false);
    });
  });
});
