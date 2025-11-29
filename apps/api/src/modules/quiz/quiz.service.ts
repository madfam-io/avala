import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { QuizAttemptStatus, QuestionType, Prisma } from "@avala/db";
import { QuizQueryDto } from "./dto/quiz-query.dto";

export interface QuestionAnswer {
  questionId: string;
  answer: string | string[] | Record<string, string>;
  timeSpent?: number;
}

export interface QuizSubmission {
  quizId: string;
  answers: QuestionAnswer[];
  totalTimeSpent: number;
}

export interface GradedQuestion {
  questionId: string;
  correct: boolean;
  pointsEarned: number;
  pointsPossible: number;
  feedback?: string;
}

export interface QuizResult {
  attemptId: string;
  quizId: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  gradedQuestions: GradedQuestion[];
  completedAt: Date;
}

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all quizzes for a tenant with pagination
   */
  async findAll(tenantId: string, query?: QuizQueryDto) {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.QuizWhereInput = {
      tenantId,
      ...(query?.search && {
        OR: [
          { title: { contains: query.search, mode: "insensitive" } },
          { code: { contains: query.search, mode: "insensitive" } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.quiz.findMany({
        where,
        include: {
          _count: {
            select: { questions: true, attempts: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.quiz.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a quiz by ID with questions (for taking the quiz)
   */
  async findOne(quizId: string, tenantId: string) {
    const quiz = await this.prisma.quiz.findFirst({
      where: { id: quizId, tenantId },
      include: {
        questions: {
          orderBy: { orderIndex: "asc" },
          select: {
            id: true,
            type: true,
            questionText: true,
            points: true,
            orderIndex: true,
            questionData: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException("Quiz not found");
    }

    // Strip correct answers from questionData for security
    const sanitizedQuiz = {
      ...quiz,
      questions: quiz.questions.map((q) => ({
        ...q,
        questionData: this.sanitizeQuestionData(
          q.type,
          q.questionData as Record<string, unknown>,
        ),
      })),
    };

    return sanitizedQuiz;
  }

  /**
   * Get quiz by code
   */
  async findByCode(code: string, tenantId: string) {
    const quiz = await this.prisma.quiz.findFirst({
      where: { code, tenantId },
    });

    if (!quiz) {
      throw new NotFoundException("Quiz not found");
    }

    return this.findOne(quiz.id, tenantId);
  }

  /**
   * Start a quiz attempt
   */
  async startAttempt(quizId: string, userId: string, tenantId: string) {
    const quiz = await this.prisma.quiz.findFirst({
      where: { id: quizId, tenantId },
    });

    if (!quiz) {
      throw new NotFoundException("Quiz not found");
    }

    // Check if user has remaining attempts
    const attemptCount = await this.prisma.quizAttempt.count({
      where: { quizId, userId },
    });

    if (attemptCount >= quiz.allowedAttempts) {
      throw new BadRequestException(
        `Maximum attempts (${quiz.allowedAttempts}) reached for this quiz`,
      );
    }

    // Check for existing in-progress attempt
    const existingAttempt = await this.prisma.quizAttempt.findFirst({
      where: {
        quizId,
        userId,
        status: QuizAttemptStatus.IN_PROGRESS,
      },
    });

    if (existingAttempt) {
      return existingAttempt;
    }

    // Create new attempt
    const attempt = await this.prisma.quizAttempt.create({
      data: {
        quizId,
        userId,
        tenantId,
        status: QuizAttemptStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });

    this.logger.log(`User ${userId} started quiz attempt ${attempt.id}`);
    return attempt;
  }

  /**
   * Submit a quiz attempt for grading
   */
  async submitAttempt(
    attemptId: string,
    submission: QuizSubmission,
    userId: string,
  ): Promise<QuizResult> {
    // Verify attempt exists and belongs to user
    const attempt = await this.prisma.quizAttempt.findFirst({
      where: { id: attemptId, userId, status: QuizAttemptStatus.IN_PROGRESS },
      include: {
        quiz: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException(
        "Quiz attempt not found or already submitted",
      );
    }

    // Check time limit
    if (attempt.quiz.timeLimit) {
      const elapsedMinutes =
        (Date.now() - attempt.startedAt.getTime()) / 1000 / 60;
      if (elapsedMinutes > attempt.quiz.timeLimit + 1) {
        throw new BadRequestException("Quiz time limit exceeded");
      }
    }

    // Grade each question
    const gradedQuestions: GradedQuestion[] = [];
    let totalScore = 0;
    let totalPoints = 0;

    for (const question of attempt.quiz.questions) {
      const answer = submission.answers.find(
        (a) => a.questionId === question.id,
      );
      const questionData = question.questionData as Record<string, unknown>;

      const graded = this.gradeQuestion(
        question.type,
        questionData,
        answer?.answer,
        question.points,
      );

      gradedQuestions.push({
        questionId: question.id,
        correct: graded.correct,
        pointsEarned: graded.pointsEarned,
        pointsPossible: question.points,
        feedback: question.explanation || undefined,
      });

      totalScore += graded.pointsEarned;
      totalPoints += question.points;

      // Save individual response
      await this.prisma.questionResponse.create({
        data: {
          attemptId,
          questionId: question.id,
          response: JSON.parse(
            JSON.stringify(answer?.answer || null),
          ) as Prisma.InputJsonValue,
          isCorrect: graded.correct,
          points: graded.pointsEarned,
          maxPoints: question.points,
          timeSpent: answer?.timeSpent || 0,
        },
      });
    }

    const percentage =
      totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;
    const passed = percentage >= attempt.quiz.passingScore;

    // Update attempt with results
    const resultsData = {
      questionResults: gradedQuestions.map((gq) => ({
        questionId: gq.questionId,
        correct: gq.correct,
        pointsEarned: gq.pointsEarned,
        pointsPossible: gq.pointsPossible,
        feedback: gq.feedback || null,
      })),
      summary: {
        totalQuestions: attempt.quiz.questions.length,
        correctAnswers: gradedQuestions.filter((g) => g.correct).length,
      },
    };

    await this.prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        status: QuizAttemptStatus.COMPLETED,
        completedAt: new Date(),
        totalPoints: totalScore,
        maxPoints: totalPoints,
        percentage,
        passed,
        timeSpent: submission.totalTimeSpent,
        resultsData: resultsData as unknown as Prisma.InputJsonValue,
      },
    });

    this.logger.log(
      `User ${userId} completed quiz ${attempt.quizId}: ${percentage}% (${passed ? "PASSED" : "FAILED"})`,
    );

    return {
      attemptId,
      quizId: attempt.quizId,
      score: totalScore,
      totalPoints,
      percentage,
      passed,
      gradedQuestions,
      completedAt: new Date(),
    };
  }

  /**
   * Get user's attempts for a quiz
   */
  async getUserAttempts(quizId: string, userId: string) {
    return this.prisma.quizAttempt.findMany({
      where: { quizId, userId },
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
  }

  /**
   * Get attempt details with responses
   */
  async getAttemptDetails(attemptId: string, userId: string) {
    const attempt = await this.prisma.quizAttempt.findFirst({
      where: { id: attemptId, userId },
      include: {
        quiz: true,
        responses: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException("Attempt not found");
    }

    return attempt;
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private sanitizeQuestionData(
    type: QuestionType,
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    if (!data) return {};

    switch (type) {
      case QuestionType.MULTIPLE_CHOICE:
        return { options: data.options };

      case QuestionType.TRUE_FALSE:
        return {};

      case QuestionType.SHORT_ANSWER:
        return { maxLength: data.maxLength };

      case QuestionType.ESSAY:
        return { minWords: data.minWords, maxWords: data.maxWords };

      case QuestionType.MATCHING:
        return {
          leftItems: data.leftItems,
          rightItems: this.shuffleArray([...(data.rightItems as string[])]),
        };

      default:
        return {};
    }
  }

  private gradeQuestion(
    type: QuestionType,
    questionData: Record<string, unknown>,
    userAnswer: string | string[] | Record<string, string> | undefined,
    maxPoints: number,
  ): { correct: boolean; pointsEarned: number } {
    if (!userAnswer) {
      return { correct: false, pointsEarned: 0 };
    }

    switch (type) {
      case QuestionType.MULTIPLE_CHOICE:
        return this.gradeMultipleChoice(
          questionData,
          userAnswer as string,
          maxPoints,
        );

      case QuestionType.TRUE_FALSE:
        return this.gradeTrueFalse(
          questionData,
          userAnswer as string,
          maxPoints,
        );

      case QuestionType.SHORT_ANSWER:
        return this.gradeShortAnswer(
          questionData,
          userAnswer as string,
          maxPoints,
        );

      case QuestionType.MATCHING:
        return this.gradeMatching(
          questionData,
          userAnswer as Record<string, string>,
          maxPoints,
        );

      case QuestionType.ESSAY:
        return { correct: false, pointsEarned: 0 };

      default:
        return { correct: false, pointsEarned: 0 };
    }
  }

  private gradeMultipleChoice(
    data: Record<string, unknown>,
    answer: string,
    maxPoints: number,
  ): { correct: boolean; pointsEarned: number } {
    const correct = answer === data.correctAnswer;
    return { correct, pointsEarned: correct ? maxPoints : 0 };
  }

  private gradeTrueFalse(
    data: Record<string, unknown>,
    answer: string,
    maxPoints: number,
  ): { correct: boolean; pointsEarned: number } {
    const correct =
      answer.toLowerCase() === String(data.correctAnswer).toLowerCase();
    return { correct, pointsEarned: correct ? maxPoints : 0 };
  }

  private gradeShortAnswer(
    data: Record<string, unknown>,
    answer: string,
    maxPoints: number,
  ): { correct: boolean; pointsEarned: number } {
    const keywords = (data.keywords as string[]) || [];
    const acceptableAnswers = (data.acceptableAnswers as string[]) || [];

    const normalizedAnswer = answer.toLowerCase().trim();

    if (acceptableAnswers.some((a) => a.toLowerCase() === normalizedAnswer)) {
      return { correct: true, pointsEarned: maxPoints };
    }

    const matchedKeywords = keywords.filter((kw) =>
      normalizedAnswer.includes(kw.toLowerCase()),
    );

    if (matchedKeywords.length > 0) {
      const ratio = matchedKeywords.length / keywords.length;
      const points = Math.round(maxPoints * ratio);
      return { correct: ratio >= 0.5, pointsEarned: points };
    }

    return { correct: false, pointsEarned: 0 };
  }

  private gradeMatching(
    data: Record<string, unknown>,
    answer: Record<string, string>,
    maxPoints: number,
  ): { correct: boolean; pointsEarned: number } {
    const correctPairs = data.correctPairs as Record<string, string>;
    if (!correctPairs || !answer) {
      return { correct: false, pointsEarned: 0 };
    }

    const totalPairs = Object.keys(correctPairs).length;
    let correctCount = 0;

    for (const [left, right] of Object.entries(correctPairs)) {
      if (answer[left] === right) {
        correctCount++;
      }
    }

    const ratio = totalPairs > 0 ? correctCount / totalPairs : 0;
    const points = Math.round(maxPoints * ratio);

    return { correct: ratio === 1, pointsEarned: points };
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
