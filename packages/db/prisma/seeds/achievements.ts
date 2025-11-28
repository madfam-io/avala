/**
 * Achievement Definitions Seed Data
 *
 * 16 achievements across 5 categories for gamification system
 * Ported from ec0249 SPA AchievementSystem.js
 *
 * Categories:
 * - FIRST_STEPS: Onboarding (4 achievements)
 * - MODULES: Module completion (4 achievements)
 * - STREAKS: Learning streaks (3 achievements)
 * - PERFORMANCE: Excellence (3 achievements)
 * - COMPLETION: Milestones (2 achievements)
 */

import { AchievementCategory, AchievementRarity } from '@prisma/client';

export interface AchievementSeed {
  code: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  points: number;
  conditions: string[];
  orderIndex: number;
}

// ============================================
// FIRST STEPS - Onboarding Achievements
// ============================================

const firstStepsAchievements: AchievementSeed[] = [
  {
    code: 'welcome',
    title: 'Bienvenido a AVALA',
    titleEn: 'Welcome to AVALA',
    description: 'Accediste por primera vez a la plataforma educativa',
    descriptionEn: 'You accessed the educational platform for the first time',
    category: 'FIRST_STEPS',
    rarity: 'COMMON',
    icon: '👋',
    points: 10,
    conditions: ['first_visit'],
    orderIndex: 1
  },
  {
    code: 'first_video',
    title: 'Primer Video',
    titleEn: 'First Video',
    description: 'Viste tu primer video educativo completo',
    descriptionEn: 'You watched your first complete educational video',
    category: 'FIRST_STEPS',
    rarity: 'COMMON',
    icon: '🎥',
    points: 25,
    conditions: ['videos_watched >= 1'],
    orderIndex: 2
  },
  {
    code: 'first_lesson',
    title: 'Primera Lección',
    titleEn: 'First Lesson',
    description: 'Completaste tu primera lección',
    descriptionEn: 'You completed your first lesson',
    category: 'FIRST_STEPS',
    rarity: 'COMMON',
    icon: '📚',
    points: 50,
    conditions: ['lessons_completed >= 1'],
    orderIndex: 3
  },
  {
    code: 'first_quiz',
    title: 'Primera Evaluación',
    titleEn: 'First Assessment',
    description: 'Completaste tu primera evaluación de conocimientos',
    descriptionEn: 'You completed your first knowledge assessment',
    category: 'FIRST_STEPS',
    rarity: 'COMMON',
    icon: '📝',
    points: 75,
    conditions: ['quizzes_completed >= 1'],
    orderIndex: 4
  }
];

// ============================================
// MODULES - Module Completion Achievements
// ============================================

const moduleAchievements: AchievementSeed[] = [
  {
    code: 'module1_master',
    title: 'Maestro de Fundamentos',
    titleEn: 'Fundamentals Master',
    description: 'Completaste el Módulo 1: Fundamentos de Consultoría',
    descriptionEn: 'You completed Module 1: Consulting Fundamentals',
    category: 'MODULES',
    rarity: 'UNCOMMON',
    icon: '🎯',
    points: 100,
    conditions: ['module1_completed'],
    orderIndex: 5
  },
  {
    code: 'module2_detective',
    title: 'Detective de Problemas',
    titleEn: 'Problem Detective',
    description: 'Completaste el Módulo 2: Identificación del Problema (E0875)',
    descriptionEn: 'You completed Module 2: Problem Identification (E0875)',
    category: 'MODULES',
    rarity: 'UNCOMMON',
    icon: '🔍',
    points: 150,
    conditions: ['module2_completed'],
    orderIndex: 6
  },
  {
    code: 'module3_innovator',
    title: 'Innovador de Soluciones',
    titleEn: 'Solution Innovator',
    description: 'Completaste el Módulo 3: Desarrollo de Soluciones (E0876)',
    descriptionEn: 'You completed Module 3: Solution Development (E0876)',
    category: 'MODULES',
    rarity: 'UNCOMMON',
    icon: '💡',
    points: 150,
    conditions: ['module3_completed'],
    orderIndex: 7
  },
  {
    code: 'module4_presenter',
    title: 'Presentador Experto',
    titleEn: 'Expert Presenter',
    description: 'Completaste el Módulo 4: Presentación de Propuestas (E0877)',
    descriptionEn: 'You completed Module 4: Proposal Presentation (E0877)',
    category: 'MODULES',
    rarity: 'UNCOMMON',
    icon: '📋',
    points: 150,
    conditions: ['module4_completed'],
    orderIndex: 8
  }
];

// ============================================
// STREAKS - Learning Consistency Achievements
// ============================================

