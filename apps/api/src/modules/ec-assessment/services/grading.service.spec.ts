import { Test, TestingModule } from "@nestjs/testing";
import { GradingService } from "./grading.service";
import {
  MultipleChoiceHandler,
  TrueFalseHandler,
  ShortAnswerHandler,
  MatchingHandler,
  EssayHandler,
} from "../handlers";

describe("GradingService", () => {
  let service: GradingService;

  const mockMultipleChoiceHandler = {
    grade: jest.fn(),
    validate: jest.fn(),
  };

  const mockTrueFalseHandler = {
    grade: jest.fn(),
    validate: jest.fn(),
  };

  const mockShortAnswerHandler = {
    grade: jest.fn(),
    validate: jest.fn(),
  };

  const mockMatchingHandler = {
    grade: jest.fn(),
    validate: jest.fn(),
  };

  const mockEssayHandler = {
    grade: jest.fn(),
    validate: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradingService,
        { provide: MultipleChoiceHandler, useValue: mockMultipleChoiceHandler },
        { provide: TrueFalseHandler, useValue: mockTrueFalseHandler },
        { provide: ShortAnswerHandler, useValue: mockShortAnswerHandler },
        { provide: MatchingHandler, useValue: mockMatchingHandler },
        { provide: EssayHandler, useValue: mockEssayHandler },
      ],
    }).compile();

    service = module.get<GradingService>(GradingService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("gradeAttempt", () => {
    it("should grade all questions and calculate totals", () => {
      const questions = [
        {
          id: "q1",
          type: "MULTIPLE_CHOICE",
          questionText: "Question 1?",
          points: 10,
          questionData: {},
        },
        {
          id: "q2",
          type: "TRUE_FALSE",
          questionText: "Question 2?",
          points: 10,
          questionData: {},
        },
      ];

      const responses = [
        { questionId: "q1", response: "A" },
        { questionId: "q2", response: true },
      ];

      mockMultipleChoiceHandler.grade.mockReturnValue({
        isCorrect: true,
        earnedPoints: 10,
      });
      mockTrueFalseHandler.grade.mockReturnValue({
        isCorrect: false,
        earnedPoints: 0,
      });

      const result = service.gradeAttempt(questions, responses, 70);

      expect(result.totalPoints).toBe(10);
      expect(result.maxPoints).toBe(20);
      expect(result.percentage).toBe(50);
      expect(result.passed).toBe(false);
      expect(result.questionResults).toHaveLength(2);
    });

    it("should handle missing responses", () => {
      const questions = [
        {
          id: "q1",
          type: "MULTIPLE_CHOICE",
          questionText: "Question?",
          points: 10,
          questionData: {},
        },
      ];

      mockMultipleChoiceHandler.grade.mockReturnValue({
        isCorrect: false,
        earnedPoints: 0,
      });

      const result = service.gradeAttempt(questions, [], 70);

      expect(result.totalPoints).toBe(0);
      expect(result.passed).toBe(false);
    });

    it("should pass when percentage meets threshold", () => {
      const questions = [
        {
          id: "q1",
          type: "MULTIPLE_CHOICE",
          questionText: "Question?",
          points: 10,
          questionData: {},
        },
      ];

      const responses = [{ questionId: "q1", response: "A" }];

      mockMultipleChoiceHandler.grade.mockReturnValue({
        isCorrect: true,
        earnedPoints: 10,
      });

      const result = service.gradeAttempt(questions, responses, 70);

      expect(result.percentage).toBe(100);
      expect(result.passed).toBe(true);
    });

    it("should use default points when not specified", () => {
      const questions = [
        {
          id: "q1",
          type: "MULTIPLE_CHOICE",
          questionText: "Question?",
          questionData: {},
        },
      ];

      mockMultipleChoiceHandler.grade.mockReturnValue({
        isCorrect: true,
        earnedPoints: 10,
      });

      const result = service.gradeAttempt(questions, [], 70);

      expect(result.maxPoints).toBe(10);
    });
  });

  describe("gradeQuestion", () => {
    it("should grade multiple choice question", () => {
      const question = {
        id: "q1",
        type: "MULTIPLE_CHOICE",
        questionData: {
          options: [
            { text: "A", isCorrect: true },
            { text: "B", isCorrect: false },
          ],
          correctIndex: 0,
        },
      };

      mockMultipleChoiceHandler.grade.mockReturnValue({
        isCorrect: true,
        earnedPoints: 10,
      });

      const result = service.gradeQuestion(question, "A");

      expect(mockMultipleChoiceHandler.grade).toHaveBeenCalledWith(
        question,
        "A",
      );
      expect(result.isCorrect).toBe(true);
    });

    it("should grade true/false question", () => {
      const question = {
        id: "q1",
        type: "TRUE_FALSE",
        questionData: { correctAnswer: true },
      };

      mockTrueFalseHandler.grade.mockReturnValue({
        isCorrect: true,
        earnedPoints: 10,
      });

      const result = service.gradeQuestion(question, true);

      expect(mockTrueFalseHandler.grade).toHaveBeenCalled();
      expect(result.isCorrect).toBe(true);
    });

    it("should grade short answer question", () => {
      const question = {
        id: "q1",
        type: "SHORT_ANSWER",
        questionData: { keywords: ["answer"] },
      };

      mockShortAnswerHandler.grade.mockReturnValue({
        isCorrect: true,
        earnedPoints: 10,
      });

      service.gradeQuestion(question, "answer");

      expect(mockShortAnswerHandler.grade).toHaveBeenCalled();
    });

    it("should grade matching question", () => {
      const question = {
        id: "q1",
        type: "MATCHING",
        questionData: { pairs: [{ left: "A", right: "1" }] },
      };

      mockMatchingHandler.grade.mockReturnValue({
        isCorrect: true,
        earnedPoints: 10,
      });

      service.gradeQuestion(question, {});

      expect(mockMatchingHandler.grade).toHaveBeenCalled();
    });

    it("should grade essay question", () => {
      const question = {
        id: "q1",
        type: "ESSAY",
        questionData: { sampleAnswer: "Sample answer text" },
      };

      mockEssayHandler.grade.mockReturnValue({
        isCorrect: false,
        earnedPoints: 0,
        feedback: "Pending review",
      });

      service.gradeQuestion(question, "My essay response");

      expect(mockEssayHandler.grade).toHaveBeenCalled();
    });

    it("should return zero for unknown question type", () => {
      const question = {
        id: "q1",
        type: "UNKNOWN_TYPE",
        questionText: "Test?",
        questionData: {},
      };

      const result = service.gradeQuestion(question, "answer");

      expect(result.isCorrect).toBe(false);
      expect(result.earnedPoints).toBe(0);
    });
  });

  describe("validateQuestion", () => {
    it("should validate multiple choice question", () => {
      const question = {
        id: "q1",
        type: "MULTIPLE_CHOICE",
        questionData: {
          options: [
            { text: "A", isCorrect: true },
            { text: "B", isCorrect: false },
          ],
          correctIndex: 0,
        },
      };

      mockMultipleChoiceHandler.validate.mockReturnValue(true);

      const result = service.validateQuestion(question);

      expect(result).toBe(true);
    });

    it("should return false for unknown type", () => {
      const question = {
        id: "q1",
        type: "UNKNOWN",
        questionData: {},
      };

      const result = service.validateQuestion(question);

      expect(result).toBe(false);
    });
  });

  describe("getSupportedQuestionTypes", () => {
    it("should return all supported types", () => {
      const types = service.getSupportedQuestionTypes();

      expect(types).toContain("MULTIPLE_CHOICE");
      expect(types).toContain("TRUE_FALSE");
      expect(types).toContain("SHORT_ANSWER");
      expect(types).toContain("MATCHING");
      expect(types).toContain("ESSAY");
    });
  });
});
