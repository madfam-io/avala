import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ECAssessmentService } from './ec-assessment.service';
import {
  CreateECAssessmentDto,
  UpdateECAssessmentDto,
  CreateECSimulationDto,
  UpdateECSimulationDto,
  SubmitAttemptDto,
  SubmitAnswerDto,
  SubmitSimulationDto,
  CreateQuestionDto,
  ECAssessmentResponseDto,
  ECSimulationResponseDto,
  AttemptResultDto,
  UserAssessmentSummaryDto,
} from './dto/ec-assessment.dto';

@ApiTags('EC Assessments')
@ApiBearerAuth()
@Controller('ec-assessment')
export class ECAssessmentController {
  constructor(private readonly ecAssessmentService: ECAssessmentService) {}

  // ============================================
  // ASSESSMENTS
  // ============================================

  @Post('assessments/:ecCode')
  @ApiOperation({ summary: 'Create assessment for EC Standard' })
  @ApiParam({ name: 'ecCode', example: 'EC0249' })
  @ApiResponse({ status: 201, type: ECAssessmentResponseDto })
  async createAssessment(
    @Param('ecCode') ecCode: string,
    @Body() dto: CreateECAssessmentDto,
  ) {
    return this.ecAssessmentService.createAssessment(ecCode, dto);
  }

  @Get('assessments/:ecCode')
  @ApiOperation({ summary: 'Get assessments for EC Standard' })
  @ApiParam({ name: 'ecCode', example: 'EC0249' })
  @ApiResponse({ status: 200, type: [ECAssessmentResponseDto] })
  async findAssessments(@Param('ecCode') ecCode: string) {
    return this.ecAssessmentService.findAssessmentsByStandard(ecCode);
  }

  @Get('assessments/by-id/:id')
  @ApiOperation({ summary: 'Get assessment by ID' })
  @ApiResponse({ status: 200, type: ECAssessmentResponseDto })
  async findAssessmentById(@Param('id') id: string) {
    return this.ecAssessmentService.findAssessmentById(id);
  }

  @Put('assessments/:id')
  @ApiOperation({ summary: 'Update assessment' })
  @ApiResponse({ status: 200, type: ECAssessmentResponseDto })
  async updateAssessment(
    @Param('id') id: string,
    @Body() dto: UpdateECAssessmentDto,
  ) {
    return this.ecAssessmentService.updateAssessment(id, dto);
  }

  @Post('assessments/:id/questions')
  @ApiOperation({ summary: 'Add question to assessment' })
  @ApiResponse({ status: 201, description: 'Question added' })
  async addQuestion(
    @Param('id') id: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.ecAssessmentService.addQuestion(id, dto);
  }

