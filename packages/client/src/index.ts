/**
 * @avala/client - Learning & Competency SDK
 *
 * TypeScript client for AVALA's certification and compliance platform.
 * Enables tracking team skills, DC-3 forms, and Open Badges across MADFAM.
 */

// ============================================================================
// Types
// ============================================================================

export interface AvalaConfig {
  baseURL: string;
  apiKey?: string;
  tenantId?: string;
  timeout?: number;
}

export interface Employee {
  id: string;
  email: string;
  name: string;
  department?: string;
  position?: string;
  hireDate: string;
  status: EmployeeStatus;
  competencies: CompetencyRecord[];
  badges: Badge[];
  dc3Forms: DC3Form[];
  createdAt: string;
  updatedAt: string;
}

export type EmployeeStatus = 'active' | 'inactive' | 'on_leave' | 'terminated';

export interface Competency {
  id: string;
  code: string; // EC code from CONOCER
  name: string;
  description: string;
  level: CompetencyLevel;
  category: string;
  conocerStandard?: string;
  validityMonths: number;
  assessmentMethods: AssessmentMethod[];
  createdAt: string;
}

export type CompetencyLevel = 1 | 2 | 3 | 4 | 5;
export type AssessmentMethod = 'exam' | 'practical' | 'portfolio' | 'observation' | 'simulation';

export interface CompetencyRecord {
  id: string;
  employeeId: string;
  competencyId: string;
  competency: Competency;
  status: CompetencyStatus;
  score?: number;
  assessedAt?: string;
  expiresAt?: string;
  assessorId?: string;
  evidence: Evidence[];
  notes?: string;
}

export type CompetencyStatus = 'not_started' | 'in_progress' | 'assessed' | 'certified' | 'expired';

export interface Evidence {
  id: string;
  type: EvidenceType;
  title: string;
  description?: string;
  fileUrl?: string;
  createdAt: string;
}

export type EvidenceType = 'document' | 'video' | 'image' | 'certificate' | 'testimonial';

export interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  criteria: string;
  issuer: string;
  issuedAt: string;
  expiresAt?: string;
  verificationUrl: string;
  competencyIds: string[];
  // Open Badges 3.0 fields
  obv3Credential?: string; // JSON-LD Verifiable Credential
}

export interface DC3Form {
  id: string;
  employeeId: string;
  courseId: string;
  courseName: string;
  instructor: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  status: DC3Status;
  signedAt?: string;
  submittedToSirce: boolean;
  sirceReference?: string;
  pdfUrl?: string;
  createdAt: string;
}

export type DC3Status = 'draft' | 'pending_signature' | 'signed' | 'submitted' | 'approved' | 'rejected';

export interface Course {
  id: string;
  name: string;
  description: string;
  instructor: string;
  duration: number; // hours
  competencyIds: string[];
  modules: CourseModule[];
  dc3Required: boolean;
  status: 'draft' | 'active' | 'archived';
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  order: number;
  duration: number; // minutes
  contentType: 'video' | 'document' | 'quiz' | 'activity';
  contentUrl?: string;
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  targetRole?: string;
  competencyIds: string[];
  courseIds: string[];
  estimatedHours: number;
  status: 'draft' | 'active' | 'archived';
}

export interface TeamCompetencyReport {
  teamId: string;
  teamName: string;
  totalMembers: number;
  competencyCoverage: CompetencyCoverage[];
  upcomingExpirations: ExpirationAlert[];
  complianceScore: number; // 0-100
  dc3Compliance: DC3Compliance;
}

export interface CompetencyCoverage {
  competencyId: string;
  competencyName: string;
  certifiedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  coverage: number; // percentage
}

export interface ExpirationAlert {
  employeeId: string;
  employeeName: string;
  competencyId: string;
  competencyName: string;
  expiresAt: string;
  daysUntilExpiration: number;
}

export interface DC3Compliance {
  totalRequired: number;
  completed: number;
  pending: number;
  overdue: number;
  complianceRate: number; // percentage
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ============================================================================
// Client
// ============================================================================

export class AvalaClient {
  private baseURL: string;
  private apiKey?: string;
  private tenantId?: string;
  private timeout: number;

