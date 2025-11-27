/**
 * @avala/assessment-engine
 *
 * Assessment engine for EC-aligned competency evaluations
 * Ported from ec0249 with TypeScript enhancements
 */

// Types
export * from './types';

// Question Types
export {
  SUPPORTED_TYPES,
  TYPE_DISPLAY_NAMES,
  TYPE_ICONS,
  normalizeText,
  calculateSimilarity,
  validateQuestion,
  validateMultipleChoice,
  validateTrueFalse,
  validateShortAnswer,
  validateEssay,
  validateMatching,
  validateOrdering,
  validateFillBlank,
  evaluateQuestion,
  evaluateMultipleChoice,
  evaluateTrueFalse,
  evaluateShortAnswer,
  evaluateEssay,
  evaluateMatching,
  evaluateOrdering,
  evaluateFillBlank,
  getTypeDisplayName,
  getTypeIcon,
} from './question-types';

// Scoring
export {
  calculateScore,
  standardScoring,
  weightedScoring,
  competencyScoring,
  getGradeLetter,
  getGradeDescription,
  calculateTimeBonus,
  generatePerformanceReport,
  DEFAULT_QUESTION_WEIGHTS,
  DEFAULT_CRITERION_WEIGHTS,
} from './scoring';

// Assessment Engine class for stateful session management
import type {
  Assessment,
  AssessmentSession,
  Question,
  QuestionResponse,
  ScoreResult,
  ScoringOptions,
} from './types';
import { calculateScore } from './scoring';
import { validateQuestion } from './question-types';

export interface AssessmentEngineConfig {
  autoSave?: boolean;
  saveInterval?: number;
  minPassingScore?: number;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
}

export interface StartAssessmentOptions {
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  timeLimit?: number;
  scoringMethod?: 'standard' | 'weighted' | 'competency' | 'adaptive';
}

/**
 * Assessment Engine - Manages assessment sessions
 */
export class AssessmentEngine {
  private config: Required<AssessmentEngineConfig>;
  private sessions: Map<string, AssessmentSession> = new Map();
  private responses: Map<string, Map<string, QuestionResponse>> = new Map();

  constructor(config: AssessmentEngineConfig = {}) {
    this.config = {
      autoSave: config.autoSave ?? true,
      saveInterval: config.saveInterval ?? 30000,
      minPassingScore: config.minPassingScore ?? 70,
      maxAttempts: config.maxAttempts ?? 3,
      shuffleQuestions: config.shuffleQuestions ?? true,
      shuffleOptions: config.shuffleOptions ?? true,
    };
  }

  /**
   * Start a new assessment session
   */
  startAssessment(
    assessment: Assessment,
    userId: string,
    options: StartAssessmentOptions = {}
  ): AssessmentSession {
    // Validate all questions
    for (const question of assessment.questions) {
      if (!validateQuestion(question)) {
        throw new Error(`Invalid question: ${question.id}`);
      }
    }

    // Prepare question order (optionally shuffled)
    let questionOrder = assessment.questions.map((q) => q.id);
    if (options.shuffleQuestions ?? this.config.shuffleQuestions) {
      questionOrder = this.shuffleArray(questionOrder);
    }

    // Create session
    const sessionId = this.generateSessionId();
    const session: AssessmentSession = {
      id: sessionId,
      assessmentId: assessment.id,
      userId,
      status: 'in_progress',
      currentQuestionIndex: 0,
      questionOrder,
      startedAt: new Date(),
      timeRemaining: options.timeLimit ?? assessment.timeLimit,
      responses: new Map(),
    };

    this.sessions.set(sessionId, session);
    this.responses.set(sessionId, new Map());

    return session;
  }

  /**
   * Get current question for session
   */
  getCurrentQuestion(
    sessionId: string,
    assessment: Assessment
  ): Question | null {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'in_progress') {
      return null;
    }

    const questionId = session.questionOrder[session.currentQuestionIndex];
    return assessment.questions.find((q) => q.id === questionId) || null;
  }

  /**
   * Submit answer for current question
   */
  submitAnswer(
    sessionId: string,
    questionId: string,
    answer: unknown,
    timeSpent: number
  ): { nextQuestionIndex: number; isComplete: boolean } {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'in_progress') {
      throw new Error('Invalid session');
    }

    // Store response
    const responseMap = this.responses.get(sessionId)!;
    responseMap.set(questionId, {
      questionId,
      answer,
      timestamp: new Date(),
      timeSpent,
    });

    // Move to next question
    session.currentQuestionIndex++;
    const isComplete = session.currentQuestionIndex >= session.questionOrder.length;

    if (isComplete) {
      session.status = 'completed';
      session.completedAt = new Date();
    }

    return {
      nextQuestionIndex: session.currentQuestionIndex,
      isComplete,
    };
  }

  /**
   * Complete assessment and calculate score
   */
  completeAssessment(
    sessionId: string,
    assessment: Assessment,
    options: ScoringOptions = {}
  ): ScoreResult {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Mark as completed
    session.status = 'completed';
    session.completedAt = new Date();

    // Get responses
    const responseMap = this.responses.get(sessionId)!;
    const responsesForScoring = new Map<string, unknown>();
    for (const [qId, response] of responseMap) {
      responsesForScoring.set(qId, response.answer);
    }

    // Calculate time spent
    const timeSpent = session.completedAt
      ? (session.completedAt.getTime() - session.startedAt.getTime()) / 1000
      : undefined;

    // Calculate score
    return calculateScore(assessment, responsesForScoring, {
      ...options,
      timeSpent,
      includeTimeBonus: true,
    });
  }

  /**
   * Pause assessment session
   */
  pauseSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session && session.status === 'in_progress') {
      session.status = 'paused';
      session.pausedAt = new Date();
    }
  }

  /**
   * Resume paused session
   */
  resumeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session && session.status === 'paused') {
      session.status = 'in_progress';
      session.pausedAt = undefined;
    }
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): AssessmentSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get responses for session
   */
  getResponses(sessionId: string): Map<string, QuestionResponse> | undefined {
    return this.responses.get(sessionId);
  }

  /**
   * Calculate progress percentage
   */
  getProgress(sessionId: string): number {
    const session = this.sessions.get(sessionId);
    if (!session) return 0;
    return (session.currentQuestionIndex / session.questionOrder.length) * 100;
  }

  /**
   * Shuffle array (Fisher-Yates)
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

// Default export
export default AssessmentEngine;
