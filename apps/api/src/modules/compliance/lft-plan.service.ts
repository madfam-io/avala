import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateLFTPlanDto,
  UpdateLFTPlanDto,
  LFTPlanResponseDto,
  LFTPlanQueryDto,
  LFTPlanSummaryDto,
  TrainingProgramDto,
} from './dto/lft-plan.dto';

/**
 * LFT Plan Service
 * 
 * Manages annual training plans per Ley Federal del Trabajo (LFT) requirements.
 * Mexican labor law requires employers to establish annual training programs
 * and report them to the relevant authorities.
 */
@Injectable()
export class LFTPlanService {
  private readonly logger = new Logger(LFTPlanService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new LFT Plan
   */
  async create(dto: CreateLFTPlanDto): Promise<LFTPlanResponseDto> {
    this.logger.log(`Creating LFT plan for tenant ${dto.tenantId}, year ${dto.year}`);

    // Validate tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${dto.tenantId} not found`);
    }

    // Check for existing plan with same tenant/year/businessUnit
    const existing = await this.prisma.lFTPlan.findFirst({
      where: {
        tenantId: dto.tenantId,
        year: dto.year,
        businessUnit: dto.businessUnit,
      },
    });

    if (existing) {
      throw new ConflictException(
        `LFT Plan already exists for ${dto.businessUnit} in ${dto.year}`,
      );
    }

    // Validate programs
    this.validatePrograms(dto.programs);

    // Create the plan
    const plan = await this.prisma.lFTPlan.create({
      data: {
        tenantId: dto.tenantId,
        year: dto.year,
        businessUnit: dto.businessUnit,
        programJson: dto.programs as any,
      },
    });

    this.logger.log(`LFT Plan created: ${plan.id}`);

    return this.transformToResponse(plan);
  }

