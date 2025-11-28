import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Body,
  Param,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { SimulationService } from "./simulation.service";
import { SimulationEngineService } from "./simulation-engine.service";
import {
  CreateScenarioDto,
  UpdateScenarioDto,
  ScenarioQueryDto,
  StartSessionDto,
  SubmitActionDto,
} from "./dto/simulation.dto";

@ApiTags("Simulations")
@Controller("simulations")
export class SimulationController {
  constructor(
    private readonly simulationService: SimulationService,
    private readonly engineService: SimulationEngineService,
  ) {}

  // ============================================
  // SCENARIO ENDPOINTS
  // ============================================

  @Post("scenarios")
  @ApiOperation({ summary: "Create a simulation scenario" })
  @ApiResponse({ status: 201, description: "Scenario created" })
  async createScenario(@Body() dto: CreateScenarioDto) {
    return this.simulationService.createScenario(dto);
  }

  @Get("scenarios")
  @ApiOperation({ summary: "List simulation scenarios" })
  @ApiResponse({ status: 200, description: "List of scenarios" })
  async getScenarios(@Query() query: ScenarioQueryDto) {
    return this.simulationService.getScenarios(query);
  }

  @Get("scenarios/:id")
  @ApiOperation({ summary: "Get scenario by ID" })
  @ApiResponse({ status: 200, description: "Scenario details" })
  async getScenario(@Param("id") id: string) {
    return this.simulationService.getScenario(id);
  }

  @Patch("scenarios/:id")
  @ApiOperation({ summary: "Update a scenario" })
  @ApiResponse({ status: 200, description: "Scenario updated" })
  async updateScenario(
    @Param("id") id: string,
    @Body() dto: UpdateScenarioDto,
  ) {
    return this.simulationService.updateScenario(id, dto);
  }

  @Delete("scenarios/:id")
  @ApiOperation({ summary: "Delete a scenario" })
  @ApiResponse({ status: 200, description: "Scenario deleted" })
  async deleteScenario(@Param("id") id: string) {
    return this.simulationService.deleteScenario(id);
  }

  @Get("scenarios/ec/:ecStandardId")
  @ApiOperation({ summary: "Get scenarios for an EC standard" })
  @ApiResponse({ status: 200, description: "Scenarios for EC" })
  async getScenariosByEC(@Param("ecStandardId") ecStandardId: string) {
    return this.simulationService.getScenariosByEC(ecStandardId);
  }

  @Post("scenarios/seed/interview/:ecStandardId")
  @ApiOperation({ summary: "Seed interview scenarios for EC" })
  @ApiResponse({ status: 201, description: "Scenarios seeded" })
  async seedInterviewScenarios(@Param("ecStandardId") ecStandardId: string) {
    return this.simulationService.seedInterviewScenarios(ecStandardId);
  }

  @Post("scenarios/seed/presentation/:ecStandardId")
  @ApiOperation({ summary: "Seed presentation scenarios for EC" })
  @ApiResponse({ status: 201, description: "Scenarios seeded" })
  async seedPresentationScenarios(@Param("ecStandardId") ecStandardId: string) {
    return this.simulationService.seedPresentationScenarios(ecStandardId);
  }

  // ============================================
  // SESSION ENDPOINTS
  // ============================================

  @Post("sessions/start")
  @ApiOperation({ summary: "Start a simulation session" })
  @ApiResponse({ status: 201, description: "Session started" })
  async startSession(@Body() dto: StartSessionDto) {
    return this.engineService.startSession(dto);
  }

  @Get("sessions/:id")
  @ApiOperation({ summary: "Get session details" })
  @ApiResponse({ status: 200, description: "Session details" })
  async getSession(@Param("id") id: string) {
    return this.engineService.getSession(id);
  }

  @Post("sessions/:id/pause")
  @ApiOperation({ summary: "Pause a session" })
  @ApiResponse({ status: 200, description: "Session paused" })
  async pauseSession(@Param("id") id: string) {
    return this.engineService.pauseSession(id);
  }

  @Post("sessions/:id/resume")
  @ApiOperation({ summary: "Resume a paused session" })
  @ApiResponse({ status: 200, description: "Session resumed" })
  async resumeSession(@Param("id") id: string) {
    return this.engineService.resumeSession(id);
  }

  @Post("sessions/:id/action")
  @ApiOperation({ summary: "Submit an action during simulation" })
  @ApiResponse({ status: 200, description: "Action processed" })
  async submitAction(@Param("id") id: string, @Body() dto: SubmitActionDto) {
    return this.engineService.submitAction(id, dto);
  }

  @Post("sessions/:id/complete")
  @ApiOperation({ summary: "Complete a simulation session" })
  @ApiResponse({ status: 200, description: "Session completed with results" })
  async completeSession(@Param("id") id: string) {
    return this.engineService.completeSession(id);
  }

  @Post("sessions/:id/abandon")
  @ApiOperation({ summary: "Abandon a simulation session" })
  @ApiResponse({ status: 200, description: "Session abandoned" })
  async abandonSession(@Param("id") id: string) {
    await this.engineService.abandonSession(id);
    return { success: true };
  }

  // ============================================
  // HISTORY ENDPOINTS
  // ============================================

  @Get("history/:enrollmentId")
  @ApiOperation({ summary: "Get simulation history for enrollment" })
  @ApiResponse({ status: 200, description: "Session history" })
  async getHistory(
    @Param("enrollmentId") enrollmentId: string,
    @Query("simulationId") simulationId?: string,
  ) {
    return this.engineService.getSessionHistory(enrollmentId, simulationId);
  }

  @Get("attempts/:attemptId")
  @ApiOperation({ summary: "Get attempt details" })
  @ApiResponse({ status: 200, description: "Attempt details" })
  async getAttemptDetails(@Param("attemptId") attemptId: string) {
    return this.engineService.getAttemptDetails(attemptId);
  }

  // ============================================
  // STATISTICS
  // ============================================

  @Get("stats")
  @ApiOperation({ summary: "Get simulation statistics" })
  @ApiResponse({ status: 200, description: "Statistics" })
  async getStats(@Query("ecStandardId") ecStandardId?: string) {
    return this.simulationService.getScenarioStats(ecStandardId);
  }
}