const streakAchievements: AchievementSeed[] = [
  {
    code: 'streak_3',
    title: 'Constancia',
    titleEn: 'Consistency',
    description: '3 días consecutivos de actividad en la plataforma',
    descriptionEn: '3 consecutive days of activity on the platform',
    category: 'STREAKS',
    rarity: 'UNCOMMON',
    icon: '🔥',
    points: 60,
    conditions: ['streak >= 3'],
    orderIndex: 9
  },
  {
    code: 'streak_7',
    title: 'Dedicación',
    titleEn: 'Dedication',
    description: '7 días consecutivos de actividad en la plataforma',
    descriptionEn: '7 consecutive days of activity on the platform',
    category: 'STREAKS',
    rarity: 'RARE',
    icon: '💪',
    points: 120,
    conditions: ['streak >= 7'],
    orderIndex: 10
  },
  {
    code: 'streak_30',
    title: 'Compromiso Total',
    titleEn: 'Total Commitment',
    description: '30 días consecutivos de actividad en la plataforma',
    descriptionEn: '30 consecutive days of activity on the platform',
    category: 'STREAKS',
    rarity: 'LEGENDARY',
    icon: '👑',
    points: 300,
    conditions: ['streak >= 30'],
    orderIndex: 11
  }
];

// ============================================
// PERFORMANCE - Excellence Achievements
// ============================================

const performanceAchievements: AchievementSeed[] = [
  {
    code: 'perfectionist',
    title: 'Perfeccionista',
    titleEn: 'Perfectionist',
    description: 'Obtuviste calificación perfecta en 5 evaluaciones',
    descriptionEn: 'You achieved a perfect score in 5 assessments',
    category: 'PERFORMANCE',
    rarity: 'RARE',
    icon: '💯',
    points: 200,
    conditions: ['perfect_scores >= 5'],
    orderIndex: 12
  },
  {
    code: 'video_enthusiast',
    title: 'Entusiasta Visual',
    titleEn: 'Visual Enthusiast',
    description: 'Viste 15 videos educativos completos',
    descriptionEn: 'You watched 15 complete educational videos',
    category: 'PERFORMANCE',
    rarity: 'UNCOMMON',
    icon: '📺',
    points: 100,
    conditions: ['videos_watched >= 15'],
    orderIndex: 13
  },
  {
    code: 'document_generator',
    title: 'Generador de Documentos',
    titleEn: 'Document Generator',
    description: 'Creaste 10 documentos usando las plantillas',
    descriptionEn: 'You created 10 documents using templates',
    category: 'PERFORMANCE',
    rarity: 'RARE',
    icon: '📄',
    points: 150,
    conditions: ['documents_generated >= 10'],
    orderIndex: 14
  }
];

// ============================================
// COMPLETION - Milestone Achievements
// ============================================

const completionAchievements: AchievementSeed[] = [
  {
    code: 'half_way_hero',
    title: 'Héroe de Medio Camino',
    titleEn: 'Halfway Hero',
    description: 'Completaste el 50% de todo el contenido',
    descriptionEn: 'You completed 50% of all content',
    category: 'COMPLETION',
    rarity: 'RARE',
    icon: '⭐',
    points: 175,
    conditions: ['overall_progress >= 50'],
    orderIndex: 15
  },
  {
    code: 'graduate',
    title: 'Graduado',
    titleEn: 'Graduate',
    description: 'Completaste todos los módulos y estás listo para la certificación',
    descriptionEn: 'You completed all modules and are ready for certification',
    category: 'COMPLETION',
    rarity: 'LEGENDARY',
    icon: '🎓',
    points: 500,
    conditions: ['overall_progress >= 100'],
    orderIndex: 16
  }
];

// Export all achievements
export const achievements: AchievementSeed[] = [
  ...firstStepsAchievements,
  ...moduleAchievements,
  ...streakAchievements,
  ...performanceAchievements,
  ...completionAchievements
];

// Summary statistics
export const achievementsSummary = {
  totalAchievements: achievements.length,
  totalPoints: achievements.reduce((sum, a) => sum + a.points, 0),
  byCategory: {
    FIRST_STEPS: firstStepsAchievements.length,
    MODULES: moduleAchievements.length,
    STREAKS: streakAchievements.length,
    PERFORMANCE: performanceAchievements.length,
    COMPLETION: completionAchievements.length
  },
  byRarity: {
    COMMON: achievements.filter(a => a.rarity === 'COMMON').length,
    UNCOMMON: achievements.filter(a => a.rarity === 'UNCOMMON').length,
    RARE: achievements.filter(a => a.rarity === 'RARE').length,
    LEGENDARY: achievements.filter(a => a.rarity === 'LEGENDARY').length
  },
  levelThresholds: [0, 100, 250, 500, 850, 1300, 1850, 2500, 3250, 4100, 5000]
};
