/**
 * Scoring Engine - Assessment scoring and evaluation logic
 *
 * Ported from ec0249 ScoringEngine.js with TypeScript enhancements
 */

import type {
  Assessment,
  Question,
  QuestionResult,
  ScoreResult,
  ScoringOptions,
  CompetencyResult,
  PerformanceReport,
} from '../types';
import { evaluateQuestion } from '../question-types';

// ============================================
// Grade Calculation
// ============================================

/**
 * Get grade letter based on percentage
 */
export function getGradeLetter(percentage: number): string {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

/**
 * Get grade description in Spanish
 */
export function getGradeDescription(grade: string): string {
  const descriptions: Record<string, string> = {
    A: 'Excelente',
    B: 'Muy Bien',
    C: 'Bien',
    D: 'Suficiente',
    F: 'Insuficiente',
  };
  return descriptions[grade] || 'Sin calificación';
}

/**
 * Calculate time bonus for fast completion
 */
export function calculateTimeBonus(
  timeSpent: number | undefined,
  timeLimit: number | undefined
): number {
  if (!timeSpent || !timeLimit || timeSpent >= timeLimit) {
    return 0;
  }

  const timeRatio = timeSpent / timeLimit;

  // Give bonus for completing in less than 75% of time
  if (timeRatio < 0.75) {
    return Math.round((0.75 - timeRatio) * 10); // Up to 7.5 bonus points
  }

  return 0;
}

// ============================================
// Default Weights
// ============================================

/**
 * Default weights for question types
 */
export const DEFAULT_QUESTION_WEIGHTS: Record<string, number> = {
  multiple_choice: 1.0,
  true_false: 0.8,
  short_answer: 1.2,
  essay: 1.5,
  matching: 1.1,
  ordering: 1.2,
  fill_blank: 1.0,
  hotspot: 1.3,
  drag_drop: 1.2,
};

/**
 * Default weights for criterion types (EC alignment)
 */
export const DEFAULT_CRITERION_WEIGHTS: Record<string, number> = {
  DESEMPENO: 1.3, // Performance criteria weighted higher
  CONOCIMIENTO: 1.0,
  PRODUCTO: 1.2,
  ACTITUD: 0.8,
};

// ============================================
// Scoring Methods
// ============================================

/**
 * Standard scoring - equal weight for all questions
 */
export function standardScoring(
  assessment: Assessment,
  responses: Map<string, unknown>,
  options: ScoringOptions = {}
): ScoreResult {
  let totalPoints = 0;
  let maxPoints = 0;
  let correctAnswers = 0;
  const questionResults: QuestionResult[] = [];
  const manualReviewQuestions: string[] = [];

  for (const question of assessment.questions) {
    const response = responses.get(question.id);
    const questionPoints = question.points || 10;
    maxPoints += questionPoints;

    if (response !== undefined) {
      const result = evaluateQuestion(question, response);
      totalPoints += result.points;

      if (result.isCorrect) {
        correctAnswers++;
      }

      if (result.requiresManualReview) {
        manualReviewQuestions.push(question.id);
      }

      questionResults.push(result);
    } else {
      questionResults.push({
        questionId: question.id,
        isCorrect: false,
        points: 0,
        maxPoints: questionPoints,
        userAnswer: null,
      });
    }
  }

  const percentage = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
  const passed = percentage >= (assessment.passingScore || 70);
  const timeBonus = options.includeTimeBonus
    ? calculateTimeBonus(options.timeSpent, assessment.timeLimit)
    : 0;

  return {
    totalPoints,
    maxPoints,
    percentage,
    correctAnswers,
    totalQuestions: assessment.questions.length,
    passed,
    passingScore: assessment.passingScore || 70,
    questionResults,
    gradeLetter: getGradeLetter(percentage),
    timeBonus,
    finalScore: Math.min(percentage + timeBonus, 100),
    scoringMethod: 'standard',
    requiresManualReview: manualReviewQuestions.length > 0,
    manualReviewQuestions,
  };
}

/**
 * Weighted scoring - different weights for question types
 */
export function weightedScoring(
  assessment: Assessment,
  responses: Map<string, unknown>,
  options: ScoringOptions = {}
): ScoreResult {
  const weights = options.weights || DEFAULT_QUESTION_WEIGHTS;
  let totalWeightedPoints = 0;
  let maxWeightedPoints = 0;
  let correctAnswers = 0;
  const questionResults: QuestionResult[] = [];
  const manualReviewQuestions: string[] = [];

  for (const question of assessment.questions) {
    const response = responses.get(question.id);
    const weight = weights[question.type] || 1;
    const basePoints = question.points || 10;
    const weightedMaxPoints = basePoints * weight;

    maxWeightedPoints += weightedMaxPoints;

    if (response !== undefined) {
      const result = evaluateQuestion(question, response);
      const weightedPoints = result.isCorrect ? weightedMaxPoints : (result.partialCredit || 0) * weightedMaxPoints;
      totalWeightedPoints += weightedPoints;

      if (result.isCorrect) {
        correctAnswers++;
      }

      if (result.requiresManualReview) {
        manualReviewQuestions.push(question.id);
      }

      questionResults.push({
        ...result,
        points: Math.round(weightedPoints),
        maxPoints: Math.round(weightedMaxPoints),
      });
    } else {
      questionResults.push({
        questionId: question.id,
        isCorrect: false,
        points: 0,
        maxPoints: Math.round(weightedMaxPoints),
        userAnswer: null,
      });
    }
  }

  const percentage =
    maxWeightedPoints > 0 ? Math.round((totalWeightedPoints / maxWeightedPoints) * 100) : 0;
  const passed = percentage >= (assessment.passingScore || 70);

  return {
    totalPoints: Math.round(totalWeightedPoints),
    maxPoints: Math.round(maxWeightedPoints),
    percentage,
    correctAnswers,
    totalQuestions: assessment.questions.length,
    passed,
    passingScore: assessment.passingScore || 70,
    questionResults,
    gradeLetter: getGradeLetter(percentage),
    finalScore: percentage,
    scoringMethod: 'weighted',
    requiresManualReview: manualReviewQuestions.length > 0,
    manualReviewQuestions,
  };
}

/**
 * Group questions by competency (EC code or criterion type)
 */
function groupQuestionsByCompetency(
  questions: Question[]
): Map<string, Question[]> {
  const groups = new Map<string, Question[]>();

  for (const question of questions) {
    // Group by EC code if available, otherwise by criterion type, otherwise 'general'
    const competency =
      question.ecCode || question.criterionType || 'general';

    if (!groups.has(competency)) {
      groups.set(competency, []);
    }
    groups.get(competency)!.push(question);
  }

  return groups;
}

/**
 * Competency-based scoring - evaluates by EC competency elements
 */
export function competencyScoring(
  assessment: Assessment,
  responses: Map<string, unknown>,
  options: ScoringOptions = {}
): ScoreResult {
  const competencyGroups = groupQuestionsByCompetency(assessment.questions);
  const competencyResults: Record<string, CompetencyResult> = {};
  let overallScore = 0;
  let totalQuestions = 0;
  let correctAnswers = 0;
  const questionResults: QuestionResult[] = [];
  const manualReviewQuestions: string[] = [];

  for (const [competency, questions] of competencyGroups) {
    let competencyPoints = 0;
    let competencyMaxPoints = 0;
    let competencyCorrect = 0;
    const competencyQuestionResults: QuestionResult[] = [];

    for (const question of questions) {
      const response = responses.get(question.id);
      const questionPoints = question.points || 10;
      competencyMaxPoints += questionPoints;
      totalQuestions++;

      if (response !== undefined) {
        const result = evaluateQuestion(question, response);
        competencyPoints += result.points;

        if (result.isCorrect) {
          competencyCorrect++;
          correctAnswers++;
        }

        if (result.requiresManualReview) {
          manualReviewQuestions.push(question.id);
        }

        questionResults.push({ ...result, feedback: `[${competency}] ${result.feedback || ''}` });
        competencyQuestionResults.push(result);
      } else {
        const emptyResult: QuestionResult = {
          questionId: question.id,
          isCorrect: false,
          points: 0,
          maxPoints: questionPoints,
          userAnswer: null,
        };
        questionResults.push(emptyResult);
        competencyQuestionResults.push(emptyResult);
      }
    }

    const competencyPercentage =
      competencyMaxPoints > 0
        ? Math.round((competencyPoints / competencyMaxPoints) * 100)
        : 0;

    competencyResults[competency] = {
      competency,
      ecCode: questions[0]?.ecCode,
      criterionType: questions[0]?.criterionType,
      points: competencyPoints,
      maxPoints: competencyMaxPoints,
      percentage: competencyPercentage,
      passed: competencyPercentage >= (options.competencyThreshold || 70),
      questionResults: competencyQuestionResults,
    };

    overallScore += competencyPercentage;
  }

  const averageScore =
    competencyGroups.size > 0 ? Math.round(overallScore / competencyGroups.size) : 0;
  const allCompetenciesPassed = Object.values(competencyResults).every(
    (comp) => comp.passed
  );

  return {
    totalPoints: Object.values(competencyResults).reduce((sum, c) => sum + c.points, 0),
    maxPoints: Object.values(competencyResults).reduce((sum, c) => sum + c.maxPoints, 0),
    percentage: averageScore,
    correctAnswers,
    totalQuestions,
    passed: allCompetenciesPassed && averageScore >= (assessment.passingScore || 70),
    passingScore: assessment.passingScore || 70,
    questionResults,
    competencyResults,
    gradeLetter: getGradeLetter(averageScore),
    finalScore: averageScore,
    scoringMethod: 'competency',
    requiresManualReview: manualReviewQuestions.length > 0,
    manualReviewQuestions,
  };
}

// ============================================
// Main Scoring Function
// ============================================

/**
 * Calculate assessment score using the specified method
 */
export function calculateScore(
  assessment: Assessment,
  responses: Map<string, unknown>,
  options: ScoringOptions = {}
): ScoreResult {
  const method = options.method || assessment.scoringMethod || 'standard';

  switch (method) {
    case 'standard':
      return standardScoring(assessment, responses, options);
    case 'weighted':
      return weightedScoring(assessment, responses, options);
    case 'competency':
      return competencyScoring(assessment, responses, options);
    case 'adaptive':
      // Adaptive scoring falls back to standard for now
      return standardScoring(assessment, responses, options);
    default:
      throw new Error(`Unknown scoring method: ${method}`);
  }
}

// ============================================
// Reporting
// ============================================

/**
 * Generate detailed performance report
 */
export function generatePerformanceReport(
  scoreResult: ScoreResult,
  assessment: Assessment
): PerformanceReport {
  const report: PerformanceReport = {
    summary: {
      score: scoreResult.percentage,
      grade: scoreResult.gradeLetter,
      passed: scoreResult.passed,
      totalQuestions: scoreResult.totalQuestions,
      correctAnswers: scoreResult.correctAnswers,
    },
    performance: {
      strengths: [],
      weaknesses: [],
      recommendations: [],
    },
    details: scoreResult.questionResults,
  };

  // Analyze competency performance
  if (scoreResult.competencyResults) {
    report.competencyAnalysis = scoreResult.competencyResults;

    // Identify strengths and weaknesses
    for (const [competency, result] of Object.entries(scoreResult.competencyResults)) {
      if (result.percentage >= 80) {
        report.performance.strengths.push(`Excelente dominio de ${competency}`);
      } else if (result.percentage < 60) {
        report.performance.weaknesses.push(`Necesita mejorar en ${competency}`);
        report.performance.recommendations.push(
          `Revisar contenido relacionado con ${competency}`
        );
      }
    }
  }

  // Analyze by question type if no competency analysis
  if (!scoreResult.competencyResults) {
    const typePerformance = new Map<string, { correct: number; total: number }>();

    for (let i = 0; i < assessment.questions.length; i++) {
      const question = assessment.questions[i];
      const result = scoreResult.questionResults[i];

      if (!typePerformance.has(question.type)) {
        typePerformance.set(question.type, { correct: 0, total: 0 });
      }

      const perf = typePerformance.get(question.type)!;
      perf.total++;
      if (result.isCorrect) {
        perf.correct++;
      }
    }

    for (const [type, perf] of typePerformance) {
      const pct = (perf.correct / perf.total) * 100;
      if (pct >= 80) {
        report.performance.strengths.push(`Buen desempeño en preguntas de ${type}`);
      } else if (pct < 50) {
        report.performance.weaknesses.push(`Dificultad con preguntas de ${type}`);
      }
    }
  }

  // General recommendations based on score
  if (scoreResult.percentage < 70) {
    report.performance.recommendations.push(
      'Revisar el material del curso antes de volver a intentar'
    );
  }
  if (scoreResult.requiresManualReview) {
    report.performance.recommendations.push(
      'Algunas respuestas requieren revisión manual del instructor'
    );
  }

  return report;
}

// ============================================
// Exports
// ============================================

export {
  calculateScore as default,
  type ScoreResult,
  type ScoringOptions,
  type CompetencyResult,
  type PerformanceReport,
};
