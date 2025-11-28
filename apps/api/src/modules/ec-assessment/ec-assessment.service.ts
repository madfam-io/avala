import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { QuizCategory, SimulationType } from "@avala/db";
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
import { AttemptService } from "./services/attempt.service";

/**
 * ECAssessmentService - Facade for EC Assessment functionality
 *
 * Delegates grading logic to specialized handlers and services:
 * - AttemptService: assessment attempt lifecycle
 * - GradingService: question grading with type-specific handlers
 */
@Injectable()
export class ECAssessmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attemptService: AttemptService,
  ) {}

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
        module: { select: { code: true, title: true } },
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
        module: { select: { code: true, title: true } },
      },
    });

    return assessments.map((a) => ({
      ...a,
      questionCount: (a.questions as unknown[]).length,
      totalPoints: (a.questions as Array<{ points?: number }>).reduce(
        (sum, q) => sum + (q.points || 10),
        0,
      ),
    }));
  }

  async findAssessmentById(assessmentId: string) {
    const assessment = await this.prisma.eCAssessment.findUnique({
      where: { id: assessmentId },
      include: {
        ec: { select: { code: true, title: true } },
        module: { select: { code: true, title: true } },
      },
    });

    if (!assessment) {
      throw new NotFoundException("Assessment not found");
    }

    return {
      ...assessment,
      questionCount: (assessment.questions as unknown[]).length,
      totalPoints: (assessment.questions as Array<{ points?: number }>).reduce(
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

    const questions = assessment.questions as Array<{ orderIndex?: number }>;
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
      include: { _count: { select: { attempts: true } } },
    });

    if (!assessment) {
      throw new NotFoundException("Assessment not found");
    }

    if (assessment._count.attempts > 0) {
      throw new ConflictException(
        "Cannot delete assessment with existing attempts",
      );
    }

    await this.prisma.eCAssessment.delete({ where: { id: assessmentId } });
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

    return this.prisma.eCSimulation.findMany({ where: { ecId: ec.id } });
  }

  async findSimulationById(simulationId: string) {
    const simulation = await this.prisma.eCSimulation.findUnique({
      where: { id: simulationId },
      include: { ec: { select: { code: true, title: true } } },
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
      include: { _count: { select: { attempts: true } } },
    });

    if (!simulation) {
      throw new NotFoundException("Simulation not found");
    }

    if (simulation._count.attempts > 0) {
      throw new ConflictException(
        "Cannot delete simulation with existing attempts",
      );
    }

    await this.prisma.eCSimulation.delete({ where: { id: simulationId } });
    return { message: "Simulation deleted successfully" };
  }

  // ============================================
  // ASSESSMENT ATTEMPTS (delegated to AttemptService)
  // ============================================

  async startAssessmentAttempt(enrollmentId: string, assessmentId: string) {
    return this.attemptService.startAssessmentAttempt(
      enrollmentId,
      assessmentId,
    );
  }

  async submitAssessmentAnswer(attemptId: string, dto: SubmitAnswerDto) {
    return this.attemptService.submitAnswer(attemptId, dto);
  }

  async submitAssessmentAttempt(attemptId: string, dto: SubmitAttemptDto) {
    return this.attemptService.submitAttempt(attemptId, dto);
  }

  async completeAttempt(attemptId: string, timedOut: boolean) {
    return this.attemptService.completeAttempt(attemptId, timedOut);
  }

  async getAttemptById(attemptId: string) {
    return this.attemptService.getAttemptById(attemptId);
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
      include: { simulation: true },
    });

    if (!attempt) {
      throw new NotFoundException("Attempt not found");
    }

    if (attempt.status !== "IN_PROGRESS") {
      throw new BadRequestException("Attempt is not in progress");
    }

    return this.prisma.eCSimulationAttempt.update({
      where: { id: attemptId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        responses: dto.responses as object[],
      },
    });
  }

  async gradeSimulation(
    attemptId: string,
    scores: { criterionIndex: number; points: number; feedback?: string }[],
  ) {
    const attempt = await this.prisma.eCSimulationAttempt.findUnique({
      where: { id: attemptId },
      include: { simulation: true },
    });

    if (!attempt) {
      throw new NotFoundException("Attempt not found");
    }

    const rubric = attempt.simulation.rubric as Array<{
      criterion: string;
      maxPoints: number;
    }>;
    const maxPoints = rubric.reduce((sum, r) => sum + r.maxPoints, 0);

    let totalPoints = 0;
    const feedback: Record<string, unknown> = {};

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
        feedback: feedback as unknown as object,
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
        ec: { include: { assessments: true } },
        assessmentAttempts: { orderBy: { completedAt: "desc" } },
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
}
