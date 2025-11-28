import { EssayHandler } from "./essay.handler";
import { Question } from "./question-handler.interface";

describe("EssayHandler", () => {
  let handler: EssayHandler;

  beforeEach(() => {
    handler = new EssayHandler();
  });

  it("should have correct question type", () => {
    expect(handler.questionType).toBe("ESSAY");
  });

  describe("grade", () => {
    const mockQuestion: Question = {
      id: "q1",
      type: "ESSAY",
      questionData: { sampleAnswer: "Sample answer text" },
      points: 20,
    };

    it("should return pending state for valid response", () => {
      const result = handler.grade(mockQuestion, "My essay response");
      expect(result.isCorrect).toBe(false);
      expect(result.earnedPoints).toBe(0);
      expect(result.feedback).toBe("Essay requires manual review");
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

    it("should handle empty string response", () => {
      const result = handler.grade(mockQuestion, "");
      expect(result.isCorrect).toBe(false);
      expect(result.earnedPoints).toBe(0);
    });
  });

  describe("manualGrade", () => {
    const mockQuestion: Question = {
      id: "q1",
      type: "ESSAY",
      questionData: {},
      points: 20,
    };

    it("should return correct when earning 70%+ of points", () => {
      const result = handler.manualGrade(mockQuestion, 15, "Good work");
      expect(result.isCorrect).toBe(true);
      expect(result.earnedPoints).toBe(15);
      expect(result.feedback).toBe("Good work");
    });

    it("should return incorrect when earning less than 70%", () => {
      const result = handler.manualGrade(mockQuestion, 10);
      expect(result.isCorrect).toBe(false);
      expect(result.earnedPoints).toBe(10);
    });

    it("should clamp points to max", () => {
      const result = handler.manualGrade(mockQuestion, 30);
      expect(result.earnedPoints).toBe(20); // clamped to max
    });

    it("should clamp negative points to zero", () => {
      const result = handler.manualGrade(mockQuestion, -5);
      expect(result.earnedPoints).toBe(0);
    });

    it("should use default points when not specified", () => {
      const questionWithoutPoints: Question = {
        id: "q2",
        type: "ESSAY",
        questionData: {},
      };
      const result = handler.manualGrade(questionWithoutPoints, 15);
      expect(result.earnedPoints).toBe(10); // clamped to default max of 10
    });
  });
});
