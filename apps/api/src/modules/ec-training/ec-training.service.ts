import { Injectable } from "@nestjs/common";
import {
  CreateECEnrollmentDto,
  ECEnrollmentQueryDto,
  UserEnrollmentQueryDto,
  UpdateLessonProgressDto,
  UpdateModuleProgressDto,
  VideoProgressDto,
} from "./dto/ec-enrollment.dto";
import {
  EnrollmentManagementService,
  LessonProgressService,
  ProgressCalculationService,
  EnrollmentAnalyticsService,
} from "./services";

/**
 * ECTrainingService - Facade for EC Training functionality
 *
 * This service delegates to specialized services for different concerns:
 * - EnrollmentManagementService: enrollment lifecycle (create, find, withdraw, reset)
 * - LessonProgressService: lesson/module progress updates
 * - ProgressCalculationService: progress calculation and summaries
 * - EnrollmentAnalyticsService: leaderboards and activity tracking
 */
@Injectable()
export class ECTrainingService {
  constructor(
    private readonly enrollmentManagement: EnrollmentManagementService,
    private readonly lessonProgress: LessonProgressService,
    private readonly progressCalculation: ProgressCalculationService,
    private readonly analytics: EnrollmentAnalyticsService,
  ) {}

  // ============================================
  // ENROLLMENTS (delegated to EnrollmentManagementService)
  // ============================================

  async enrollUser(dto: CreateECEnrollmentDto) {
    return this.enrollmentManagement.enrollUser(dto);
  }

  async findAllEnrollments(query: ECEnrollmentQueryDto) {
    return this.enrollmentManagement.findAllEnrollments(query);
  }

  async findUserEnrollments(userId: string, query: UserEnrollmentQueryDto) {
    return this.enrollmentManagement.findUserEnrollments(userId, query);
  }

  async findEnrollmentById(enrollmentId: string) {
    return this.enrollmentManagement.findEnrollmentById(enrollmentId);
  }

  async findEnrollmentByUserAndEC(userId: string, ecCode: string) {
    return this.enrollmentManagement.findEnrollmentByUserAndEC(userId, ecCode);
  }

  async withdrawEnrollment(enrollmentId: string) {
    return this.enrollmentManagement.withdrawEnrollment(enrollmentId);
  }

  async resetEnrollmentProgress(enrollmentId: string) {
    return this.enrollmentManagement.resetEnrollmentProgress(enrollmentId);
  }

  // ============================================
  // LESSON PROGRESS (delegated to LessonProgressService)
  // ============================================

  async updateLessonProgress(
    enrollmentId: string,
    lessonId: string,
    dto: UpdateLessonProgressDto,
  ) {
    return this.lessonProgress.updateLessonProgress(
      enrollmentId,
      lessonId,
      dto,
    );
  }

  async trackVideoProgress(
    enrollmentId: string,
    lessonId: string,
    dto: VideoProgressDto,
  ) {
    return this.lessonProgress.trackVideoProgress(enrollmentId, lessonId, dto);
  }

  async completeLesson(enrollmentId: string, lessonId: string) {
    return this.lessonProgress.completeLesson(enrollmentId, lessonId);
  }

  // ============================================
  // MODULE PROGRESS (delegated to LessonProgressService)
  // ============================================

  async updateModuleProgress(
    enrollmentId: string,
    moduleId: string,
    dto: UpdateModuleProgressDto,
  ) {
    return this.lessonProgress.updateModuleProgress(
      enrollmentId,
      moduleId,
      dto,
    );
  }

  async startModule(enrollmentId: string, moduleId: string) {
    return this.lessonProgress.startModule(enrollmentId, moduleId);
  }

  // ============================================
  // PROGRESS CALCULATION (delegated to ProgressCalculationService)
  // ============================================

  async recalculateProgress(enrollmentId: string) {
    return this.progressCalculation.recalculateProgress(enrollmentId);
  }

  async getProgressSummary(enrollmentId: string) {
    return this.progressCalculation.getProgressSummary(enrollmentId);
  }

  // ============================================
  // LEADERBOARD & ANALYTICS (delegated to EnrollmentAnalyticsService)
  // ============================================

  async getECLeaderboard(ecCode: string, tenantId?: string, limit = 10) {
    return this.analytics.getECLeaderboard(ecCode, tenantId, limit);
  }

  async getRecentActivity(enrollmentId: string, limit = 10) {
    return this.analytics.getRecentActivity(enrollmentId, limit);
  }
}