  constructor(config: AvalaConfig) {
    this.baseURL = config.baseURL.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.tenantId = config.tenantId;
    this.timeout = config.timeout || 30000;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'X-API-Key': this.apiKey }),
      ...(this.tenantId && { 'X-Tenant-ID': this.tenantId }),
      ...options.headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new AvalaError(
          error.message || `HTTP ${response.status}`,
          response.status,
          error.code
        );
      }

      return response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // -------------------------------------------------------------------------
  // Employees API
  // -------------------------------------------------------------------------

  async getEmployees(options?: {
    department?: string;
    status?: EmployeeStatus;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<Employee>> {
    const params = new URLSearchParams();
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) params.set(key, String(value));
      });
    }
    const query = params.toString();
    return this.request<PaginatedResponse<Employee>>(
      `/api/v1/employees${query ? `?${query}` : ''}`
    );
  }

  async getEmployee(id: string): Promise<Employee> {
    return this.request<Employee>(`/api/v1/employees/${id}`);
  }

  async getEmployeeCompetencies(employeeId: string): Promise<CompetencyRecord[]> {
    return this.request<CompetencyRecord[]>(
      `/api/v1/employees/${employeeId}/competencies`
    );
  }

  async getEmployeeBadges(employeeId: string): Promise<Badge[]> {
    return this.request<Badge[]>(`/api/v1/employees/${employeeId}/badges`);
  }

  async getEmployeeDC3Forms(employeeId: string): Promise<DC3Form[]> {
    return this.request<DC3Form[]>(`/api/v1/employees/${employeeId}/dc3`);
  }

  // -------------------------------------------------------------------------
  // Competencies API
  // -------------------------------------------------------------------------

  async getCompetencies(options?: {
    category?: string;
    level?: CompetencyLevel;
    search?: string;
  }): Promise<PaginatedResponse<Competency>> {
    const params = new URLSearchParams();
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) params.set(key, String(value));
      });
    }
    const query = params.toString();
    return this.request<PaginatedResponse<Competency>>(
      `/api/v1/competencies${query ? `?${query}` : ''}`
    );
  }

  async getCompetency(id: string): Promise<Competency> {
    return this.request<Competency>(`/api/v1/competencies/${id}`);
  }

  async assessCompetency(
    employeeId: string,
    competencyId: string,
    data: {
      score: number;
      notes?: string;
      evidenceIds?: string[];
    }
  ): Promise<CompetencyRecord> {
    return this.request<CompetencyRecord>(
      `/api/v1/employees/${employeeId}/competencies/${competencyId}/assess`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  // -------------------------------------------------------------------------
  // Badges API
  // -------------------------------------------------------------------------

  async issueBadge(
    employeeId: string,
    badgeTemplateId: string
  ): Promise<Badge> {
    return this.request<Badge>(`/api/v1/badges/issue`, {
      method: 'POST',
      body: JSON.stringify({ employeeId, badgeTemplateId }),
    });
  }

  async verifyBadge(badgeId: string): Promise<{
    valid: boolean;
    badge?: Badge;
    employee?: { id: string; name: string };
    message: string;
  }> {
    return this.request<{
      valid: boolean;
      badge?: Badge;
      employee?: { id: string; name: string };
      message: string;
    }>(`/api/v1/badges/${badgeId}/verify`);
  }

  // -------------------------------------------------------------------------
  // DC-3 API
  // -------------------------------------------------------------------------

  async createDC3Form(data: {
    employeeId: string;
    courseId: string;
    startDate: string;
    endDate: string;
  }): Promise<DC3Form> {
    return this.request<DC3Form>(`/api/v1/dc3`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async signDC3Form(
    dc3Id: string,
    signature: { employeeSignature: string; supervisorSignature?: string }
  ): Promise<DC3Form> {
    return this.request<DC3Form>(`/api/v1/dc3/${dc3Id}/sign`, {
      method: 'POST',
      body: JSON.stringify(signature),
    });
  }

  async submitDC3ToSirce(dc3Id: string): Promise<DC3Form> {
    return this.request<DC3Form>(`/api/v1/dc3/${dc3Id}/submit-sirce`, {
      method: 'POST',
    });
  }

  async downloadDC3Pdf(dc3Id: string): Promise<Blob> {
    const response = await fetch(`${this.baseURL}/api/v1/dc3/${dc3Id}/pdf`, {
      headers: {
        ...(this.apiKey && { 'X-API-Key': this.apiKey }),
        ...(this.tenantId && { 'X-Tenant-ID': this.tenantId }),
      },
    });
    if (!response.ok) throw new AvalaError('Failed to download PDF', response.status);
    return response.blob();
  }

  // -------------------------------------------------------------------------
  // Courses & Learning Paths API
  // -------------------------------------------------------------------------

  async getCourses(): Promise<PaginatedResponse<Course>> {
    return this.request<PaginatedResponse<Course>>(`/api/v1/courses`);
  }

  async getLearningPaths(): Promise<PaginatedResponse<LearningPath>> {
    return this.request<PaginatedResponse<LearningPath>>(`/api/v1/learning-paths`);
  }

  async enrollInCourse(
    employeeId: string,
    courseId: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(
      `/api/v1/courses/${courseId}/enroll`,
      {
        method: 'POST',
        body: JSON.stringify({ employeeId }),
      }
    );
  }

  // -------------------------------------------------------------------------
  // Reports API
  // -------------------------------------------------------------------------

  async getTeamCompetencyReport(teamId: string): Promise<TeamCompetencyReport> {
    return this.request<TeamCompetencyReport>(
      `/api/v1/reports/team/${teamId}/competencies`
    );
  }

  async getExpirationAlerts(daysAhead: number = 30): Promise<ExpirationAlert[]> {
    return this.request<ExpirationAlert[]>(
      `/api/v1/reports/expirations?days=${daysAhead}`
    );
  }

  async getDC3ComplianceReport(): Promise<DC3Compliance> {
    return this.request<DC3Compliance>(`/api/v1/reports/dc3-compliance`);
  }

  // -------------------------------------------------------------------------
  // Health Check
  // -------------------------------------------------------------------------

  async healthCheck(): Promise<{ status: string; version: string }> {
    return this.request<{ status: string; version: string }>('/health');
  }
}

// ============================================================================
// Error Class
// ============================================================================

export class AvalaError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'AvalaError';
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createAvalaClient(config: AvalaConfig): AvalaClient {
  return new AvalaClient(config);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get competency level label
 */
export function getCompetencyLevelLabel(level: CompetencyLevel): string {
  const labels: Record<CompetencyLevel, string> = {
    1: 'Básico',
    2: 'Intermedio',
    3: 'Avanzado',
    4: 'Experto',
    5: 'Maestro',
  };
  return labels[level];
}

/**
 * Get competency status color
 */
export function getCompetencyStatusColor(status: CompetencyStatus): string {
  const colors: Record<CompetencyStatus, string> = {
    not_started: '#9ca3af', // gray
    in_progress: '#3b82f6', // blue
    assessed: '#f59e0b', // amber
    certified: '#22c55e', // green
    expired: '#ef4444', // red
  };
  return colors[status];
}

/**
 * Get DC-3 status label in Spanish
 */
export function getDC3StatusLabel(status: DC3Status): string {
  const labels: Record<DC3Status, string> = {
    draft: 'Borrador',
    pending_signature: 'Pendiente de firma',
    signed: 'Firmado',
    submitted: 'Enviado a SIRCE',
    approved: 'Aprobado',
    rejected: 'Rechazado',
  };
  return labels[status];
}

/**
 * Calculate days until expiration
 */
export function daysUntilExpiration(expiresAt: string): number {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Check if competency is expiring soon (within 30 days)
 */
export function isExpiringSoon(expiresAt: string, thresholdDays: number = 30): boolean {
  const days = daysUntilExpiration(expiresAt);
  return days > 0 && days <= thresholdDays;
}

export default AvalaClient;
