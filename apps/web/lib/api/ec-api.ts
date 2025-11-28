/**
 * EC Training API Client
 *
 * Provides typed API methods for interacting with the Multi-EC training system.
 * Supports EC0249, EC0217, and other CONOCER competency standards.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

// ============================================
// TYPES
// ============================================

export interface ECStandard {
  id: string;
  code: string;
  version: string;
  title: string;
  name?: string; // Alias for title
  titleEn?: string;
  description: string;
  issuer: string;
  sector?: string;
  level: number;
  status: "DRAFT" | "PUBLISHED" | "DEPRECATED";
  estimatedHours: number;
  dc3Eligible: boolean;
  thumbnailUrl?: string;
  imageUrl?: string; // Alias for thumbnailUrl
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  prerequisites?: string;
  enrollmentCount?: number;
  modules?: ECModule[];
  elements?: ECElement[];
  _count?: {
    elements: number;
    modules: number;
    templates: number;
    assessments: number;
    simulations: number;
    enrollments: number;
  };
}

export interface ECElement {
  id: string;
  ecId: string;
  code: string;
  title: string;
  titleEn?: string;
  description: string;
  orderIndex: number;
  requiredDocuments: number;
  requiredScore: number;
  performanceCriteria: string[];
  knowledgeCriteria: string[];
  productCriteria: string[];
}

export interface ECModule {
  id: string;
  ecId: string;
  code: string;
  title: string;
  titleEn?: string;
  description?: string;
  icon?: string;
  orderIndex: number;
  estimatedMinutes: number;
  isRequired: boolean;
  lessons?: ECLesson[];
  _count?: {
    lessons: number;
    assessments: number;
  };
}

export interface ECLesson {
  id: string;
  moduleId: string;
  code: string;
  title: string;
  titleEn?: string;
  orderIndex: number;
  sections: LessonSection[];
  videoId?: string;
  videoDuration?: number;
  estimatedMinutes: number;
  isRequired: boolean;
}

export interface LessonSection {
  id: string;
  title: string;
  titleEn?: string;
  content?: string;
  type?: "text" | "video" | "interactive" | "quiz";
}

export interface ECEnrollment {
  id: string;
  userId: string;
  ecId: string;
  tenantId: string;
  status: "IN_PROGRESS" | "COMPLETED" | "CERTIFIED" | "EXPIRED";
  enrolledAt: string;
  completedAt?: string;
  overallProgress: number;
  progress?: number; // Alias for overallProgress
  progressPercentage?: number; // Alias for overallProgress
  currentLessonId?: string;
  ec?: {
    code: string;
    title: string;
    description: string;
    thumbnailUrl?: string;
    estimatedHours: number;
  };
  moduleProgress?: ModuleProgress[];
  lessonProgress?: LessonProgress[];
}

export interface ModuleProgress {
  id: string;
  enrollmentId: string;
  moduleId: string;
  progress: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  startedAt?: string;
  completedAt?: string;
  module?: {
    code: string;
    title: string;
    icon?: string;
    estimatedMinutes: number;
  };
}

export interface LessonProgress {
  id: string;
  enrollmentId: string;
  lessonId: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  videoProgress: number;
  startedAt?: string;
  completedAt?: string;
  lesson?: {
    code: string;
    title: string;
    videoId?: string;
    estimatedMinutes: number;
  };
}

export interface ProgressSummary {
  enrollmentId: string;
  ecCode: string;
  overallProgress: number;
  status: string;
  modulesCompleted: number;
  modulesTotal: number;
  lessonsCompleted: number;
  lessonsTotal: number;
  videosWatched: number;
  videosTotal: number;
  assessmentsPassed: number;
  assessmentsTotal: number;
  documentsCompleted: number;
  documentsTotal: number;
  estimatedTimeRemaining: number;
  timeSpent: number;
  nextLesson?: {
    id: string;
    moduleId: string;
    title: string;
  };
  certificationReady: boolean;
}

export type DocumentTemplate = ECTemplate;

export interface ECTemplate {
  id: string;
  ecId: string;
  elementId: string;
  code: string;
  title: string;
  name?: string; // Alias for title
  titleEn?: string;
  description?: string;
  category: "REQUIRED" | "OPTIONAL" | "SUPPLEMENTARY";
  orderIndex: number;
  supportVideoId?: string;
  supportVideoTitle?: string;
  sections: TemplateSection[];
  structure?: TemplateSection[]; // Alias for sections
  evaluationCriteria: string[];
  required?: boolean;
  element?: {
    code: string;
    title: string;
  };
}

export interface TemplateSection {
  id: string;
  title: string;
  titleEn?: string;
  description?: string;
  type?: "text" | "textarea" | "list" | "table" | "structured";
  required?: boolean;
  placeholder?: string;
  validation?: Record<string, unknown>;
  subsections?: TemplateSection[];
}

export interface ECDocument {
  id: string;
  enrollmentId: string;
  templateId: string;
  status:
    | "DRAFT"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "SUBMITTED"
    | "APPROVED"
    | "REJECTED";
  title?: string;
  content: Record<string, unknown>;
  validationScore?: number;
  validationErrors: ValidationError[];
  isComplete: boolean;
  version: number;
  pdfPath?: string;
  exportedAt?: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  template?: ECTemplate;
}

export interface ValidationError {
  sectionId: string;
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface PortfolioSummary {
  enrollmentId: string;
  ecCode: string;
  totalDocuments: number;
  completedDocuments: number;
  submittedDocuments: number;
  approvedDocuments: number;
  overallProgress: number;
  completionPercentage?: number; // Alias for overallProgress
  documents?: ECDocument[];
  byElement: {
    elementId: string;
    elementCode: string;
    elementTitle: string;
    totalTemplates: number;
    completedDocuments: number;
    progress: number;
  }[];
  certificationReady: boolean;
}

export interface ECAssessment {
  id: string;
  ecId: string;
  moduleId?: string;
  code: string;
  title: string;
  titleEn?: string;
  description?: string;
  category: string;
  timeLimit?: number;
  passingScore: number;
  allowedAttempts: number;
  maxAttempts?: number; // Alias for allowedAttempts
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResults: boolean;
  questionCount: number;
  totalPoints: number;
  prerequisites?: string[];
  questions?: unknown[];
  module?: {
    code: string;
    title: string;
  };
}

export interface AssessmentAttempt {
  id: string;
  enrollmentId: string;
  assessmentId: string;
  status: "IN_PROGRESS" | "COMPLETED" | "TIMED_OUT" | "ABANDONED";
  startedAt: string;
  completedAt?: string;
  timeSpent?: number;
  score?: number;
  passed?: boolean;
  responses: unknown[];
}

export interface AttemptResult {
  attemptId: string;
  assessmentId: string;
  status: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  timeSpent: number;
  correctCount?: number;
  questionResults?: {
    questionId: string;
    isCorrect: boolean;
    pointsEarned: number;
    maxPoints: number;
    explanation?: string;
  }[];
  completedAt: string;
}

// ============================================
// API HELPERS
// ============================================

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============================================
// EC STANDARDS API
// ============================================

export const ecApi = {
  // Standards
  listStandards: (params?: { status?: string; search?: string }) =>
    fetchApi<{ data: ECStandard[]; total: number }>(
      `/ec/standards?${new URLSearchParams(params as Record<string, string>)}`,
    ),

  getStandard: (code: string) =>
    fetchApi<ECStandard & { elements: ECElement[]; modules: ECModule[] }>(
      `/ec/standards/${code}`,
    ),

  getStandardOverview: (code: string) =>
    fetchApi<ECStandard & { overview: Record<string, number> }>(
      `/ec/standards/${code}/overview`,
    ),

  // Modules
  getModules: (ecCode: string) =>
    fetchApi<ECModule[]>(`/ec/standards/${ecCode}/modules`),

  getModule: (moduleId: string) =>
    fetchApi<ECModule>(`/ec/modules/${moduleId}`),

  // Lessons
  getLessons: (moduleId: string) =>
    fetchApi<ECLesson[]>(`/ec/modules/${moduleId}/lessons`),

  getLesson: (lessonId: string) =>
    fetchApi<ECLesson>(`/ec/lessons/${lessonId}`),

  // Elements
  getElements: (ecCode: string) =>
    fetchApi<ECElement[]>(`/ec/standards/${ecCode}/elements`),
};

// ============================================
// EC TRAINING API
// ============================================

export const trainingApi = {
  // Enrollments
  enroll: (data: { userId: string; ecCode: string; tenantId: string }) =>
    fetchApi<ECEnrollment>("/ec-training/enrollments", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Alias for backwards compatibility
  createEnrollment: (data: {
    ecStandardId?: string;
    userId?: string;
    ecCode?: string;
    tenantId?: string;
  }) =>
    fetchApi<ECEnrollment>("/ec-training/enrollments", {
      method: "POST",
      body: JSON.stringify({
        userId: data.userId || "current-user",
        ecCode: data.ecStandardId || data.ecCode,
        tenantId: data.tenantId || "default-tenant",
      }),
    }),

  getUserEnrollments: (
    userId: string,
    params?: { status?: string; includeProgress?: boolean },
  ) =>
    fetchApi<ECEnrollment[]>(
      `/ec-training/enrollments/user/${userId}?${new URLSearchParams(params as Record<string, string>)}`,
    ),

  getEnrollment: (enrollmentId: string) =>
    fetchApi<ECEnrollment>(`/ec-training/enrollments/${enrollmentId}`),

  getEnrollmentByUserAndEC: (userId: string, ecCode: string) =>
    fetchApi<ECEnrollment>(
      `/ec-training/enrollments/user/${userId}/ec/${ecCode}`,
    ),

  // Alias for backwards compatibility - accepts object param
  getEnrollments: async (_params?: {
    ecStandardId?: string;
    userId?: string;
  }) => {
    const enrollments = await fetchApi<ECEnrollment[]>(
      `/ec-training/enrollments/user/current-user`,
    );
    return { data: enrollments, total: enrollments.length };
  },

  // Alias for updateLessonProgress
  updateProgress: (
    enrollmentId: string,
    lessonId: string,
    data: { videoProgress?: number; markCompleted?: boolean },
  ) =>
    fetchApi<LessonProgress>(
      `/ec-training/enrollments/${enrollmentId}/lessons/${lessonId}/progress`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    ),

  // Alias for trackVideoProgress
  updateVideoProgress: (
    enrollmentId: string,
    lessonId: string,
    progress: number,
  ) =>
    fetchApi<LessonProgress>(
      `/ec-training/enrollments/${enrollmentId}/lessons/${lessonId}/video-progress`,
      {
        method: "POST",
        body: JSON.stringify({ progress }),
      },
    ),

  // Progress
  getProgressSummary: (enrollmentId: string) =>
    fetchApi<ProgressSummary>(
      `/ec-training/enrollments/${enrollmentId}/progress`,
    ),

  updateLessonProgress: (
    enrollmentId: string,
    lessonId: string,
    data: { videoProgress?: number; markCompleted?: boolean },
  ) =>
    fetchApi<LessonProgress>(
      `/ec-training/enrollments/${enrollmentId}/lessons/${lessonId}/progress`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    ),

  trackVideoProgress: (
    enrollmentId: string,
    lessonId: string,
    progress: number,
  ) =>
    fetchApi<LessonProgress>(
      `/ec-training/enrollments/${enrollmentId}/lessons/${lessonId}/video-progress`,
      {
        method: "POST",
        body: JSON.stringify({ progress }),
      },
    ),

  completeLesson: (enrollmentId: string, lessonId: string) =>
    fetchApi<LessonProgress>(
      `/ec-training/enrollments/${enrollmentId}/lessons/${lessonId}/complete`,
      {
        method: "POST",
      },
    ),

  startModule: (enrollmentId: string, moduleId: string) =>
    fetchApi<ModuleProgress>(
      `/ec-training/enrollments/${enrollmentId}/modules/${moduleId}/start`,
      {
        method: "POST",
      },
    ),

  // Activity
  getRecentActivity: (enrollmentId: string, limit = 10) =>
    fetchApi<unknown[]>(
      `/ec-training/enrollments/${enrollmentId}/activity?limit=${limit}`,
    ),

  getLeaderboard: (ecCode: string, tenantId?: string, limit = 10) =>
    fetchApi<unknown[]>(
      `/ec-training/leaderboard/${ecCode}?${new URLSearchParams({ tenantId: tenantId || "", limit: String(limit) })}`,
    ),
};

// ============================================
// EC PORTFOLIO API
// ============================================

export const portfolioApi = {
  // Templates
  getTemplates: (
    ecCode: string,
    params?: { elementId?: string; category?: string },
  ) =>
    fetchApi<ECTemplate[]>(
      `/ec-portfolio/templates/${ecCode}?${new URLSearchParams(params as Record<string, string>)}`,
    ),

  getTemplate: (templateId: string) =>
    fetchApi<ECTemplate>(`/ec-portfolio/templates/by-id/${templateId}`),

  // Documents
  getDocuments: (
    enrollmentId: string,
    params?: { status?: string; incomplete?: boolean },
  ) =>
    fetchApi<ECDocument[]>(
      `/ec-portfolio/enrollments/${enrollmentId}/documents?${new URLSearchParams(params as Record<string, string>)}`,
    ),

  getDocument: (documentId: string) =>
    fetchApi<ECDocument>(`/ec-portfolio/documents/${documentId}`),

  createDocument: (enrollmentId: string, templateId: string) =>
    fetchApi<ECDocument>(
      `/ec-portfolio/enrollments/${enrollmentId}/documents`,
      {
        method: "POST",
        body: JSON.stringify({ templateId }),
      },
    ),

  saveDocumentContent: (documentId: string, content: Record<string, unknown>) =>
    fetchApi<ECDocument>(`/ec-portfolio/documents/${documentId}/content`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    }),

  // Alias for saveDocumentContent
  updateDocument: (documentId: string, content: Record<string, unknown>) =>
    fetchApi<ECDocument>(`/ec-portfolio/documents/${documentId}/content`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    }),

  autoSaveDocument: (documentId: string, content: Record<string, unknown>) =>
    fetchApi<ECDocument>(`/ec-portfolio/documents/${documentId}/autosave`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    }),

  submitDocument: (documentId: string) =>
    fetchApi<ECDocument>(`/ec-portfolio/documents/${documentId}/submit`, {
      method: "POST",
    }),

  validateDocument: (documentId: string) =>
    fetchApi<{ isValid: boolean; score: number; errors: ValidationError[] }>(
      `/ec-portfolio/documents/${documentId}/validate`,
    ),

  exportDocument: (documentId: string) =>
    fetchApi<{ document: ECDocument; exportedAt: string }>(
      `/ec-portfolio/documents/${documentId}/export`,
      {
        method: "POST",
      },
    ),

  // Portfolio Summary
  getPortfolioSummary: (enrollmentId: string) =>
    fetchApi<PortfolioSummary>(
      `/ec-portfolio/enrollments/${enrollmentId}/summary`,
    ),

  initializePortfolio: (enrollmentId: string) =>
    fetchApi<ECDocument[]>(
      `/ec-portfolio/enrollments/${enrollmentId}/initialize`,
      {
        method: "POST",
      },
    ),
};

// ============================================
// EC ASSESSMENT API
// ============================================

export const assessmentApi = {
  // Assessments
  getAssessments: (ecCode: string) =>
    fetchApi<ECAssessment[]>(`/ec-assessment/assessments/${ecCode}`),

  getAssessment: (assessmentId: string) =>
    fetchApi<ECAssessment>(`/ec-assessment/assessments/by-id/${assessmentId}`),

  // Attempts
  startAttempt: (enrollmentId: string, assessmentId: string) =>
    fetchApi<AssessmentAttempt>(
      `/ec-assessment/enrollments/${enrollmentId}/assessments/${assessmentId}/start`,
      {
        method: "POST",
      },
    ),

  submitAnswer: (
    attemptId: string,
    questionId: string,
    response: unknown,
    timeSpent?: number,
  ) =>
    fetchApi<{ success: boolean; answeredQuestions: number }>(
      `/ec-assessment/attempts/${attemptId}/answer`,
      {
        method: "POST",
        body: JSON.stringify({ questionId, response, timeSpent }),
      },
    ),

  submitAttempt: (
    attemptId: string,
    answers: { questionId: string; response: unknown }[],
    timeSpent?: number,
  ) =>
    fetchApi<AttemptResult>(`/ec-assessment/attempts/${attemptId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers, timeSpent }),
    }),

  getAttempt: (attemptId: string) =>
    fetchApi<AssessmentAttempt>(`/ec-assessment/attempts/${attemptId}`),

  // User Summary
  getUserAssessmentSummary: (enrollmentId: string) =>
    fetchApi<
      {
        assessmentId: string;
        assessmentTitle: string;
        category: string;
        attemptCount: number;
        allowedAttempts: number;
        bestScore: number;
        passed: boolean;
        lastAttemptAt?: string;
      }[]
    >(`/ec-assessment/enrollments/${enrollmentId}/summary`),

  // Simulations
  getSimulations: (ecCode: string) =>
    fetchApi<unknown[]>(`/ec-assessment/simulations/${ecCode}`),

  startSimulation: (enrollmentId: string, simulationId: string) =>
    fetchApi<unknown>(
      `/ec-assessment/enrollments/${enrollmentId}/simulations/${simulationId}/start`,
      {
        method: "POST",
      },
    ),
};
