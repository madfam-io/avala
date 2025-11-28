import { Test, TestingModule } from "@nestjs/testing";
import { QuizController } from "./quiz.controller";
import { QuizService } from "./quiz.service";

describe("QuizController", () => {
  let controller: QuizController;
  let quizService: jest.Mocked<QuizService>;

  const mockQuizService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByCode: jest.fn(),
    startAttempt: jest.fn(),
    submitAttempt: jest.fn(),
    getUserAttempts: jest.fn(),
    getAttemptDetails: jest.fn(),
  };

  const mockReq = {
    user: { tenantId: "tenant-1", id: "user-1", userId: "user-1" },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuizController],
      providers: [{ provide: QuizService, useValue: mockQuizService }],
    }).compile();

    controller = module.get<QuizController>(QuizController);
    quizService = module.get(QuizService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should return all quizzes for tenant", async () => {
      quizService.findAll.mockResolvedValue([]);
      await controller.findAll(mockReq);
      expect(quizService.findAll).toHaveBeenCalledWith("tenant-1");
    });
  });

  describe("findOne", () => {
    it("should find quiz by id", async () => {
      quizService.findOne.mockResolvedValue({} as any);
      await controller.findOne("quiz-1", mockReq);
      expect(quizService.findOne).toHaveBeenCalledWith("quiz-1", "tenant-1");
    });
  });

  describe("findByCode", () => {
    it("should find quiz by code", async () => {
      quizService.findByCode.mockResolvedValue({} as any);
      await controller.findByCode("QUIZ001", mockReq);
      expect(quizService.findByCode).toHaveBeenCalledWith(
        "QUIZ001",
        "tenant-1",
      );
    });
  });

  describe("startAttempt", () => {
    it("should start a quiz attempt", async () => {
      quizService.startAttempt.mockResolvedValue({} as any);
      await controller.startAttempt("quiz-1", mockReq);
      expect(quizService.startAttempt).toHaveBeenCalledWith(
        "quiz-1",
        "user-1",
        "tenant-1",
      );
    });
  });

  describe("submitAttempt", () => {
    it("should submit quiz attempt", async () => {
      const submitDto = {
        quizId: "quiz-1",
        answers: [{ questionId: "q1", selectedOptionId: "opt1" }],
        totalTimeSpent: 120,
      };
      quizService.submitAttempt.mockResolvedValue({} as any);
      await controller.submitAttempt("attempt-1", submitDto as any, mockReq);
      expect(quizService.submitAttempt).toHaveBeenCalledWith(
        "attempt-1",
        {
          quizId: "quiz-1",
          answers: submitDto.answers,
          totalTimeSpent: 120,
        },
        "user-1",
      );
    });
  });

  describe("getUserAttempts", () => {
    it("should get user attempts for quiz", async () => {
      quizService.getUserAttempts.mockResolvedValue([]);
      await controller.getUserAttempts("quiz-1", mockReq);
      expect(quizService.getUserAttempts).toHaveBeenCalledWith(
        "quiz-1",
        "user-1",
      );
    });
  });

  describe("getAttemptDetails", () => {
    it("should get attempt details", async () => {
      quizService.getAttemptDetails.mockResolvedValue({} as any);
      await controller.getAttemptDetails("attempt-1", mockReq);
      expect(quizService.getAttemptDetails).toHaveBeenCalledWith(
        "attempt-1",
        "user-1",
      );
    });
  });
});
