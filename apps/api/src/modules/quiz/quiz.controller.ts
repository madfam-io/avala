import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import { QuizService, QuizSubmission } from "./quiz.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { SubmitQuizDto } from "./dto/submit-quiz.dto";

@ApiTags("Quiz")
@Controller("quiz")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get()
  @ApiOperation({ summary: "Get all quizzes for the tenant" })
  @ApiResponse({ status: 200, description: "List of quizzes" })
  async findAll(@Request() req: any) {
    return this.quizService.findAll(req.user.tenantId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a quiz by ID (for taking the quiz)" })
  @ApiResponse({
    status: 200,
    description: "Quiz with questions (answers hidden)",
  })
  @ApiResponse({ status: 404, description: "Quiz not found" })
  async findOne(@Param("id") id: string, @Request() req: any) {
    return this.quizService.findOne(id, req.user.tenantId);
  }

  @Get("code/:code")
  @ApiOperation({ summary: "Get a quiz by code" })
  @ApiResponse({
    status: 200,
    description: "Quiz with questions (answers hidden)",
  })
  @ApiResponse({ status: 404, description: "Quiz not found" })
  async findByCode(@Param("code") code: string, @Request() req: any) {
    return this.quizService.findByCode(code, req.user.tenantId);
  }

  @Post(":id/start")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Start a quiz attempt" })
  @ApiResponse({ status: 201, description: "Quiz attempt started" })
  @ApiResponse({ status: 400, description: "Maximum attempts reached" })
  @ApiResponse({ status: 404, description: "Quiz not found" })
  async startAttempt(@Param("id") quizId: string, @Request() req: any) {
    return this.quizService.startAttempt(
      quizId,
      req.user.id,
      req.user.tenantId,
    );
  }

  @Post("attempt/:attemptId/submit")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Submit a quiz attempt for grading" })
  @ApiResponse({ status: 200, description: "Quiz graded, results returned" })
  @ApiResponse({
    status: 400,
    description: "Time limit exceeded or invalid submission",
  })
  @ApiResponse({ status: 404, description: "Attempt not found" })
  async submitAttempt(
    @Param("attemptId") attemptId: string,
    @Body() submitDto: SubmitQuizDto,
    @Request() req: any,
  ) {
    const submission: QuizSubmission = {
      quizId: submitDto.quizId,
      answers: submitDto.answers,
      totalTimeSpent: submitDto.totalTimeSpent,
    };
    return this.quizService.submitAttempt(attemptId, submission, req.user.id);
  }

  @Get(":id/attempts")
  @ApiOperation({ summary: "Get user attempts for a quiz" })
  @ApiResponse({ status: 200, description: "List of user attempts" })
  async getUserAttempts(@Param("id") quizId: string, @Request() req: any) {
    return this.quizService.getUserAttempts(quizId, req.user.id);
  }

  @Get("attempt/:attemptId")
  @ApiOperation({ summary: "Get attempt details with responses" })
  @ApiResponse({ status: 200, description: "Attempt details" })
  @ApiResponse({ status: 404, description: "Attempt not found" })
  async getAttemptDetails(
    @Param("attemptId") attemptId: string,
    @Request() req: any,
  ) {
    return this.quizService.getAttemptDetails(attemptId, req.user.id);
  }
}
