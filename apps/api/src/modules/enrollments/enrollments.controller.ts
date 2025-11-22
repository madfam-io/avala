import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * EnrollmentsController
 * Phase 3-A: Course enrollment and progress tracking endpoints
 */
@Controller('enrollments')
@UseGuards(JwtAuthGuard)
export class EnrollmentsController {
  constructor(
    private readonly enrollmentsService: EnrollmentsService,
    private readonly progressService: ProgressService,
  ) {}

  /**
   * POST /enrollments
   * Enroll the current user in a course
   */
  @Post()
  async enrollInCourse(
    @Req() req: any,
    @Body() body: { courseId: string },
  ) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    const { courseId } = body;

    return this.enrollmentsService.enroll(tenantId, userId, courseId);
  }

  /**
   * GET /enrollments/my-courses
   * Get all courses the current user is enrolled in
   */
  @Get('my-courses')
  async getMyCourses(@Req() req: any) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;

    return this.enrollmentsService.getMyCourses(tenantId, userId);
  }

  /**
   * GET /enrollments/:enrollmentId
   * Get detailed progress for a specific enrollment
   */
  @Get(':enrollmentId')
  async getEnrollmentProgress(
    @Req() req: any,
    @Param('enrollmentId') enrollmentId: string,
  ) {
    const tenantId = req.user.tenantId;

    return this.enrollmentsService.getEnrollmentProgress(tenantId, enrollmentId);
  }

  /**
   * DELETE /enrollments/:enrollmentId
   * Unenroll from a course
   */
  @Delete(':enrollmentId')
  async unenroll(
    @Req() req: any,
    @Param('enrollmentId') enrollmentId: string,
  ) {
    const tenantId = req.user.tenantId;

    return this.enrollmentsService.unenroll(tenantId, enrollmentId);
  }

  /**
   * POST /enrollments/:enrollmentId/lessons/:lessonId/start
   * Mark a lesson as in progress (viewed)
   */
  @Post(':enrollmentId/lessons/:lessonId/start')
  async startLesson(
    @Req() req: any,
    @Param('enrollmentId') enrollmentId: string,
    @Param('lessonId') lessonId: string,
  ) {
    const tenantId = req.user.tenantId;

    return this.progressService.markLessonInProgress(
      tenantId,
      enrollmentId,
      lessonId,
    );
  }

  /**
   * POST /enrollments/:enrollmentId/lessons/:lessonId/complete
   * Mark a lesson as completed
   */
  @Post(':enrollmentId/lessons/:lessonId/complete')
  async completeLesson(
    @Req() req: any,
    @Param('enrollmentId') enrollmentId: string,
    @Param('lessonId') lessonId: string,
  ) {
    const tenantId = req.user.tenantId;

    return this.progressService.markLessonComplete(
      tenantId,
      enrollmentId,
      lessonId,
    );
  }

  /**
   * POST /enrollments/:enrollmentId/lessons/:lessonId/reset
   * Reset lesson progress to NOT_STARTED
   */
  @Post(':enrollmentId/lessons/:lessonId/reset')
  async resetLesson(
    @Req() req: any,
    @Param('enrollmentId') enrollmentId: string,
    @Param('lessonId') lessonId: string,
  ) {
    const tenantId = req.user.tenantId;

    return this.progressService.resetLessonProgress(
      tenantId,
      enrollmentId,
      lessonId,
    );
  }

  /**
   * GET /enrollments/:enrollmentId/lessons/:lessonId
   * Get progress for a specific lesson
   */
  @Get(':enrollmentId/lessons/:lessonId')
  async getLessonProgress(
    @Req() req: any,
    @Param('enrollmentId') enrollmentId: string,
    @Param('lessonId') lessonId: string,
  ) {
    const tenantId = req.user.tenantId;

    return this.progressService.getLessonProgress(
      tenantId,
      enrollmentId,
      lessonId,
    );
  }

  /**
   * GET /enrollments/:enrollmentId/next-lesson
   * Get the next lesson to study
   */
  @Get(':enrollmentId/next-lesson')
  async getNextLesson(
    @Req() req: any,
    @Param('enrollmentId') enrollmentId: string,
  ) {
    const tenantId = req.user.tenantId;

    return this.progressService.getNextLesson(tenantId, enrollmentId);
  }
}