  @Delete('assessments/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete assessment' })
  @ApiResponse({ status: 200, description: 'Assessment deleted' })
  async deleteAssessment(@Param('id') id: string) {
    return this.ecAssessmentService.deleteAssessment(id);
  }

  // ============================================
  // SIMULATIONS
  // ============================================

  @Post('simulations/:ecCode')
  @ApiOperation({ summary: 'Create simulation for EC Standard' })
  @ApiParam({ name: 'ecCode', example: 'EC0249' })
  @ApiResponse({ status: 201, type: ECSimulationResponseDto })
  async createSimulation(
    @Param('ecCode') ecCode: string,
    @Body() dto: CreateECSimulationDto,
  ) {
    return this.ecAssessmentService.createSimulation(ecCode, dto);
  }

  @Get('simulations/:ecCode')
  @ApiOperation({ summary: 'Get simulations for EC Standard' })
  @ApiParam({ name: 'ecCode', example: 'EC0249' })
  @ApiResponse({ status: 200, type: [ECSimulationResponseDto] })
  async findSimulations(@Param('ecCode') ecCode: string) {
    return this.ecAssessmentService.findSimulationsByStandard(ecCode);
  }

  @Get('simulations/by-id/:id')
  @ApiOperation({ summary: 'Get simulation by ID' })
  @ApiResponse({ status: 200, type: ECSimulationResponseDto })
  async findSimulationById(@Param('id') id: string) {
    return this.ecAssessmentService.findSimulationById(id);
  }

  @Put('simulations/:id')
  @ApiOperation({ summary: 'Update simulation' })
  @ApiResponse({ status: 200, type: ECSimulationResponseDto })
  async updateSimulation(
    @Param('id') id: string,
    @Body() dto: UpdateECSimulationDto,
  ) {
    return this.ecAssessmentService.updateSimulation(id, dto);
  }

  @Delete('simulations/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete simulation' })
  @ApiResponse({ status: 200, description: 'Simulation deleted' })
  async deleteSimulation(@Param('id') id: string) {
    return this.ecAssessmentService.deleteSimulation(id);
  }

  // ============================================
  // ASSESSMENT ATTEMPTS
  // ============================================

  @Post('enrollments/:enrollmentId/assessments/:assessmentId/start')
  @ApiOperation({ summary: 'Start assessment attempt' })
  @ApiResponse({ status: 201, description: 'Attempt started' })
  async startAssessmentAttempt(
    @Param('enrollmentId') enrollmentId: string,
    @Param('assessmentId') assessmentId: string,
  ) {
    return this.ecAssessmentService.startAssessmentAttempt(
      enrollmentId,
      assessmentId,
    );
  }

  @Post('attempts/:attemptId/answer')
  @ApiOperation({ summary: 'Submit single answer' })
  @ApiResponse({ status: 200, description: 'Answer submitted' })
  async submitAnswer(
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.ecAssessmentService.submitAssessmentAnswer(attemptId, dto);
  }

  @Post('attempts/:attemptId/submit')
  @ApiOperation({ summary: 'Submit all answers and complete attempt' })
  @ApiResponse({ status: 200, type: AttemptResultDto })
  async submitAttempt(
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.ecAssessmentService.submitAssessmentAttempt(attemptId, dto);
  }

  @Get('attempts/:attemptId')
  @ApiOperation({ summary: 'Get attempt details' })
  @ApiResponse({ status: 200, description: 'Attempt details' })
  async getAttempt(@Param('attemptId') attemptId: string) {
    return this.ecAssessmentService.getAttemptById(attemptId);
  }

  // ============================================
  // SIMULATION ATTEMPTS
  // ============================================

  @Post('enrollments/:enrollmentId/simulations/:simulationId/start')
  @ApiOperation({ summary: 'Start simulation attempt' })
  @ApiResponse({ status: 201, description: 'Attempt started' })
  async startSimulationAttempt(
    @Param('enrollmentId') enrollmentId: string,
    @Param('simulationId') simulationId: string,
  ) {
    return this.ecAssessmentService.startSimulationAttempt(
      enrollmentId,
      simulationId,
    );
  }

  @Post('simulation-attempts/:attemptId/submit')
  @ApiOperation({ summary: 'Submit simulation responses' })
  @ApiResponse({ status: 200, description: 'Simulation submitted' })
  async submitSimulation(
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitSimulationDto,
  ) {
    return this.ecAssessmentService.submitSimulationAttempt(attemptId, dto);
  }

  @Post('simulation-attempts/:attemptId/grade')
  @ApiOperation({ summary: 'Grade simulation (instructor)' })
  @ApiResponse({ status: 200, description: 'Simulation graded' })
  async gradeSimulation(
    @Param('attemptId') attemptId: string,
    @Body()
    body: {
      scores: { criterionIndex: number; points: number; feedback?: string }[];
    },
  ) {
    return this.ecAssessmentService.gradeSimulation(attemptId, body.scores);
  }

  // ============================================
  // USER SUMMARIES
  // ============================================

  @Get('enrollments/:enrollmentId/summary')
  @ApiOperation({ summary: 'Get user assessment summary' })
  @ApiResponse({ status: 200, type: [UserAssessmentSummaryDto] })
  async getUserSummary(@Param('enrollmentId') enrollmentId: string) {
    return this.ecAssessmentService.getUserAssessmentSummary(enrollmentId);
  }
}
