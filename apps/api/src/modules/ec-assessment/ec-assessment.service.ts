import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { Prisma, QuizCategory, SimulationType } from "@avala/db";
import {
  CreateECAssessmentDto,
  UpdateECAssessmentDto,
  CreateECSimulationDto,
  UpdateECSimulationDto,
  SubmitAttemptDto,
  SubmitAnswerDto,
  SubmitSimulationDto,
  CreateQuestionDto,
} from "./dto/ec-assessment.dto";

interface QuestionData {
  options?: { text: string; isCorrect?: boolean }[];
  correctIndex?: number;
  correctAnswer?: boolean;
  sampleAnswer?: string;
  keywords?: string[];
  pairs?: { left: string; right: string }[];
}

@Injectable()
export class ECAssessmentService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // ASSESSMENTS
  // ============================================

  async createAssessment(ecCode: string, dto: CreateECAssessmentDto) {
    const ec = await this.prisma.eCStandard.findUnique({
      where: { code: ecCode },
    });

    if (!ec) {
      throw new NotFoundException(`EC Standard ${ecCode} not found`);
    }

    if (dto.moduleId) {
      const module = await this.prisma.eCModule.findUnique({
        where: { id: dto.moduleId },
      });
      if (!module || module.ecId !== ec.id) {
        throw new BadRequestException(`Module does not belong to ${ecCode}`);
      }
    }

    const existing = await this.prisma.eCAssessment.findFirst({
      where: { ecId: ec.id, code: dto.code },
    });

    if (existing) {
      throw new ConflictException(
        `Assessment with code ${dto.code} already exists in ${ecCode}`,
      );
    }

    return this.prisma.eCAssessment.create({
      data: {
        ecId: ec.id,
        moduleId: dto.moduleId,
        code: dto.code,
        title: dto.title,
        titleEn: dto.titleEn,
        category: (dto.category as QuizCategory) || "KNOWLEDGE_TEST",
        timeLimit: dto.timeLimit,
        passingScore: dto.passingScore || 70,
        allowedAttempts: dto.allowedAttempts || 3,
        shuffleQuestions: dto.shuffleQuestions ?? true,
        shuffleOptions: dto.shuffleOptions ?? true,
        showResults: dto.showResults ?? true,
        questions: (dto.questions || []) as object[],
      },
      include: {
        module: {
          select: {
            code: true,
            title: true,
          },
        },
      },
    });
  }

  async findAssessmentsByStandard(ecCode: string) {
    const ec = await this.prisma.eCStandard.findUnique({
      where: { code: ecCode },
    });

    if (!ec) {
      throw new NotFoundException(`EC Standard ${ecCode} not found`);
    }

    const assessments = await this.prisma.eCAssessment.findMany({
      where: { ecId: ec.id },
      include: {
        module: {
          select: {
            code: true,
            title: true,
          },
        },
      },
    });

    return assessments.map((a) => ({
      ...a,
      questionCount: (a.questions as any[]).length,
      totalPoints: (a.questions as any[]).reduce(
        (sum, q) => sum + (q.points || 10),
        0,
      ),
    }));
  }

  async findAssessmentById(assessmentId: string) {
    const assessment = await this.prisma.eCAssessment.findUnique({
      where: { id: assessmentId },
      include: {
        ec: {
          select: {
            code: true,
            title: true,
          },
        },
        module: {
          select: {
            code: true,
            title: true,
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException("Assessment not found");
    }

    return {
      ...assessment,
      questionCount: (assessment.questions as any[]).length,
      totalPoints: (assessment.questions as any[]).reduce(
        (sum, q) => sum + (q.points || 10),
        0,
      ),
    };
  }

  async updateAssessment(assessmentId: string, dto: UpdateECAssessmentDto) {
    const assessment = await this.prisma.eCAssessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment) {
      throw new NotFoundException("Assessment not found");
    }

    return this.prisma.eCAssessment.update({
      where: { id: assessmentId },
      data: {
        title: dto.title,
        titleEn: dto.titleEn,
        moduleId: dto.moduleId,
        category: dto.category as QuizCategory,
        timeLimit: dto.timeLimit,
        passingScore: dto.passingScore,
        allowedAttempts: dto.allowedAttempts,
        shuffleQuestions: dto.shuffleQuestions,
        shuffleOptions: dto.shuffleOptions,
        showResults: dto.showResults,
        questions: dto.questions as object[] | undefined,
      },
    });
  }

  async addQuestion(assessmentId: string, question: CreateQuestionDto) {
    const assessment = await this.prisma.eCAssessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment) {
      throw new NotFoundException("Assessment not found");
    }

    const questions = assessment.questions as any[];
    const newQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...question,
      orderIndex: question.orderIndex ?? questions.length,
    };

    questions.push(newQuestion);

    await this.prisma.eCAssessment.update({
      where: { id: assessmentId },
      data: { questions },
    });

    return newQuestion;
  }

  async deleteAssessment(assessmentId: string) {
    const assessment = await this.prisma.eCAssessment.findUnique({
      where: { id: assessmentId },
      include: {
        _count: {
          select: { attempts: true },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException("Assessment not found");
    }

    if (assessment._count.attempts > 0) {
      throw new ConflictException(
        "Cannot delete assessment with existing attempts",
      );
    }

    await this.prisma.eCAssessment.delete({
      where: { id: assessmentId },
    });

    return { message: "Assessment deleted successfully" };
  }

  // ============================================
  // SIMULATIONS
  // ============================================

  async createSimulation(ecCode: string, dto: CreateECSimulationDto) {
    const ec = await this.prisma.eCStandard.findUnique({
      where: { code: ecCode },
    });

    if (!ec) {
      throw new NotFoundException(`EC Standard ${ecCode} not found`);
    }

    const existing = await this.prisma.eCSimulation.findFirst({
      where: { ecId: ec.id, code: dto.code },
    });

    if (existing) {
      throw new ConflictException(
        `Simulation with code ${dto.code} already exists in ${ecCode}`,
      );
    }

    return this.prisma.eCSimulation.create({
      data: {
        ecId: ec.id,
        code: dto.code,
        title: dto.title,
        titleEn: dto.titleEn,
        description: dto.description,
        type: dto.type as SimulationType,
        scenario: dto.scenario as object,
        rubric: (dto.rubric || []) as object[],
      },
    });
  }

  async findSimulationsByStandard(ecCode: string) {
    const ec = await this.prisma.eCStandard.findUnique({
      where: { code: ecCode },
    });

    if (!ec) {
      throw new NotFoundException(`EC Standard ${ecCode} not found`);
    }

    return this.prisma.eCSimulation.findMany({
      where: { ecId: ec.id },
    });
  }

  async findSimulationById(simulationId: string) {
    const simulation = await this.prisma.eCSimulation.findUnique({
      where: { id: simulationId },
      include: {
        ec: {
          select: {
            code: true,
            title: true,
          },
        },
      },
    });

    if (!simulation) {
      throw new NotFoundException("Simulation not found");
    }

    return simulation;
  }

  async updateSimulation(simulationId: string, dto: UpdateECSimulationDto) {
    const simulation = await this.prisma.eCSimulation.findUnique({
      where: { id: simulationId },
    });

    if (!simulation) {
      throw new NotFoundException("Simulation not found");
    }

    return this.prisma.eCSimulation.update({
      where: { id: simulationId },
      data: {
        title: dto.title,
        titleEn: dto.titleEn,
        description: dto.description,
        type: dto.type as SimulationType,
        scenario: dto.scenario as object | undefined,
        rubric: dto.rubric as object[] | undefined,
      },
    });
  }

  async deleteSimulation(simulationId: string) {
    const simulation = await this.prisma.eCSimulation.findUnique({
      where: { id: simulationId },
      include: {
        _count: {
          select: { attempts: true },
        },
      },
    });

    if (!simulation) {
      throw new NotFoundException("Simulation not found");
    }

    if (simulation._count.attempts > 0) {
      throw new ConflictException(
        "Cannot delete simulation with existing attempts",
      );
    }

    await this.prisma.eCSimulation.delete({
      where: { id: simulationId },
    });

    return { message: "Simulation deleted successfully" };
  }

  // ============================================
  // ASSESSMENT ATTEMPTS
  // ============================================

  async startAssessmentAttempt(enrollmentId: string, assessmentId: string) {
    const enrollment = await this.prisma.eCEnrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      throw new NotFoundException("Enrollment not found");
    }

    const assessment = await this.prisma.eCAssessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment || assessment.ecId !== enrollment.ecId) {
      throw new BadRequestException(
        "Assessment does not belong to enrolled EC",
      );
    }

    // Check attempt count
    const existingAttempts = await this.prisma.eCAssessmentAttempt.count({
      where: {
        enrollmentId,
        assessmentId,
        status: { not: "IN_PROGRESS" },
      },
    });

    if (existingAttempts >= assessment.allowedAttempts) {
      throw new ForbiddenException(
        `Maximum attempts (${assessment.allowedAttempts}) reached`,
      );
    }

    // Check for in-progress attempt
    const inProgress = await this.prisma.eCAssessmentAttempt.findFirst({
      where: {
        enrollmentId,
        assessmentId,
        status: "IN_PROGRESS",
      },
    });

    if (inProgress) {
      return inProgress; // Return existing in-progress attempt
    }

    // Prepare questions (shuffle if needed)
    let questions = assessment.questions as any[];
    if (assessment.shuffleQuestions) {
      questions = this.shuffleArray([...questions]);
    }
    if (assessment.shuffleOptions) {
      questions = questions.map((q) => {
        if (q.questionData?.options) {
          return {
            ...q,
            questionData: {
              ...q.questionData,
              options: this.shuffleArray([...q.questionData.options]),
            },
          };
        }
        return q;
      });
    }

    return this.prisma.eCAssessmentAttempt.create({
      data: {
        enrollmentId,
        assessmentId,
        status: "IN_PROGRESS",
        responses: [],
      },
    });
  }

  async submitAssessmentAnswer(attemptId: string, dto: SubmitAnswerDto) {
    const attempt = await this.prisma.eCAssessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException("Attempt not found");
    }

    if (attempt.status !== "IN_PROGRESS") {
      throw new BadRequestException("Attempt is not in progress");
    }

    // Check time limit
    if (attempt.assessment.timeLimit) {
      const elapsed = Math.floor(
        (Date.now() - attempt.startedAt.getTime()) / 1000,
      );
      if (elapsed > attempt.assessment.timeLimit) {
        // Auto-submit if time exceeded
        return this.completeAttempt(attemptId, true);
      }
    }

    // Add/update response
    const responses = attempt.responses as any[];
    const existingIndex = responses.findIndex(
      (r) => r.questionId === dto.questionId,
    );

    const responseData = {
      questionId: dto.questionId,
      response: dto.response,
      timeSpent: dto.timeSpent,
      answeredAt: new Date(),
    };

    if (existingIndex >= 0) {
      responses[existingIndex] = responseData;
    } else {
      responses.push(responseData);
    }

    await this.prisma.eCAssessmentAttempt.update({
      where: { id: attemptId },
      data: { responses },
    });

    return { success: true, answeredQuestions: responses.length };
  }

  async submitAssessmentAttempt(attemptId: string, dto: SubmitAttemptDto) {
    const attempt = await this.prisma.eCAssessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException("Attempt not found");
    }

    if (attempt.status !== "IN_PROGRESS") {
      throw new BadRequestException("Attempt is not in progress");
    }

    // Store all answers
    await this.prisma.eCAssessmentAttempt.update({
      where: { id: attemptId },
      data: {
        responses: dto.answers.map((a) => ({
          questionId: a.questionId,
          response: a.response,
          answeredAt: new Date(),
        })),
        timeSpent: dto.timeSpent,
      },
    });

    return this.completeAttempt(attemptId, false);
  }

  async completeAttempt(attemptId: string, timedOut: boolean) {
    const attempt = await this.prisma.eCAssessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException("Attempt not found");
    }

    const questions = attempt.assessment.questions as any[];
    const responses = attempt.responses as any[];

    // Grade each question
    let totalPoints = 0;
    let maxPoints = 0;
    const questionResults: any[] = [];

    for (const question of questions) {
      const points = question.points || 10;
      maxPoints += points;

      const response = responses.find((r) => r.questionId === question.id);
      const result = this.gradeQuestion(question, response?.response);

      totalPoints += result.earnedPoints;
      questionResults.push({
        questionId: question.id,
        isCorrect: result.isCorrect,
        pointsEarned: result.earnedPoints,
        maxPoints: points,
        explanation: question.explanation,
      });
    }

    const percentage = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;
    const passed = percentage >= attempt.assessment.passingScore;

    // Calculate time spent
    const timeSpent =
      attempt.timeSpent ||
      Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);

    const updated = await this.prisma.eCAssessmentAttempt.update({
      where: { id: attemptId },
      data: {
        status: timedOut ? "TIMED_OUT" : "COMPLETED",
        completedAt: new Date(),
        timeSpent,
        score: percentage,
        passed,
        responses: questionResults,
      },
    });

    return {
      attemptId,
      assessmentId: attempt.assessmentId,
      status: updated.status,
      score: totalPoints,
      maxScore: maxPoints,
      percentage,
      passed,
      timeSpent,
      questionResults: attempt.assessment.showResults
        ? questionResults
        : undefined,
      completedAt: updated.completedAt,
    };
  }

  private gradeQuestion(
    question: { type: string; questionData: QuestionData; points?: number },
    response: any,
  ): { isCorrect: boolean; earnedPoints: number } {
    const points = question.points || 10;

    if (response === undefined || response === null) {
      return { isCorrect: false, earnedPoints: 0 };
    }

    switch (question.type) {
      case "MULTIPLE_CHOICE": {
        const correct =
          question.questionData.correctIndex === response ||
          question.questionData.options?.[response]?.isCorrect === true;
        return { isCorrect: correct, earnedPoints: correct ? points : 0 };
      }

      case "TRUE_FALSE": {
        const correct = question.questionData.correctAnswer === response;
        return { isCorrect: correct, earnedPoints: correct ? points : 0 };
      }

      case "SHORT_ANSWER": {
        const keywords = question.questionData.keywords || [];
        const responseText = String(response).toLowerCase();
        const matchedKeywords = keywords.filter((kw) =>
          responseText.includes(kw.toLowerCase()),
        );
        const score =
          keywords.length > 0 ? matchedKeywords.length / keywords.length : 0;
        return {
          isCorrect: score >= 0.7,
          earnedPoints: Math.round(points * score),
        };
      }

      case "MATCHING": {
        const pairs = question.questionData.pairs || [];
        const responsePairs = response as { left: string; right: string }[];
        let correctCount = 0;

        for (const pair of pairs) {
          const match = responsePairs?.find(
            (r) => r.left === pair.left && r.right === pair.right,
          );
          if (match) correctCount++;
        }

        const score = pairs.length > 0 ? correctCount / pairs.length : 0;
        return {
          isCorrect: score === 1,
          earnedPoints: Math.round(points * score),
        };
      }

      case "ESSAY":
        // Essays require manual review
        return { isCorrect: false, earnedPoints: 0 };

      default:
        return { isCorrect: false, earnedPoints: 0 };
    }
  }

  // ============================================
  // SIMULATION ATTEMPTS
  // ============================================

  async startSimulationAttempt(enrollmentId: string, simulationId: string) {
    const enrollment = await this.prisma.eCEnrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      throw new NotFoundException("Enrollment not found");
    }

    const simulation = await this.prisma.eCSimulation.findUnique({
      where: { id: simulationId },
    });

    if (!simulation || simulation.ecId !== enrollment.ecId) {
      throw new BadRequestException(
        "Simulation does not belong to enrolled EC",
      );
    }

    return this.prisma.eCSimulationAttempt.create({
      data: {
        enrollmentId,
        simulationId,
        status: "IN_PROGRESS",
        responses: [],
        feedback: {},
      },
    });
  }

  async submitSimulationAttempt(attemptId: string, dto: SubmitSimulationDto) {
    const attempt = await this.prisma.eCSimulationAttempt.findUnique({
      where: { id: attemptId },
      include: {
        simulation: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException("Attempt not found");
    }

    if (attempt.status !== "IN_PROGRESS") {
      throw new BadRequestException("Attempt is not in progress");
    }

    // Simulations typically require manual review
    // For now, we just store the responses
    return this.prisma.eCSimulationAttempt.update({
      where: { id: attemptId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        responses: dto.responses as object[],
        // Score would be set after manual review
      },
    });
  }

  async gradeSimulation(
    attemptId: string,
    scores: { criterionIndex: number; points: number; feedback?: string }[],
  ) {
    const attempt = await this.prisma.eCSimulationAttempt.findUnique({
      where: { id: attemptId },
      include: {
        simulation: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException("Attempt not found");
    }

    const rubric = attempt.simulation.rubric as any[];
    const maxPoints = rubric.reduce((sum, r) => sum + r.maxPoints, 0);

    let totalPoints = 0;
    const feedback: Record<string, any> = {};

    for (const score of scores) {
      if (score.criterionIndex < rubric.length) {
        totalPoints += Math.min(
          score.points,
          rubric[score.criterionIndex].maxPoints,
        );
        feedback[rubric[score.criterionIndex].criterion] = {
          points: score.points,
          maxPoints: rubric[score.criterionIndex].maxPoints,
          feedback: score.feedback,
        };
      }
    }

    const percentage = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;

    return this.prisma.eCSimulationAttempt.update({
      where: { id: attemptId },
      data: {
        score: percentage,
        passed: percentage >= 70,
        feedback,
      },
    });
  }

  // ============================================
  // USER SUMMARIES
  // ============================================

  async getUserAssessmentSummary(enrollmentId: string) {
    const enrollment = await this.prisma.eCEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        ec: {
          include: {
            assessments: true,
          },
        },
        assessmentAttempts: {
          orderBy: { completedAt: "desc" },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException("Enrollment not found");
    }

    return enrollment.ec.assessments.map((assessment) => {
      const attempts = enrollment.assessmentAttempts.filter(
        (a) => a.assessmentId === assessment.id,
      );
      const completedAttempts = attempts.filter(
        (a) => a.status === "COMPLETED" || a.status === "TIMED_OUT",
      );
      const bestAttempt = completedAttempts.reduce(
        (best, current) =>
          (current.score || 0) > (best?.score || 0) ? current : best,
        completedAttempts[0],
      );

      return {
        assessmentId: assessment.id,
        assessmentTitle: assessment.title,
        category: assessment.category,
        attemptCount: completedAttempts.length,
        allowedAttempts: assessment.allowedAttempts,
        bestScore: bestAttempt?.score || 0,
        passed: bestAttempt?.passed || false,
        lastAttemptAt: completedAttempts[0]?.completedAt,
      };
    });
  }

  async getAttemptById(attemptId: string) {
    const attempt = await this.prisma.eCAssessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: {
          include: {
            ec: {
              select: {
                code: true,
                title: true,
              },
            },
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
  // UTILITY METHODS
  // ============================================

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
