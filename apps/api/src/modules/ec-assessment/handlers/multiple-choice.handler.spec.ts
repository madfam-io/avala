import { MultipleChoiceHandler } from "./multiple-choice.handler";
import { Question } from "./question-handler.interface";

describe("MultipleChoiceHandler", () => {
  let handler: MultipleChoiceHandler;

  beforeEach(() => {
    handler = new MultipleChoiceHandler();
  });

  it("should have correct question type", () => {
    expect(handler.questionType).toBe("MULTIPLE_CHOICE");
  });

  describe("grade", () => {
    const mockQuestion: Question = {
      id: "q1",
      type: "MULTIPLE_CHOICE",
      questionData: {
        options: [
          { text: "Option A", isCorrect: false },
          { text: "Option B", isCorrect: true },
          { text: "Option C", isCorrect: false },
        ],
        correctIndex: 1,
      },
      points: 10,
    };

    it("should return correct when answer matches correctIndex", () => {
      const result = handler.grade(mockQuestion, 1);
      expect(result.isCorrect).toBe(true);
      expect(result.earnedPoints).toBe(10);
    });

    it("should return incorrect when answer does not match", () => {
      const result = handler.grade(mockQuestion, 0);
      expect(result.isCorrect).toBe(false);
      expect(result.earnedPoints).toBe(0);
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

    it("should use option isCorrect flag as fallback", () => {
      const questionWithoutIndex: Question = {
        id: "q2",
        type: "MULTIPLE_CHOICE",
        questionData: {
          options: [
            { text: "Option A", isCorrect: false },
            { text: "Option B", isCorrect: true },
          ],
        },
        points: 5,
      };
      const result = handler.grade(questionWithoutIndex, 1);
      expect(result.isCorrect).toBe(true);
      expect(result.earnedPoints).toBe(5);
    });

    it("should use default points when not specified", () => {
      const questionWithoutPoints: Question = {
        id: "q3",
        type: "MULTIPLE_CHOICE",
        questionData: { options: [{ text: "A", isCorrect: true }], correctIndex: 0 },
      };
      const result = handler.grade(questionWithoutPoints, 0);
      expect(result.earnedPoints).toBe(10); // default
    });
  });

  describe("validate", () => {
    it("should return true for valid question with correctIndex", () => {
      const result = handler.validate({
        options: [{ text: "A" }, { text: "B" }],
        correctIndex: 0,
      });
      expect(result).toBe(true);
    });

    it("should return true for valid question with isCorrect flag", () => {
      const result = handler.validate({
        options: [{ text: "A", isCorrect: false }, { text: "B", isCorrect: true }],
      });
      expect(result).toBe(true);
    });

    it("should return false for missing options", () => {
      const result = handler.validate({});
      expect(result).toBe(false);
    });

    it("should return false for less than 2 options", () => {
      const result = handler.validate({ options: [{ text: "A" }] });
      expect(result).toBe(false);
    });

    it("should return false when no correct answer defined", () => {
      const result = handler.validate({
        options: [{ text: "A", isCorrect: false }, { text: "B", isCorrect: false }],
      });
      expect(result).toBe(false);
    });
  });
});