  /**
   * Get plan by ID
   */
  async findById(id: string): Promise<LFTPlanResponseDto> {
    const plan = await this.prisma.lFTPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`LFT Plan ${id} not found`);
    }

    return this.transformToResponse(plan);
  }

  /**
   * List plans with filtering and pagination
   */
  async findAll(query: LFTPlanQueryDto) {
    const { tenantId, year, businessUnit, page = 1, limit = 20 } = query;

    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (year) where.year = year;
    if (businessUnit) where.businessUnit = { contains: businessUnit, mode: 'insensitive' };

    const [plans, total] = await Promise.all([
      this.prisma.lFTPlan.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ year: 'desc' }, { businessUnit: 'asc' }],
        include: { tenant: { select: { name: true, slug: true } } },
      }),
      this.prisma.lFTPlan.count({ where }),
    ]);

    return {
      data: plans.map(p => this.transformToResponse(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update an existing plan
   */
  async update(id: string, dto: UpdateLFTPlanDto): Promise<LFTPlanResponseDto> {
    const plan = await this.prisma.lFTPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`LFT Plan ${id} not found`);
    }

    // Check if locked
    if (plan.lockedAt) {
      throw new BadRequestException('Cannot update a locked plan. Unlock it first.');
    }

    // Validate programs if provided
    if (dto.programs) {
      this.validatePrograms(dto.programs);
    }

    const updateData: any = {};
    if (dto.businessUnit) updateData.businessUnit = dto.businessUnit;
    if (dto.programs) updateData.programJson = dto.programs;

    const updated = await this.prisma.lFTPlan.update({
      where: { id },
      data: updateData,
    });

    this.logger.log(`LFT Plan updated: ${id}`);

    return this.transformToResponse(updated);
  }

  /**
   * Delete a plan
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const plan = await this.prisma.lFTPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`LFT Plan ${id} not found`);
    }

    if (plan.lockedAt) {
      throw new BadRequestException('Cannot delete a locked plan');
    }

    await this.prisma.lFTPlan.delete({
      where: { id },
    });

    this.logger.log(`LFT Plan deleted: ${id}`);

    return {
      success: true,
      message: `LFT Plan ${id} deleted successfully`,
    };
  }

  /**
   * Lock/unlock a plan
   */
  async setLock(id: string, lock: boolean): Promise<LFTPlanResponseDto> {
    const plan = await this.prisma.lFTPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`LFT Plan ${id} not found`);
    }

    const updated = await this.prisma.lFTPlan.update({
      where: { id },
      data: {
        lockedAt: lock ? new Date() : null,
      },
    });

    this.logger.log(`LFT Plan ${id} ${lock ? 'locked' : 'unlocked'}`);

    return this.transformToResponse(updated);
  }

  /**
   * Add a program to existing plan
   */
  async addProgram(id: string, program: TrainingProgramDto): Promise<LFTPlanResponseDto> {
    const plan = await this.prisma.lFTPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`LFT Plan ${id} not found`);
    }

    if (plan.lockedAt) {
      throw new BadRequestException('Cannot modify a locked plan');
    }

    const programs = (plan.programJson as unknown as TrainingProgramDto[]) || [];
    programs.push(program);

    const updated = await this.prisma.lFTPlan.update({
      where: { id },
      data: { programJson: programs as any },
    });

    return this.transformToResponse(updated);
  }

  /**
   * Remove a program from plan
   */
  async removeProgram(id: string, programIndex: number): Promise<LFTPlanResponseDto> {
    const plan = await this.prisma.lFTPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`LFT Plan ${id} not found`);
    }

    if (plan.lockedAt) {
      throw new BadRequestException('Cannot modify a locked plan');
    }

    const programs = (plan.programJson as unknown as TrainingProgramDto[]) || [];
    
    if (programIndex < 0 || programIndex >= programs.length) {
      throw new BadRequestException(`Invalid program index: ${programIndex}`);
    }

    programs.splice(programIndex, 1);

    const updated = await this.prisma.lFTPlan.update({
      where: { id },
      data: { programJson: programs as any },
    });

    return this.transformToResponse(updated);
  }

  /**
   * Get summary statistics for a tenant's plans
   */
  async getSummary(tenantId: string, year?: number): Promise<LFTPlanSummaryDto> {
    const where: any = { tenantId };
    if (year) where.year = year;

    const plans = await this.prisma.lFTPlan.findMany({ where });

    let totalPrograms = 0;
    let totalHours = 0;
    let totalParticipants = 0;
    const byType: Record<string, number> = {};
    const byModality: Record<string, number> = {};

    for (const plan of plans) {
      const programs = (plan.programJson as unknown as TrainingProgramDto[]) || [];
      totalPrograms += programs.length;

      for (const program of programs) {
        totalHours += program.duracionHoras || 0;
        totalParticipants += program.participantesEstimados || 0;
        
        byType[program.tipo] = (byType[program.tipo] || 0) + 1;
        byModality[program.modalidad] = (byModality[program.modalidad] || 0) + 1;
      }
    }

    return {
      year: year || new Date().getFullYear(),
      totalPlans: plans.length,
      totalPrograms,
      totalHours,
      totalParticipants,
      lockedPlans: plans.filter(p => p.lockedAt).length,
      byType,
      byModality,
    };
  }

  /**
   * Clone a plan to a new year
   */
  async cloneToYear(id: string, newYear: number): Promise<LFTPlanResponseDto> {
    const plan = await this.prisma.lFTPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`LFT Plan ${id} not found`);
    }

    // Check for existing plan in new year
    const existing = await this.prisma.lFTPlan.findFirst({
      where: {
        tenantId: plan.tenantId,
        year: newYear,
        businessUnit: plan.businessUnit,
      },
    });

    if (existing) {
      throw new ConflictException(
        `LFT Plan already exists for ${plan.businessUnit} in ${newYear}`,
      );
    }

    const cloned = await this.prisma.lFTPlan.create({
      data: {
        tenantId: plan.tenantId,
        year: newYear,
        businessUnit: plan.businessUnit,
        programJson: plan.programJson,
        // Don't copy lockedAt - new plan should be editable
      },
    });

    this.logger.log(`LFT Plan cloned from ${id} to year ${newYear}: ${cloned.id}`);

    return this.transformToResponse(cloned);
  }

  /**
   * Get plans by year with progress tracking
   */
  async getYearOverview(tenantId: string, year: number) {
    const plans = await this.prisma.lFTPlan.findMany({
      where: { tenantId, year },
      orderBy: { businessUnit: 'asc' },
    });

    // Get training completion data for the year
    const trainings = await this.prisma.dC3.findMany({
      where: {
        tenantId,
        issuedAt: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31, 23, 59, 59),
        },
        status: 'ISSUED',
      },
      include: { course: true },
    });

    const overview = plans.map(plan => {
      const programs = (plan.programJson as unknown as TrainingProgramDto[]) || [];
      const plannedHours = programs.reduce((sum, p) => sum + (p.duracionHoras || 0), 0);
      const plannedParticipants = programs.reduce((sum, p) => sum + (p.participantesEstimados || 0), 0);

      // Calculate actual completion (simplified - would need more mapping in production)
      const completedTrainings = trainings.length;

      return {
        ...this.transformToResponse(plan),
        plannedHours,
        plannedParticipants,
        completedTrainings,
        completionRate: plannedParticipants > 0 
          ? Math.round((completedTrainings / plannedParticipants) * 100) 
          : 0,
      };
    });

    return {
      year,
      plans: overview,
      summary: {
        totalPlans: plans.length,
        totalPlannedHours: overview.reduce((sum, p) => sum + p.plannedHours, 0),
        totalPlannedParticipants: overview.reduce((sum, p) => sum + p.plannedParticipants, 0),
        totalCompletedTrainings: trainings.length,
      },
    };
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private validatePrograms(programs: TrainingProgramDto[]): void {
    for (const program of programs) {
      if (program.mesInicio > program.mesFin) {
        throw new BadRequestException(
          `Program "${program.nombre}": Start month cannot be after end month`,
        );
      }

      if (program.duracionHoras < 1) {
        throw new BadRequestException(
          `Program "${program.nombre}": Duration must be at least 1 hour`,
        );
      }

      if (program.participantesEstimados < 1) {
        throw new BadRequestException(
          `Program "${program.nombre}": Must have at least 1 participant`,
        );
      }
    }
  }

  private transformToResponse(plan: any): LFTPlanResponseDto {
    const programs = (plan.programJson as unknown as TrainingProgramDto[]) || [];

    return {
      id: plan.id,
      tenantId: plan.tenantId,
      year: plan.year,
      businessUnit: plan.businessUnit,
      programs,
      isLocked: !!plan.lockedAt,
      lockedAt: plan.lockedAt,
      createdAt: plan.createdAt,
      totalPrograms: programs.length,
      totalHours: programs.reduce((sum, p) => sum + (p.duracionHoras || 0), 0),
      totalParticipants: programs.reduce((sum, p) => sum + (p.participantesEstimados || 0), 0),
    };
  }
}
