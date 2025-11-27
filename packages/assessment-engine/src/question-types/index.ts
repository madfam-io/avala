/**
 * Question Types - Handlers for different assessment question types
 *
 * Ported from ec0249 QuestionTypes.js with TypeScript enhancements
 */

import type {
  Question,
  QuestionType,
  QuestionResult,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  ShortAnswerQuestion,
  EssayQuestion,
  MatchingQuestion,
  OrderingQuestion,
  FillBlankQuestion,
} from '../types';

// Re-export types
export * from '../types';

/**
 * Supported question types
 */
export const SUPPORTED_TYPES: QuestionType[] = [
  'multiple_choice',
  'true_false',
  'short_answer',
  'essay',
  'matching',
  'ordering',
  'fill_blank',
  'hotspot',
  'drag_drop',
];

/**
 * Question type display names (Spanish)
 */
export const TYPE_DISPLAY_NAMES: Record<QuestionType, string> = {
  multiple_choice: 'Opción Múltiple',
  true_false: 'Verdadero/Falso',
  short_answer: 'Respuesta Corta',
  essay: 'Ensayo',
  matching: 'Relacionar Columnas',
  ordering: 'Ordenamiento',
  fill_blank: 'Completar Espacios',
  hotspot: 'Zona Activa',
  drag_drop: 'Arrastrar y Soltar',
};

/**
 * Question type icons
 */
export const TYPE_ICONS: Record<QuestionType, string> = {
  multiple_choice: '☑️',
  true_false: '✅',
  short_answer: '✏️',
  essay: '📝',
  matching: '🔗',
  ordering: '🔢',
  fill_blank: '📋',
  hotspot: '🎯',
  drag_drop: '🖱️',
};

/**
 * Normalize text for comparison
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate similarity between two texts using keyword matching
 */
export function calculateSimilarity(userText: string, referenceText: string): number {
  const userWords = new Set(normalizeText(userText).split(' ').filter(Boolean));
  const refWords = normalizeText(referenceText).split(' ').filter(Boolean);

  if (refWords.length === 0) return 0;

  let matches = 0;
  for (const word of refWords) {
    if (userWords.has(word)) {
      matches++;
    }
  }

  return matches / refWords.length;
}

// ============================================
// Question Validators
// ============================================

/**
 * Validate multiple choice question structure
 */
export function validateMultipleChoice(question: MultipleChoiceQuestion): boolean {
  return (
    question.options &&
    Array.isArray(question.options) &&
    question.options.length >= 2 &&
    typeof question.correct === 'number' &&
    question.correct >= 0 &&
    question.correct < question.options.length
  );
}

/**
 * Validate true/false question structure
 */
export function validateTrueFalse(question: TrueFalseQuestion): boolean {
  return typeof question.correct === 'boolean';
}

/**
 * Validate short answer question structure
 */
export function validateShortAnswer(question: ShortAnswerQuestion): boolean {
  return (
    question.sampleAnswer &&
    typeof question.sampleAnswer === 'string' &&
    question.sampleAnswer.length > 0
  );
}

/**
 * Validate essay question structure
 */
export function validateEssay(question: EssayQuestion): boolean {
  return (
    question.rubric && Array.isArray(question.rubric) && question.rubric.length > 0
  );
}

/**
 * Validate matching question structure
 */
export function validateMatching(question: MatchingQuestion): boolean {
  return (
    question.pairs &&
    Array.isArray(question.pairs) &&
    question.pairs.length >= 2 &&
    question.pairs.every((pair) => pair.left && pair.right)
  );
}

/**
 * Validate ordering question structure
 */
export function validateOrdering(question: OrderingQuestion): boolean {
  return (
    question.items &&
    Array.isArray(question.items) &&
    question.items.length >= 2 &&
    question.correctOrder &&
    Array.isArray(question.correctOrder) &&
    question.correctOrder.length === question.items.length
  );
}

/**
 * Validate fill-in-the-blank question structure
 */
export function validateFillBlank(question: FillBlankQuestion): boolean {
  return (
    question.template &&
    typeof question.template === 'string' &&
    question.blanks &&
    Array.isArray(question.blanks) &&
    question.blanks.length > 0 &&
    question.blanks.every(
      (blank) =>
        blank.id &&
        blank.acceptedAnswers &&
        Array.isArray(blank.acceptedAnswers) &&
        blank.acceptedAnswers.length > 0
    )
  );
}

/**
 * Validate any question structure
 */
export function validateQuestion(question: Question): boolean {
  if (!question.id || !question.type || !question.question) {
    return false;
  }

  if (!SUPPORTED_TYPES.includes(question.type)) {
    return false;
  }

  switch (question.type) {
    case 'multiple_choice':
      return validateMultipleChoice(question as MultipleChoiceQuestion);
    case 'true_false':
      return validateTrueFalse(question as TrueFalseQuestion);
    case 'short_answer':
      return validateShortAnswer(question as ShortAnswerQuestion);
    case 'essay':
      return validateEssay(question as EssayQuestion);
    case 'matching':
      return validateMatching(question as MatchingQuestion);
    case 'ordering':
      return validateOrdering(question as OrderingQuestion);
    case 'fill_blank':
      return validateFillBlank(question as FillBlankQuestion);
    default:
      return true; // hotspot, drag_drop - validated by schema
  }
}

