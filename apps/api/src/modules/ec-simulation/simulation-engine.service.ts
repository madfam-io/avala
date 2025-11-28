import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import {
  SessionStatus,
  ActionType,
  StartSessionDto,
  SubmitActionDto,
  SessionResultDto,
} from "./dto/simulation.dto";

/**
 * Evaluation indicators for keyword matching
 */
const EVALUATION_INDICATORS: Record<string, string[]> = {
  // Interview criteria
  introduction: ["nombre", "soy", "me llamo", "consultor", "asesor", "empresa"],
  purpose_explanation: [
    "objetivo",
    "propósito",
    "razón",
    "motivo",
    "visita",
    "reunión",
  ],
  needs_discovery: [
    "necesidad",
    "problema",
    "reto",
    "desafío",
    "situación",
    "contexto",
  ],
  active_listening: [
    "entiendo",
    "comprendo",
    "entonces",
    "es decir",
    "lo que menciona",
  ],
  evidence_request: [
    "evidencia",
    "respaldo",
    "documentación",
    "registro",
    "datos",
  ],
  solution_proposal: [
    "propuesta",
    "solución",
    "alternativa",
    "opción",
    "recomendación",
  ],
  benefit_articulation: [
    "beneficio",
    "resultado",
    "mejora",
    "impacto",
    "retorno",
  ],
  closing: ["siguiente paso", "compromiso", "acuerdo", "agenda", "seguimiento"],

  // Presentation criteria
  opening: ["bienvenidos", "agenda", "objetivo", "hoy", "presentar"],
  structure: ["primero", "segundo", "además", "finalmente", "en conclusión"],
  data_presentation: [
    "datos",
    "cifras",
    "porcentaje",
    "resultado",
    "indicador",
  ],
  visual_reference: ["como pueden ver", "en la gráfica", "observen", "muestra"],
  audience_engagement: ["preguntas", "comentarios", "opinión", "participación"],
  recommendation: ["recomiendo", "sugiero", "propongo", "es necesario"],
};

interface ActiveSession {
  id: string;
  simulationId: string;
  enrollmentId: string;
  status: SessionStatus;
  startedAt: Date;
  actions: Array<{
    type: ActionType;
    content: string;
    timestamp: Date;
    evaluation?: Record<string, number>;
  }>;
  currentPhase: number;
  timeRemaining: number;
}

/**
 * Simulation Engine Service
 * Handles real-time simulation execution and evaluation
 */
@Injectable()
export class SimulationEngineService {
  private readonly logger = new Logger(SimulationEngineService.name);
  private activeSessions = new Map<string, ActiveSession>();

  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // SESSION MANAGEMENT
  // ============================================

