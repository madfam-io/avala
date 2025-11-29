import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { DC3StatusDto } from "./dto/dc3.dto";
import {
  CreateDC3Dto,
  DC3QueryDto,
  RevokeDC3Dto,
  BulkCreateDC3Dto,
  DC3ResponseDto,
  VerifyDC3ResponseDto,
} from "./dto/dc3.dto";
import { randomBytes } from "crypto";

/**
 * DC3Service - Manages DC-3 constancia generation and lifecycle
 *
 * DC-3 is a Mexican official training certificate format required by STPS.
 * This service handles:
 * - Serial number generation (unique per tenant)
 * - DC-3 record creation and storage
 * - PDF generation reference management
 * - Verification endpoint support
 * - Revocation with audit trail
 */
@Injectable()
export class DC3Service {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate unique serial number for DC-3
   * Format: TENANT_PREFIX-YEAR-SEQUENCE (e.g., AVL-2025-000001)
   */
  private async generateSerial(tenantId: string): Promise<string> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const year = new Date().getFullYear();
    const prefix = tenant.slug.substring(0, 3).toUpperCase();

    // Get count of DC3s for this tenant this year for sequence
    const count = await this.prisma.dC3.count({
      where: {
        tenantId,
        issuedAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    });

    const sequence = (count + 1).toString().padStart(6, "0");
    const serial = `${prefix}-${year}-${sequence}`;

    // Verify uniqueness (edge case protection)
    const existing = await this.prisma.dC3.findUnique({
      where: { serial },
    });

    if (existing) {
      // Add random suffix if collision (very rare)
      const suffix = randomBytes(2).toString("hex").toUpperCase();
      return `${prefix}-${year}-${sequence}-${suffix}`;
    }

    return serial;
  }

  /**
   * Create a single DC-3 record
   */
  async create(dto: CreateDC3Dto): Promise<DC3ResponseDto> {
    // Validate tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant ${dto.tenantId} not found`);
    }

    // Validate trainee exists and belongs to tenant
    const trainee = await this.prisma.user.findFirst({
      where: { id: dto.traineeId, tenantId: dto.tenantId },
    });
    if (!trainee) {
      throw new NotFoundException(
        `Trainee ${dto.traineeId} not found in tenant`,
      );
    }

    // Validate course exists
    const course = await this.prisma.course.findFirst({
      where: { id: dto.courseId, tenantId: dto.tenantId },
    });
    if (!course) {
      throw new NotFoundException(`Course ${dto.courseId} not found in tenant`);
    }

    // Check for duplicate DC-3 (same trainee + course)
    const existing = await this.prisma.dC3.findFirst({
      where: {
        tenantId: dto.tenantId,
        traineeId: dto.traineeId,
        courseId: dto.courseId,
        status: "ISSUED",
      },
    });
    if (existing) {
      throw new ConflictException(
        `DC-3 already exists for trainee ${dto.traineeId} and course ${dto.courseId}. Serial: ${existing.serial}`,
      );
    }

    // Generate unique serial
    const serial = await this.generateSerial(dto.tenantId);

    // Build metadata from provided info
    const metadata: Record<string, any> = {};
    if (dto.traineeInfo) metadata.trainee = dto.traineeInfo;
    if (dto.courseInfo) metadata.course = dto.courseInfo;
    if (dto.instructorInfo) metadata.instructor = dto.instructorInfo;
    if (dto.employerInfo) metadata.employer = dto.employerInfo;
    if (dto.finalScore !== undefined) metadata.finalScore = dto.finalScore;
    if (dto.enrollmentId) metadata.enrollmentId = dto.enrollmentId;

    // Create DC-3 record
    const dc3 = await this.prisma.dC3.create({
      data: {
        tenantId: dto.tenantId,
        traineeId: dto.traineeId,
        courseId: dto.courseId,
        serial,
        status: "ISSUED",
        issuedAt: dto.issueDate ? new Date(dto.issueDate) : new Date(),
        // Note: pdfRef will be set after PDF generation
      },
    });