// ============================================
// Question Evaluators
// ============================================

/**
 * Evaluate multiple choice answer
 */
export function evaluateMultipleChoice(
  question: MultipleChoiceQuestion,
  userAnswer: number | number[]
): QuestionResult {
  let isCorrect: boolean;

  if (question.multiSelect && question.correctMultiple) {
    // Multi-select: check all correct answers
    const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
    const correctSet = new Set(question.correctMultiple);
    const userSet = new Set(userAnswers);

    isCorrect =
      correctSet.size === userSet.size &&
      [...correctSet].every((v) => userSet.has(v));
  } else {
    // Single select
    isCorrect = userAnswer === question.correct;
  }

  const points = isCorrect ? (question.points || 10) : 0;

  return {
    questionId: question.id,
    isCorrect,
    points,
    maxPoints: question.points || 10,
    feedback: question.explanation || '',
    correctAnswer: question.multiSelect ? question.correctMultiple : question.correct,
    userAnswer,
  };
}

/**
 * Evaluate true/false answer
 */
export function evaluateTrueFalse(
  question: TrueFalseQuestion,
  userAnswer: boolean
): QuestionResult {
  const isCorrect = userAnswer === question.correct;
  const points = isCorrect ? (question.points || 10) : 0;

  return {
    questionId: question.id,
    isCorrect,
    points,
    maxPoints: question.points || 10,
    feedback: question.explanation || '',
    correctAnswer: question.correct,
    userAnswer,
  };
}

/**
 * Evaluate short answer
 */
export function evaluateShortAnswer(
  question: ShortAnswerQuestion,
  userAnswer: string
): QuestionResult {
  const maxPoints = question.points || 10;

  // Check exact match first
  if (question.exactMatch) {
    const normalizedUser = question.caseSensitive
      ? userAnswer.trim()
      : normalizeText(userAnswer);
    const normalizedSample = question.caseSensitive
      ? question.sampleAnswer.trim()
      : normalizeText(question.sampleAnswer);

    const isCorrect = normalizedUser === normalizedSample;
    return {
      questionId: question.id,
      isCorrect,
      points: isCorrect ? maxPoints : 0,
      maxPoints,
      feedback: question.explanation || '',
      correctAnswer: question.sampleAnswer,
      userAnswer,
    };
  }

  // Keyword-based similarity
  let similarity: number;

  if (question.keywords && question.keywords.length > 0) {
    // Check against keywords
    const normalizedUser = normalizeText(userAnswer);
    const matchedKeywords = question.keywords.filter((kw) =>
      normalizedUser.includes(normalizeText(kw))
    );
    similarity = matchedKeywords.length / question.keywords.length;
  } else {
    // Compare against sample answer
    similarity = calculateSimilarity(userAnswer, question.sampleAnswer);
  }

  const isCorrect = similarity >= 0.6; // 60% threshold
  const partialPoints = Math.floor(maxPoints * similarity);
  const points = isCorrect ? maxPoints : partialPoints;

  return {
    questionId: question.id,
    isCorrect,
    points,
    maxPoints,
    feedback: question.explanation || '',
    correctAnswer: question.sampleAnswer,
    userAnswer,
    requiresManualReview: similarity >= 0.4 && similarity < 0.8,
    partialCredit: similarity,
  };
}

/**
 * Evaluate essay answer (requires manual review)
 */
export function evaluateEssay(
  question: EssayQuestion,
  userAnswer: string
): QuestionResult {
  const maxPoints = question.points || 10;

  // Check minimum word count if specified
  const wordCount = userAnswer.trim().split(/\s+/).length;
  const meetsMinWords = !question.minWords || wordCount >= question.minWords;
  const meetsMaxWords = !question.maxWords || wordCount <= question.maxWords;

  return {
    questionId: question.id,
    isCorrect: false, // To be determined by manual review
    points: 0, // To be assigned manually
    maxPoints,
    feedback: !meetsMinWords
      ? `Respuesta muy corta. Mínimo ${question.minWords} palabras.`
      : !meetsMaxWords
        ? `Respuesta muy larga. Máximo ${question.maxWords} palabras.`
        : 'Esta respuesta requiere revisión manual.',
    userAnswer,
    requiresManualReview: true,
  };
}

/**
 * Evaluate matching answer
 */
