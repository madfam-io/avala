import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { ECTrainingService } from "./ec-training.service";
import {
  CreateECEnrollmentDto,
  ECEnrollmentQueryDto,
  UserEnrollmentQueryDto,
  UpdateLessonProgressDto,
  VideoProgressDto,
  ECEnrollmentResponseDto,
  ProgressSummaryDto,
} from "./dto/ec-enrollment.dto";

@ApiTags("EC Training")
@ApiBearerAuth()
@Controller("ec-training")
export class ECTrainingController {
  constructor(private readonly ecTrainingService: ECTrainingService) {}

  // ============================================
  // ENROLLMENTS
  // ============================================

  @Post("enrollments")
  @ApiOperation({ summary: "Enroll user in EC Standard" })
  @ApiResponse({ status: 201, description: "User enrolled successfully" })
  @ApiResponse({ status: 404, description: "EC Standard not found" })
  @ApiResponse({ status: 409, description: "User already enrolled" })
  async enrollUser(@Body() dto: CreateECEnrollmentDto) {
    return this.ecTrainingService.enrollUser(dto);
  }

  @Get("enrollments")
  @ApiOperation({ summary: "List all enrollments" })
  @ApiResponse({ status: 200, description: "Paginated list of enrollments" })
  async findAllEnrollments(@Query() query: ECEnrollmentQueryDto) {
    return this.ecTrainingService.findAllEnrollments(query);
  }

  @Get("enrollments/user/:userId")
  @ApiOperation({ summary: "Get user enrollments" })
  @ApiParam({ name: "userId", description: "User ID" })
  @ApiResponse({ status: 200, description: "User enrollments list" })
  async findUserEnrollments(
    @Param("userId") userId: string,
    @Query() query: UserEnrollmentQueryDto,
  ) {
    return this.ecTrainingService.findUserEnrollments(userId, query);
  }

  @Get("enrollments/:id")
  @ApiOperation({ summary: "Get enrollment by ID" })
  @ApiResponse({ status: 200, type: ECEnrollmentResponseDto })
  @ApiResponse({ status: 404, description: "Enrollment not found" })
  async findEnrollmentById(@Param("id") id: string) {
    return this.ecTrainingService.findEnrollmentById(id);
  }

  @Get("enrollments/user/:userId/ec/:ecCode")
  @ApiOperation({ summary: "Get user enrollment for specific EC" })
  @ApiParam({ name: "userId", description: "User ID" })
  @ApiParam({
    name: "ecCode",
    example: "EC0249",
    description: "EC Standard code",
  })
  @ApiResponse({ status: 200, type: ECEnrollmentResponseDto })
  @ApiResponse({ status: 404, description: "Enrollment not found" })
  async findEnrollmentByUserAndEC(
    @Param("userId") userId: string,
    @Param("ecCode") ecCode: string,
  ) {
    return this.ecTrainingService.findEnrollmentByUserAndEC(userId, ecCode);
  }

  @Delete("enrollments/:id/withdraw")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Withdraw from enrollment" })
  @ApiResponse({ status: 200, description: "Enrollment withdrawn" })
  async withdrawEnrollment(@Param("id") id: string) {
    return this.ecTrainingService.withdrawEnrollment(id);
  }

  @Post("enrollments/:id/reset")
  @ApiOperation({ summary: "Reset enrollment progress" })
  @ApiResponse({ status: 200, description: "Progress reset" })
  async resetProgress(@Param("id") id: string) {
    return this.ecTrainingService.resetEnrollmentProgress(id);
  }

  // ============================================
  // PROGRESS TRACKING
  // ============================================

  @Get("enrollments/:id/progress")
  @ApiOperation({ summary: "Get detailed progress summary" })
  @ApiResponse({ status: 200, type: ProgressSummaryDto })
  async getProgressSummary(@Param("id") id: string) {
    return this.ecTrainingService.getProgressSummary(id);
  }

  @Put("enrollments/:enrollmentId/lessons/:lessonId/progress")
  @ApiOperation({ summary: "Update lesson progress" })
  @ApiResponse({ status: 200, description: "Lesson progress updated" })
  async updateLessonProgress(
    @Param("enrollmentId") enrollmentId: string,
    @Param("lessonId") lessonId: string,
    @Body() dto: UpdateLessonProgressDto,
  ) {
    return this.ecTrainingService.updateLessonProgress(
      enrollmentId,
      lessonId,
      dto,
    );
  }

  @Post("enrollments/:enrollmentId/lessons/:lessonId/video-progress")
  @ApiOperation({ summary: "Track video progress" })
  @ApiResponse({ status: 200, description: "Video progress tracked" })
  async trackVideoProgress(
    @Param("enrollmentId") enrollmentId: string,
    @Param("lessonId") lessonId: string,
    @Body() dto: VideoProgressDto,
  ) {
    return this.ecTrainingService.trackVideoProgress(
      enrollmentId,
      lessonId,
      dto,
    );
  }

  @Post("enrollments/:enrollmentId/lessons/:lessonId/complete")
  @ApiOperation({ summary: "Mark lesson as completed" })
  @ApiResponse({ status: 200, description: "Lesson completed" })
  async completeLesson(
    @Param("enrollmentId") enrollmentId: string,
    @Param("lessonId") lessonId: string,
  ) {
    return this.ecTrainingService.completeLesson(enrollmentId, lessonId);
  }

  @Post("enrollments/:enrollmentId/modules/:moduleId/start")
  @ApiOperation({ summary: "Start a module" })
  @ApiResponse({ status: 200, description: "Module started" })
  async startModule(
    @Param("enrollmentId") enrollmentId: string,
    @Param("moduleId") moduleId: string,
  ) {
    return this.ecTrainingService.startModule(enrollmentId, moduleId);
  }

  @Post("enrollments/:id/recalculate")
  @ApiOperation({ summary: "Recalculate all progress" })
  @ApiResponse({ status: 200, description: "Progress recalculated" })
  async recalculateProgress(@Param("id") id: string) {
    return this.ecTrainingService.recalculateProgress(id);
  }

  // ============================================
  // ACTIVITY & LEADERBOARD
  // ============================================

  @Get("enrollments/:id/activity")
  @ApiOperation({ summary: "Get recent activity" })
  @ApiResponse({ status: 200, description: "Recent activity list" })
  async getRecentActivity(
    @Param("id") id: string,
    @Query("limit") limit?: number,
  ) {
    return this.ecTrainingService.getRecentActivity(id, limit || 10);
  }

  @Get("leaderboard/:ecCode")
  @ApiOperation({ summary: "Get EC leaderboard" })
  @ApiParam({ name: "ecCode", example: "EC0249" })
  @ApiResponse({ status: 200, description: "Leaderboard entries" })
  async getLeaderboard(
    @Param("ecCode") ecCode: string,
    @Query("tenantId") tenantId?: string,
    @Query("limit") limit?: number,
  ) {
    return this.ecTrainingService.getECLeaderboard(
      ecCode,
      tenantId,
      limit || 10,
    );
  }
}