    return this.mapToResponse(dc3, metadata);
  }

  /**
   * Bulk create DC-3 records for multiple trainees
   */
  async bulkCreate(
    dto: BulkCreateDC3Dto,
  ): Promise<{
    created: DC3ResponseDto[];
    errors: { traineeId: string; error: string }[];
  }> {
    const created: DC3ResponseDto[] = [];
    const errors: { traineeId: string; error: string }[] = [];

    for (const traineeId of dto.traineeIds) {
      try {
        const dc3 = await this.create({
          tenantId: dto.tenantId,
          traineeId,
          courseId: dto.courseId,
          instructorInfo: dto.instructorInfo,
          employerInfo: dto.employerInfo,
        });
        created.push(dc3);
      } catch (error) {
        errors.push({
          traineeId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { created, errors };
  }

  /**
   * Find DC-3 by ID
   */
  async findById(id: string): Promise<DC3ResponseDto> {
    const dc3 = await this.prisma.dC3.findUnique({
      where: { id },
      include: {
        tenant: { select: { name: true, slug: true } },
        course: { select: { title: true, code: true } },
      },
    });

    if (!dc3) {
      throw new NotFoundException(`DC-3 ${id} not found`);
    }

    return this.mapToResponse(dc3);
  }

  /**
   * Find DC-3 by serial number
   */
  async findBySerial(serial: string): Promise<DC3ResponseDto> {
    const dc3 = await this.prisma.dC3.findUnique({
      where: { serial },
      include: {
        tenant: { select: { name: true, slug: true } },
        course: { select: { title: true, code: true } },
      },
    });

    if (!dc3) {
      throw new NotFoundException(`DC-3 with serial ${serial} not found`);
    }

    return this.mapToResponse(dc3);
  }

  /**
   * List DC-3 records with filtering and pagination
   */
  async findAll(
    query: DC3QueryDto,
  ): Promise<{
    data: DC3ResponseDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const {
      tenantId,
      traineeId,
      courseId,
      status,
      serial,
      issuedFrom,
      issuedTo,
      page = 1,
      limit = 20,
    } = query;

    const where: any = { tenantId };

    if (traineeId) where.traineeId = traineeId;
    if (courseId) where.courseId = courseId;
    if (status) where.status = status;
    if (serial) where.serial = { contains: serial, mode: "insensitive" };
    if (issuedFrom || issuedTo) {
      where.issuedAt = {};
      if (issuedFrom) where.issuedAt.gte = new Date(issuedFrom);
      if (issuedTo) where.issuedAt.lte = new Date(issuedTo);
    }

    const [records, total] = await Promise.all([
      this.prisma.dC3.findMany({
        where,
        include: {
          tenant: { select: { name: true } },
          course: { select: { title: true, code: true } },
        },
        orderBy: { issuedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.dC3.count({ where }),
    ]);

    return {
      data: records.map((r) => this.mapToResponse(r)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get DC-3 records for a specific trainee
   */
  async findByTrainee(
    tenantId: string,
    traineeId: string,
  ): Promise<DC3ResponseDto[]> {
    const records = await this.prisma.dC3.findMany({
      where: { tenantId, traineeId },
      include: {
        course: { select: { title: true, code: true } },
      },
      orderBy: { issuedAt: "desc" },
    });

    return records.map((r) => this.mapToResponse(r));
  }

  /**
   * Revoke a DC-3 record
   */
  async revoke(id: string, dto: RevokeDC3Dto): Promise<DC3ResponseDto> {
    const dc3 = await this.prisma.dC3.findUnique({
      where: { id },
    });

    if (!dc3) {
      throw new NotFoundException(`DC-3 ${id} not found`);
    }

    if (dc3.status === "REVOKED") {
      throw new BadRequestException(`DC-3 ${id} is already revoked`);
    }

    const updated = await this.prisma.dC3.update({
      where: { id },
      data: {
        status: "REVOKED",
      },
    });

    // Return with revocation info in metadata
    return this.mapToResponse(updated, {
      revocationReason: dto.reason,
      revocationNotes: dto.notes,
      revokedAt: new Date(),
    });
  }

  /**
   * Verify DC-3 by serial (public endpoint)
   * Returns limited information for privacy
   */
  async verify(serial: string): Promise<VerifyDC3ResponseDto> {
    const dc3 = await this.prisma.dC3.findUnique({
      where: { serial },
      include: {
        tenant: { select: { name: true } },
        course: { select: { title: true } },
      },
    });

    if (!dc3) {
      return {
        valid: false,
        serial,
        status: DC3StatusDto.REVOKED,
        message: "DC-3 not found. The serial number may be invalid.",
      };
    }

    const isValid = dc3.status === "ISSUED";

    return {
      valid: isValid,
      serial: dc3.serial,
      status: dc3.status as DC3StatusDto,
      issuedAt: dc3.issuedAt,
      courseName: dc3.course?.title,
      issuerName: dc3.tenant?.name,
      message: isValid
        ? "DC-3 is valid and verified."
        : "DC-3 has been revoked and is no longer valid.",
    };
  }

  /**
   * Update PDF reference after generation
   */
  async updatePdfRef(id: string, pdfRef: string): Promise<DC3ResponseDto> {
    const dc3 = await this.prisma.dC3.update({
      where: { id },
      data: { pdfRef },
    });

    return this.mapToResponse(dc3);
  }

  /**
   * Get statistics for DC-3 records
   */
  async getStatistics(
    tenantId: string,
    year?: number,
  ): Promise<{
    total: number;
    issued: number;
    revoked: number;
    byMonth: { month: number; count: number }[];
  }> {
    const targetYear = year || new Date().getFullYear();
    const startDate = new Date(`${targetYear}-01-01`);
    const endDate = new Date(`${targetYear + 1}-01-01`);

    const [total, issued, revoked] = await Promise.all([
      this.prisma.dC3.count({
        where: { tenantId, issuedAt: { gte: startDate, lt: endDate } },
      }),
      this.prisma.dC3.count({
        where: {
          tenantId,
          status: "ISSUED",
          issuedAt: { gte: startDate, lt: endDate },
        },
      }),
      this.prisma.dC3.count({
        where: {
          tenantId,
          status: "REVOKED",
          issuedAt: { gte: startDate, lt: endDate },
        },
      }),
    ]);

    // Get monthly breakdown
    const byMonth: { month: number; count: number }[] = [];
    for (let month = 1; month <= 12; month++) {
      const monthStart = new Date(
        `${targetYear}-${month.toString().padStart(2, "0")}-01`,
      );
      const monthEnd = new Date(targetYear, month, 1);

      const count = await this.prisma.dC3.count({
        where: {
          tenantId,
          issuedAt: { gte: monthStart, lt: monthEnd },
        },
      });

      byMonth.push({ month, count });
    }

    return { total, issued, revoked, byMonth };
  }

  /**
   * Map database record to response DTO
   */
  private mapToResponse(
    dc3: any,
    additionalMetadata?: Record<string, any>,
  ): DC3ResponseDto {
    return {
      id: dc3.id,
      serial: dc3.serial,
      tenantId: dc3.tenantId,
      traineeId: dc3.traineeId,
      courseId: dc3.courseId,
      status: dc3.status,
      pdfRef: dc3.pdfRef,
      issuedAt: dc3.issuedAt,
      metadata: {
        ...(dc3.tenant && { tenantName: dc3.tenant.name }),
        ...(dc3.course && {
          courseName: dc3.course.title,
          courseCode: dc3.course.code,
        }),
        ...additionalMetadata,
      },
    };
  }
}