export function evaluateMatching(
  question: MatchingQuestion,
  userAnswer: Array<{ left: string; right: string }>
): QuestionResult {
  const maxPoints = question.points || 10;

  if (!Array.isArray(userAnswer)) {
    return {
      questionId: question.id,
      isCorrect: false,
      points: 0,
      maxPoints,
      feedback: 'Respuesta inválida',
      correctAnswer: question.pairs,
      userAnswer,
    };
  }

  const correctPairs = question.pairs;
  let correctMatches = 0;

  for (const userPair of userAnswer) {
    const isMatch = correctPairs.some(
      (pair) => pair.left === userPair.left && pair.right === userPair.right
    );
    if (isMatch) {
      correctMatches++;
    }
  }

  const score = correctMatches / correctPairs.length;
  const isCorrect = score >= 0.8; // 80% threshold
  const points = Math.floor(maxPoints * score);

  return {
    questionId: question.id,
    isCorrect,
    points,
    maxPoints,
    feedback: question.explanation || '',
    correctAnswer: question.pairs,
    userAnswer,
    partialCredit: score,
  };
}

/**
 * Evaluate ordering answer
 */
export function evaluateOrdering(
  question: OrderingQuestion,
  userAnswer: number[]
): QuestionResult {
  const maxPoints = question.points || 10;

  if (!Array.isArray(userAnswer) || userAnswer.length !== question.correctOrder.length) {
    return {
      questionId: question.id,
      isCorrect: false,
      points: 0,
      maxPoints,
      feedback: 'Respuesta inválida',
      correctAnswer: question.correctOrder,
      userAnswer,
    };
  }

  let correctPositions = 0;
  for (let i = 0; i < userAnswer.length; i++) {
    if (userAnswer[i] === question.correctOrder[i]) {
      correctPositions++;
    }
  }

  const score = correctPositions / question.correctOrder.length;
  const isCorrect = score === 1; // Must be fully correct
  const points = isCorrect ? maxPoints : Math.floor(maxPoints * score * 0.5); // Partial credit is halved

  return {
    questionId: question.id,
    isCorrect,
    points,
    maxPoints,
    feedback: question.explanation || '',
    correctAnswer: question.correctOrder,
    userAnswer,
    partialCredit: score,
  };
}

/**
 * Evaluate fill-in-the-blank answer
 */
export function evaluateFillBlank(
  question: FillBlankQuestion,
  userAnswer: Record<string, string>
): QuestionResult {
  const maxPoints = question.points || 10;
  const pointsPerBlank = maxPoints / question.blanks.length;

  let totalPoints = 0;
  let correctBlanks = 0;

  for (const blank of question.blanks) {
    const userValue = userAnswer[blank.id] || '';
    const normalizedUser = blank.caseSensitive
      ? userValue.trim()
      : normalizeText(userValue);

    const isMatch = blank.acceptedAnswers.some((accepted) => {
      const normalizedAccepted = blank.caseSensitive
        ? accepted.trim()
        : normalizeText(accepted);
      return normalizedUser === normalizedAccepted;
    });

    if (isMatch) {
      correctBlanks++;
      totalPoints += pointsPerBlank;
    }
  }

  const score = correctBlanks / question.blanks.length;
  const isCorrect = score >= 0.8; // 80% threshold
  const points = Math.round(totalPoints);

  return {
    questionId: question.id,
    isCorrect,
    points,
    maxPoints,
    feedback: question.explanation || '',
    correctAnswer: question.blanks.reduce(
      (acc, b) => ({ ...acc, [b.id]: b.acceptedAnswers[0] }),
      {}
    ),
    userAnswer,
    partialCredit: score,
  };
}

/**
 * Evaluate any question type
 */
export function evaluateQuestion(question: Question, userAnswer: unknown): QuestionResult {
  if (!validateQuestion(question)) {
    throw new Error('Invalid question structure');
  }

  switch (question.type) {
    case 'multiple_choice':
      return evaluateMultipleChoice(
        question as MultipleChoiceQuestion,
        userAnswer as number | number[]
      );
    case 'true_false':
      return evaluateTrueFalse(question as TrueFalseQuestion, userAnswer as boolean);
    case 'short_answer':
      return evaluateShortAnswer(question as ShortAnswerQuestion, userAnswer as string);
    case 'essay':
      return evaluateEssay(question as EssayQuestion, userAnswer as string);
    case 'matching':
      return evaluateMatching(
        question as MatchingQuestion,
        userAnswer as Array<{ left: string; right: string }>
      );
    case 'ordering':
      return evaluateOrdering(question as OrderingQuestion, userAnswer as number[]);
    case 'fill_blank':
      return evaluateFillBlank(
        question as FillBlankQuestion,
        userAnswer as Record<string, string>
      );
    default:
      throw new Error(`Unsupported question type: ${question.type}`);
  }
}

/**
 * Get display name for question type
 */
export function getTypeDisplayName(type: QuestionType): string {
  return TYPE_DISPLAY_NAMES[type] || type;
}

/**
 * Get icon for question type
 */
export function getTypeIcon(type: QuestionType): string {
  return TYPE_ICONS[type] || '❓';
}