  async startSession(dto: StartSessionDto): Promise<ActiveSession> {
    // Verify simulation exists
    const simulation = await this.prisma.eCSimulation.findUnique({
      where: { id: dto.simulationId },
    });

    if (!simulation) {
      throw new NotFoundException(`Simulation ${dto.simulationId} not found`);
    }

    // Verify enrollment exists
    const enrollment = await this.prisma.eCEnrollment.findUnique({
      where: { id: dto.enrollmentId },
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment ${dto.enrollmentId} not found`);
    }

    // Create attempt in database
    const attempt = await this.prisma.eCSimulationAttempt.create({
      data: {
        simulationId: dto.simulationId,
        enrollmentId: dto.enrollmentId,
        status: "IN_PROGRESS",
        responses: [],
        feedback: {},
      },
    });

    // Get scenario data
    const scenario = simulation.scenario as Record<string, unknown>;
    const duration =
      (scenario.duration as number) ||
      (scenario.context as Record<string, unknown>)?.duration ||
      1800;

    // Create active session
    const session: ActiveSession = {
      id: attempt.id,
      simulationId: dto.simulationId,
      enrollmentId: dto.enrollmentId,
      status: SessionStatus.IN_PROGRESS,
      startedAt: new Date(),
      actions: [],
      currentPhase: 0,
      timeRemaining: duration as number,
    };

    this.activeSessions.set(attempt.id, session);

    this.logger.log(
      `Started simulation session: ${attempt.id} for simulation ${dto.simulationId}`,
    );

    return session;
  }

  async getSession(sessionId: string): Promise<ActiveSession> {
    // Check active sessions first
    const active = this.activeSessions.get(sessionId);
    if (active) {
      return active;
    }

    // Check database
    const attempt = await this.prisma.eCSimulationAttempt.findUnique({
      where: { id: sessionId },
    });

    if (!attempt) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    // Reconstruct session from database
    const responses = attempt.responses as Array<Record<string, unknown>>;

    return {
      id: attempt.id,
      simulationId: attempt.simulationId,
      enrollmentId: attempt.enrollmentId,
      status: attempt.status as SessionStatus,
      startedAt: attempt.startedAt,
      actions: responses.map((r) => ({
        type: r.type as ActionType,
        content: r.content as string,
        timestamp: new Date(r.timestamp as string),
        evaluation: r.evaluation as Record<string, number>,
      })),
      currentPhase: 0,
      timeRemaining: 0,
    };
  }

  async pauseSession(sessionId: string): Promise<ActiveSession> {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      throw new NotFoundException(`Active session ${sessionId} not found`);
    }

    session.status = SessionStatus.PAUSED;

    // Database doesn't have PAUSED status, keep as IN_PROGRESS
    // The session is tracked in memory as paused
    await this.prisma.eCSimulationAttempt.update({
      where: { id: sessionId },
      data: {
        status: "IN_PROGRESS",
        responses: session.actions as unknown as object[],
      },
    });

    this.logger.log(`Paused session: ${sessionId}`);
    return session;
  }

  async resumeSession(sessionId: string): Promise<ActiveSession> {
    let session = this.activeSessions.get(sessionId);

    if (!session) {
      // Try to restore from database
      const attempt = await this.prisma.eCSimulationAttempt.findUnique({
        where: { id: sessionId },
      });

      // Allow resuming IN_PROGRESS sessions (paused sessions are stored as IN_PROGRESS)
      if (!attempt || attempt.status !== "IN_PROGRESS") {
        throw new BadRequestException(`Session ${sessionId} cannot be resumed`);
      }

      const responses = attempt.responses as Array<Record<string, unknown>>;

      session = {
        id: attempt.id,
        simulationId: attempt.simulationId,
        enrollmentId: attempt.enrollmentId,
        status: SessionStatus.IN_PROGRESS,
        startedAt: attempt.startedAt,
        actions: responses.map((r) => ({
          type: r.type as ActionType,
          content: r.content as string,
          timestamp: new Date(r.timestamp as string),
          evaluation: r.evaluation as Record<string, number>,
        })),
        currentPhase: 0,
        timeRemaining: 600,
      };

      this.activeSessions.set(sessionId, session);
    }

    session.status = SessionStatus.IN_PROGRESS;

    await this.prisma.eCSimulationAttempt.update({
      where: { id: sessionId },
      data: { status: "IN_PROGRESS" },
    });

    this.logger.log(`Resumed session: ${sessionId}`);
    return session;
  }

  // ============================================
  // ACTION HANDLING
  // ============================================

  async submitAction(
    sessionId: string,
    dto: SubmitActionDto,
  ): Promise<{
    success: boolean;
    feedback?: Record<string, unknown>;
    evaluation?: Record<string, number>;
  }> {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      throw new NotFoundException(`Active session ${sessionId} not found`);
    }

    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new BadRequestException(`Session ${sessionId} is not in progress`);
    }

    // Get simulation for evaluation
    const simulation = await this.prisma.eCSimulation.findUnique({
      where: { id: session.simulationId },
    });

    if (!simulation) {
      throw new NotFoundException(`Simulation not found`);
    }

    // Evaluate the action
    const evaluation = this.evaluateAction(
      dto.type,
      dto.content,
      simulation.type,
      simulation.rubric as Array<Record<string, unknown>>,
    );

    // Record action
    const action = {
      type: dto.type,
      content: dto.content,
      timestamp: new Date(),
      evaluation,
    };

    session.actions.push(action);

    // Generate feedback
    const feedback = this.generateFeedback(evaluation, dto.type);

    // Save to database periodically
    await this.prisma.eCSimulationAttempt.update({
      where: { id: sessionId },
      data: {
        responses: session.actions,
      },
    });

    return {
      success: true,
      feedback,
      evaluation,
    };
  }

  // ============================================
  // SESSION COMPLETION
  // ============================================

  async completeSession(sessionId: string): Promise<SessionResultDto> {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      throw new NotFoundException(`Active session ${sessionId} not found`);
    }

    // Get simulation
    const simulation = await this.prisma.eCSimulation.findUnique({
      where: { id: session.simulationId },
    });

    if (!simulation) {
      throw new NotFoundException(`Simulation not found`);
    }

    // Calculate final results
    const results = this.calculateResults(
      session,
      simulation.rubric as Array<Record<string, unknown>>,
    );

    const scenario = simulation.scenario as Record<string, unknown>;
    const passingScore = (scenario.passingScore as number) || 70;
    const passed = results.overallScore >= passingScore;

    // Update database
    await this.prisma.eCSimulationAttempt.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        score: results.overallScore,
        passed,
        responses: session.actions as unknown as object[],
        feedback: results as unknown as object,
      },
    });

    // Remove from active sessions
    this.activeSessions.delete(sessionId);

    this.logger.log(
      `Completed session ${sessionId}: score=${results.overallScore}, passed=${passed}`,
    );

    return {
      sessionId,
      simulationId: session.simulationId,
      status: SessionStatus.COMPLETED,
      completedAt: new Date(),
      duration: Math.floor((Date.now() - session.startedAt.getTime()) / 1000),
      overallScore: results.overallScore,
      passed,
      criteriaScores: results.criteriaScores,
      feedback: results.feedback,
      recommendations: results.recommendations,
    };
  }

  async abandonSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);

    await this.prisma.eCSimulationAttempt.update({
      where: { id: sessionId },
      data: {
        status: "ABANDONED",
        completedAt: new Date(),
      },
    });

    if (session) {
      this.activeSessions.delete(sessionId);
    }

    this.logger.log(`Abandoned session: ${sessionId}`);
  }

  // ============================================
  // EVALUATION LOGIC
  // ============================================

  private evaluateAction(
    _actionType: ActionType,
    content: string,
    _simulationType: string,
    rubric: Array<Record<string, unknown>>,
  ): Record<string, number> {
    const evaluation: Record<string, number> = {};
    const normalizedContent = content.toLowerCase();

    for (const criterion of rubric) {
      const criterionId = criterion.id as string;
      const indicators = criterion.indicators as string[];

      let score = 0;
      let matchedIndicators = 0;

      for (const indicator of indicators) {
        const keywords = EVALUATION_INDICATORS[indicator] || [indicator];
        const hasMatch = keywords.some((keyword) =>
          normalizedContent.includes(keyword.toLowerCase()),
        );

        if (hasMatch) {
          matchedIndicators++;
        }
      }

      // Calculate score based on matched indicators
      if (indicators.length > 0) {
        score = Math.round((matchedIndicators / indicators.length) * 100);
      }

      evaluation[criterionId] = score;
    }

    return evaluation;
  }

  private generateFeedback(
    evaluation: Record<string, number>,
    actionType: ActionType,
  ): Record<string, unknown> {
    const feedback: Record<string, unknown> = {
      type: actionType,
      timestamp: new Date(),
      scores: evaluation,
    };

    // Generate specific feedback messages
    const messages: string[] = [];
    const strengths: string[] = [];
    const improvements: string[] = [];

    for (const [criterion, score] of Object.entries(evaluation)) {
      if (score >= 80) {
        strengths.push(criterion);
      } else if (score < 50) {
        improvements.push(criterion);
      }
    }

    if (strengths.length > 0) {
      messages.push(`Fortalezas identificadas: ${strengths.join(", ")}`);
    }

    if (improvements.length > 0) {
      messages.push(`Áreas de mejora: ${improvements.join(", ")}`);
    }

    feedback.messages = messages;
    feedback.strengths = strengths;
    feedback.improvements = improvements;

    return feedback;
  }

  private calculateResults(
    session: ActiveSession,
    rubric: Array<Record<string, unknown>>,
  ): {
    overallScore: number;
    criteriaScores: Record<string, number>;
    feedback: Record<string, unknown>;
    recommendations: Array<{
      area: string;
      priority: string;
      suggestion: string;
    }>;
  } {
    const criteriaScores: Record<string, number> = {};
    const criteriaWeights: Record<string, number> = {};

    // Initialize with rubric criteria
    for (const criterion of rubric) {
      const id = criterion.id as string;
      criteriaScores[id] = 0;
      criteriaWeights[id] = (criterion.weight as number) || 10;
    }

    // Aggregate scores from all actions
    const criteriaActionCounts: Record<string, number> = {};

    for (const action of session.actions) {
      if (action.evaluation) {
        for (const [criterion, score] of Object.entries(action.evaluation)) {
          if (criteriaScores[criterion] !== undefined) {
            criteriaScores[criterion] += score;
            criteriaActionCounts[criterion] =
              (criteriaActionCounts[criterion] || 0) + 1;
          }
        }
      }
    }

    // Average scores per criterion
    for (const criterion of Object.keys(criteriaScores)) {
      const count = criteriaActionCounts[criterion] || 1;
      criteriaScores[criterion] = Math.round(criteriaScores[criterion] / count);
    }

    // Calculate weighted overall score
    let weightedSum = 0;
    let totalWeight = 0;

    for (const [criterion, score] of Object.entries(criteriaScores)) {
      const weight = criteriaWeights[criterion] || 10;
      weightedSum += score * weight;
      totalWeight += weight;
    }

    const overallScore =
      totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

    // Generate recommendations
    const recommendations: Array<{
      area: string;
      priority: "high" | "medium" | "low";
      suggestion: string;
    }> = [];

    for (const [criterion, score] of Object.entries(criteriaScores)) {
      if (score < 50) {
        recommendations.push({
          area: criterion,
          priority: "high",
          suggestion: `Mejorar significativamente en ${criterion}. Practique los indicadores clave.`,
        });
      } else if (score < 70) {
        recommendations.push({
          area: criterion,
          priority: "medium",
          suggestion: `Reforzar ${criterion}. Revise los ejemplos y practique más.`,
        });
      }
    }

    return {
      overallScore,
      criteriaScores,
      feedback: {
        totalActions: session.actions.length,
        duration: Math.floor((Date.now() - session.startedAt.getTime()) / 1000),
        summary:
          overallScore >= 70
            ? "Buen desempeño general. Continúe practicando para consolidar las competencias."
            : "Se requiere más práctica. Enfóquese en las áreas de mejora identificadas.",
      },
      recommendations,
    };
  }

  // ============================================
  // SESSION HISTORY
  // ============================================

  async getSessionHistory(
    enrollmentId: string,
    simulationId?: string,
  ): Promise<
    Array<{
      id: string;
      simulationId: string;
      status: string;
      startedAt: Date;
      completedAt: Date | null;
      score: number | null;
      passed: boolean | null;
    }>
  > {
    const where: Record<string, unknown> = { enrollmentId };
    if (simulationId) where.simulationId = simulationId;

    const attempts = await this.prisma.eCSimulationAttempt.findMany({
      where,
      orderBy: { startedAt: "desc" },
      select: {
        id: true,
        simulationId: true,
        status: true,
        startedAt: true,
        completedAt: true,
        score: true,
        passed: true,
      },
    });

    return attempts;
  }

  async getAttemptDetails(attemptId: string) {
    const attempt = await this.prisma.eCSimulationAttempt.findUnique({
      where: { id: attemptId },
      include: {
        simulation: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt ${attemptId} not found`);
    }

    return attempt;
  }
}
