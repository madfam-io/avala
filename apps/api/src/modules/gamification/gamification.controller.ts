import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from "@nestjs/swagger";
import { GamificationService } from "./gamification.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
@ApiTags("Gamification")
@Controller("gamification")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  // ============================================
  // USER PROGRESS
  // ============================================

  @Get("progress")
  @ApiOperation({ summary: "Get current user progress summary" })
  @ApiResponse({
    status: 200,
    description: "User progress with points, level, streak",
  })
  async getUserProgress(@Request() req: any) {
    return this.gamificationService.getUserProgress(
      req.user.id,
      req.user.tenantId,
    );
  }

  @Get("stats")
  @ApiOperation({ summary: "Get detailed user gamification stats" })
  @ApiResponse({ status: 200, description: "Detailed user stats" })
  async getUserStats(@Request() req: any) {
    return this.gamificationService.getUserStats(
      req.user.id,
      req.user.tenantId,
    );
  }

  // ============================================
  // ACHIEVEMENTS
  // ============================================

  @Get("achievements")
  @ApiOperation({ summary: "Get all achievements with unlock status" })
  @ApiResponse({
    status: 200,
    description: "List of achievements with user unlock status",
  })
  async getAchievements(@Request() req: any) {
    return this.gamificationService.getAchievementsWithStatus(req.user.id);
  }

  @Get("achievements/unlocked")
  @ApiOperation({ summary: "Get user unlocked achievements" })
  @ApiResponse({ status: 200, description: "List of unlocked achievements" })
  async getUnlockedAchievements(@Request() req: any) {
    return this.gamificationService.getUnlockedAchievements(req.user.id);
  }

  @Post("achievements/check")
  @ApiOperation({ summary: "Check and unlock earned achievements" })
  @ApiResponse({
    status: 200,
    description: "List of newly unlocked achievement codes",
  })
  async checkAchievements(@Request() req: any) {
    const unlocked = await this.gamificationService.checkAchievements(
      req.user.id,
      req.user.tenantId,
    );
    return { newlyUnlocked: unlocked };
  }

  // ============================================
  // STREAKS & ACTIVITY
  // ============================================

  @Post("activity/log")
  @ApiOperation({ summary: "Log daily activity (updates streak)" })
  @ApiResponse({ status: 200, description: "Activity logged, streak updated" })
  async logDailyActivity(@Request() req: any) {
    return this.gamificationService.recordDailyActivity(
      req.user.id,
      req.user.tenantId,
    );
  }

  @Get("activity/history")
  @ApiOperation({ summary: "Get activity history" })
  @ApiQuery({
    name: "days",
    required: false,
    type: Number,
    description: "Number of days (default 30)",
  })
  @ApiResponse({ status: 200, description: "Activity history" })
  async getActivityHistory(@Request() req: any, @Query("days") days?: number) {
    return this.gamificationService.getActivityHistory(req.user.id, days || 30);
  }

  // ============================================
  // LEADERBOARDS
  // ============================================

  @Get("leaderboard")
  @ApiOperation({ summary: "Get leaderboard" })
  @ApiQuery({
    name: "type",
    required: false,
    enum: [
      "GLOBAL_POINTS",
      "WEEKLY_POINTS",
      "MONTHLY_POINTS",
      "STREAK_LENGTH",
      "ACHIEVEMENTS",
    ],
    description: "Leaderboard type (default WEEKLY_POINTS)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Number of entries (default 10)",
  })
  @ApiResponse({ status: 200, description: "Leaderboard entries" })
  async getLeaderboard(
    @Request() req: any,
    @Query("type") type?: string,
    @Query("limit") limit?: number,
  ) {
    return this.gamificationService.getLeaderboard(
      req.user.tenantId,
      (type as any) || "WEEKLY_POINTS",
      limit || 10,
    );
  }

  @Get("leaderboard/rank")
  @ApiOperation({ summary: "Get current user rank on leaderboard" })
  @ApiResponse({ status: 200, description: "User rank information" })
  async getUserRank(@Request() req: any) {
    return this.gamificationService.getUserRank(req.user.id, req.user.tenantId);
  }
}
