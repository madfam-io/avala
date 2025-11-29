import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { QuizService } from "./quiz.service";
import { PrismaService } from "../../database/prisma.service";
import { QuizAttemptStatus, QuestionType } from "@avala/db";

describe("QuizService", () => {
  let service: QuizService;

  const mockTenantId = "tenant-123";
  const mockUserId = "user-456";
  const mockQuizId = "quiz-789";
  const mockAttemptId = "attempt-101";

  const mockQuiz = {
    id: mockQuizId,
    title: "Test Quiz",
    code: "QUIZ-001",
    tenantId: mockTenantId,
    passingScore: 70,
    allowedAttempts: 3,
    timeLimit: 60,
    questions: [
      {
        id: "question-1",
        type: QuestionType.MULTIPLE_CHOICE,
        questionText: "What is 2+2?",
        points: 10,
        orderIndex: 0,
        questionData: { options: ["3", "4", "5"], correctAnswer: "4" },
        explanation: "Basic math",
      },
      {
        id: "question-2",
        type: QuestionType.TRUE_FALSE,
        questionText: "The sky is blue.",
        points: 10,
        orderIndex: 1,
        questionData: { correctAnswer: "true" },
        explanation: "Fact check",
      },
    ],
  };

  const mockAttempt = {
    id: mockAttemptId,
    quizId: mockQuizId,
    userId: mockUserId,
    tenantId: mockTenantId,
    status: QuizAttemptStatus.IN_PROGRESS,
    startedAt: new Date(),
    completedAt: null,
    quiz: mockQuiz,
  };

  const mockPrisma = {
    quiz: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    quizAttempt: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    questionResponse: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<QuizService>(QuizService);
  });

  describe("findAll", () => {
    it("should return all quizzes for a tenant with pagination", async () => {
      const mockQuizzes = [mockQuiz];
      mockPrisma.quiz.findMany.mockResolvedValue(mockQuizzes);
      mockPrisma.quiz.count.mockResolvedValue(1);

      const result = await service.findAll(mockTenantId, {
        page: 1,
        limit: 20,
      });

      expect(result.items).toEqual(mockQuizzes);
      expect(result.meta.total).toBe(1);
    });
  });

  describe("findOne", () => {
    it("should return quiz by ID with sanitized questions", async () => {
      mockPrisma.quiz.findFirst.mockResolvedValue(mockQuiz);

      const result = await service.findOne(mockQuizId, mockTenantId);

      expect(result.id).toBe(mockQuizId);
      // Verify correct answers are stripped
      expect(result.questions[0].questionData).not.toHaveProperty(
        "correctAnswer",
      );
    });

    it("should throw NotFoundException if quiz not found", async () => {
      mockPrisma.quiz.findFirst.mockResolvedValue(null);

      await expect(service.findOne(mockQuizId, mockTenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("findByCode", () => {
    it("should return quiz by code", async () => {
      mockPrisma.quiz.findFirst.mockResolvedValue(mockQuiz);

      const result = await service.findByCode("QUIZ-001", mockTenantId);

      expect(result.id).toBe(mockQuizId);
    });

    it("should throw NotFoundException if quiz not found", async () => {
      mockPrisma.quiz.findFirst.mockResolvedValue(null);

      await expect(service.findByCode("INVALID", mockTenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("startAttempt", () => {
    beforeEach(() => {
      mockPrisma.quiz.findFirst.mockResolvedValue(mockQuiz);
      mockPrisma.quizAttempt.count.mockResolvedValue(0);
      mockPrisma.quizAttempt.findFirst.mockResolvedValue(null);
      mockPrisma.quizAttempt.create.mockResolvedValue(mockAttempt);
    });

    it("should create a new quiz attempt", async () => {
      const result = await service.startAttempt(
        mockQuizId,
        mockUserId,
        mockTenantId,
      );

      expect(result.id).toBe(mockAttemptId);
      expect(mockPrisma.quizAttempt.create).toHaveBeenCalled();
    });

    it("should return existing in-progress attempt", async () => {
      mockPrisma.quizAttempt.findFirst.mockResolvedValue(mockAttempt);

      const result = await service.startAttempt(
        mockQuizId,
        mockUserId,
        mockTenantId,
      );

      expect(result).toEqual(mockAttempt);
      expect(mockPrisma.quizAttempt.create).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException if quiz not found", async () => {
      mockPrisma.quiz.findFirst.mockResolvedValue(null);

      await expect(
        service.startAttempt(mockQuizId, mockUserId, mockTenantId),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if max attempts reached", async () => {
      mockPrisma.quizAttempt.count.mockResolvedValue(3);

      await expect(
        service.startAttempt(mockQuizId, mockUserId, mockTenantId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("submitAttempt", () => {
    const submission = {
      quizId: mockQuizId,
      answers: [
        { questionId: "question-1", answer: "4", timeSpent: 30 },
        { questionId: "question-2", answer: "true", timeSpent: 15 },
      ],
      totalTimeSpent: 45,
    };

    beforeEach(() => {
      mockPrisma.quizAttempt.findFirst.mockResolvedValue(mockAttempt);
      mockPrisma.questionResponse.create.mockResolvedValue({});
      mockPrisma.quizAttempt.update.mockResolvedValue({
        ...mockAttempt,
        status: QuizAttemptStatus.COMPLETED,
      });
    });

    it("should grade and submit quiz attempt", async () => {
      const result = await service.submitAttempt(
        mockAttemptId,
        submission,
        mockUserId,
      );

      expect(result.attemptId).toBe(mockAttemptId);
      expect(result.score).toBe(20); // Both correct = 10 + 10
      expect(result.percentage).toBe(100);
      expect(result.passed).toBe(true);
      expect(result.gradedQuestions).toHaveLength(2);
    });

    it("should fail quiz when answers are wrong", async () => {
      const wrongSubmission = {
        ...submission,
        answers: [
          { questionId: "question-1", answer: "3", timeSpent: 30 },
          { questionId: "question-2", answer: "false", timeSpent: 15 },
        ],
      };

      const result = await service.submitAttempt(
        mockAttemptId,
        wrongSubmission,
        mockUserId,
      );

      expect(result.score).toBe(0);
      expect(result.percentage).toBe(0);
      expect(result.passed).toBe(false);
    });

    it("should throw NotFoundException if attempt not found", async () => {
      mockPrisma.quizAttempt.findFirst.mockResolvedValue(null);

      await expect(
        service.submitAttempt(mockAttemptId, submission, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if time limit exceeded", async () => {
      const expiredAttempt = {
        ...mockAttempt,
        startedAt: new Date(Date.now() - 120 * 60 * 1000), // 2 hours ago
      };
      mockPrisma.quizAttempt.findFirst.mockResolvedValue(expiredAttempt);

      await expect(
        service.submitAttempt(mockAttemptId, submission, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getUserAttempts", () => {
    it("should return user attempts for a quiz", async () => {
      const mockAttempts = [mockAttempt];
      mockPrisma.quizAttempt.findMany.mockResolvedValue(mockAttempts);

      const result = await service.getUserAttempts(mockQuizId, mockUserId);

      expect(result).toEqual(mockAttempts);
      expect(mockPrisma.quizAttempt.findMany).toHaveBeenCalledWith({
        where: { quizId: mockQuizId, userId: mockUserId },
        include: {
          responses: {
            include: {
              question: {
                select: {
                  id: true,
                  questionText: true,
                  type: true,
                  points: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("getAttemptDetails", () => {
    it("should return attempt details", async () => {
      const attemptWithDetails = {
        ...mockAttempt,
        responses: [],
      };
      mockPrisma.quizAttempt.findFirst.mockResolvedValue(attemptWithDetails);

      const result = await service.getAttemptDetails(mockAttemptId, mockUserId);

      expect(result).toEqual(attemptWithDetails);
    });

    it("should throw NotFoundException if attempt not found", async () => {
      mockPrisma.quizAttempt.findFirst.mockResolvedValue(null);

      await expect(
        service.getAttemptDetails(mockAttemptId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
