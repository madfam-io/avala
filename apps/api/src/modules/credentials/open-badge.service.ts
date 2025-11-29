import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { randomUUID } from 'crypto';
import {
  IssueBadgeDto,
  BulkIssueBadgeDto,
  RevokeBadgeDto,
  CredentialQueryDto,
  CredentialResponseDto,
  VerifyCredentialResponseDto,
  CredentialStatisticsDto,
  OpenBadgeCredentialDto,
  CredentialStatusDto,
  AchievementType,
  AlignmentDto,
} from './dto/open-badge.dto';

/**
 * OpenBadgeService - Open Badges 3.0 Credential Issuance
 *
 * Implements W3C Verifiable Credentials / Open Badges 3.0 specification
 * https://www.imsglobal.org/spec/ob/v3p0/
 *
 * Features:
 * - OBv3 compliant credential generation
 * - CONOCER/STPS alignment for Mexican competency standards
 * - Credential lifecycle management (issue, verify, revoke)
 * - Bulk issuance support
 * - Public verification endpoint
 */
@Injectable()
export class OpenBadgeService {
  private readonly logger = new Logger(OpenBadgeService.name);

  // OBv3 JSON-LD contexts
  private readonly OB_CONTEXT = [
    'https://www.w3.org/2018/credentials/v1',
    'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
  ];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Issue a new Open Badge credential
   */
  async issue(dto: IssueBadgeDto): Promise<CredentialResponseDto> {
    this.logger.log(`Issuing badge for trainee ${dto.traineeId} in tenant ${dto.tenantId}`);

    // Validate tenant
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
      throw new NotFoundException(`Trainee ${dto.traineeId} not found in tenant`);
    }

    // Validate course if provided
    let course = null;
    if (dto.courseId) {
      course = await this.prisma.course.findFirst({
        where: { id: dto.courseId, tenantId: dto.tenantId },
      });
      if (!course) {
        throw new NotFoundException(`Course ${dto.courseId} not found in tenant`);
      }
    }

    // Generate unique credential ID
    const credentialId = randomUUID();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://avala.mx';
    const credentialUri = `${baseUrl}/credentials/${credentialId}`;

    // Build alignments (include EC codes if available)
    const alignments = this.buildAlignments(dto.alignments, course);

    // Build OBv3 credential payload
    const obCredential = this.buildOBv3Credential({
      credentialUri,
      tenant,
      trainee,
      achievement: dto.achievement,
      alignments,
      expiresAt: dto.expiresAt,
      evidence: dto.evidence,
    });

    // Create credential record
    const credential = await this.prisma.credential.create({
      data: {
        id: credentialId,
        tenantId: dto.tenantId,
        traineeId: dto.traineeId,
        type: 'OBV3',
        payloadJson: obCredential as any,
        status: 'ACTIVE',
        issuedAt: new Date(),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    this.logger.log(`Badge issued: ${credential.id}`);

    return this.mapToResponse(credential);
  }

  /**
   * Bulk issue badges to multiple trainees
   */
  async bulkIssue(dto: BulkIssueBadgeDto): Promise<{
    issued: CredentialResponseDto[];
    errors: { traineeId: string; error: string }[];
  }> {
    const issued: CredentialResponseDto[] = [];
    const errors: { traineeId: string; error: string }[] = [];

    for (const traineeId of dto.traineeIds) {
      try {
        const credential = await this.issue({
          tenantId: dto.tenantId,
          traineeId,
          courseId: dto.courseId,
          achievement: dto.achievement,
          alignments: dto.alignments,
          expiresAt: dto.expiresAt,
        });
        issued.push(credential);
      } catch (error) {
        errors.push({
          traineeId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { issued, errors };
  }

  /**
   * Get credential by ID
   */
  async findById(id: string): Promise<CredentialResponseDto> {
    const credential = await this.prisma.credential.findUnique({
      where: { id },
      include: {
        tenant: { select: { name: true } },
      },
    });

    if (!credential) {
      throw new NotFoundException(`Credential ${id} not found`);
    }

    return this.mapToResponse(credential);
  }

  /**
   * List credentials with filtering and pagination
   */
  async findAll(query: CredentialQueryDto): Promise<{
    data: CredentialResponseDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const {
      tenantId,
      traineeId,
      status,
      achievementType,
      // courseId filtering not implemented yet
      issuedFrom,
      issuedTo,
      page = 1,
      limit = 20,
    } = query;

    const where: any = { tenantId };

    if (traineeId) where.traineeId = traineeId;
    if (status) where.status = status;
    if (issuedFrom || issuedTo) {
      where.issuedAt = {};
      if (issuedFrom) where.issuedAt.gte = new Date(issuedFrom);
      if (issuedTo) where.issuedAt.lte = new Date(issuedTo);
    }

    // Filter by achievement type requires JSON query
    if (achievementType) {
      where.payloadJson = {
        path: ['credentialSubject', 'achievement', 'achievementType'],
        equals: achievementType,
      };
    }

    const [records, total] = await Promise.all([
      this.prisma.credential.findMany({
        where,
        include: {
          tenant: { select: { name: true } },
        },
        orderBy: { issuedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.credential.count({ where }),
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
   * Get credentials for a specific trainee
   */
  async findByTrainee(tenantId: string, traineeId: string): Promise<CredentialResponseDto[]> {
    const credentials = await this.prisma.credential.findMany({
      where: { tenantId, traineeId },
      include: {
        tenant: { select: { name: true } },
      },
      orderBy: { issuedAt: 'desc' },
    });

    return credentials.map((c) => this.mapToResponse(c));
  }

  /**
   * Revoke a credential
   */
  async revoke(id: string, dto: RevokeBadgeDto): Promise<CredentialResponseDto> {
    const credential = await this.prisma.credential.findUnique({
      where: { id },
    });

    if (!credential) {
      throw new NotFoundException(`Credential ${id} not found`);
    }

    if (credential.status === 'REVOKED') {
      throw new BadRequestException(`Credential ${id} is already revoked`);
    }

    // Update credential status
    const updated = await this.prisma.credential.update({
      where: { id },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
      },
    });

    this.logger.log(`Credential revoked: ${id}, reason: ${dto.reason}`);

    return this.mapToResponse(updated, {
      revocationReason: dto.reason,
      revocationNotes: dto.notes,
    });
  }

  /**
   * Public verification endpoint
   */
  async verify(credentialId: string): Promise<VerifyCredentialResponseDto> {
    const credential = await this.prisma.credential.findUnique({
      where: { id: credentialId },
      include: {
        tenant: { select: { name: true } },
        trainee: { select: { firstName: true, lastName: true } },
      },
    });

    if (!credential) {
      return {
        valid: false,
        credentialId,
        status: CredentialStatusDto.REVOKED,
        message: 'Credential not found. The ID may be invalid.',
      };
    }

    const payload = credential.payloadJson as any;
    const isExpired = credential.expiresAt && new Date(credential.expiresAt) < new Date();
    const isRevoked = credential.status === 'REVOKED';
    const isValid = !isExpired && !isRevoked;

    return {
      valid: isValid,
      credentialId: credential.id,
      status: isRevoked
        ? CredentialStatusDto.REVOKED
        : isExpired
          ? CredentialStatusDto.EXPIRED
          : CredentialStatusDto.ACTIVE,
      message: isValid
        ? 'Credential is valid and verified.'
        : isRevoked
          ? 'Credential has been revoked.'
          : 'Credential has expired.',
      achievementName: payload?.credentialSubject?.achievement?.name,
      recipientName: credential.trainee
        ? `${credential.trainee.firstName || ''} ${credential.trainee.lastName || ''}`.trim()
        : undefined,
      issuerName: credential.tenant?.name,
      issuedAt: credential.issuedAt,
      expiresAt: credential.expiresAt || undefined,
    };
  }

  /**
   * Get raw OBv3 JSON-LD credential for sharing
   */
  async getCredentialPayload(id: string): Promise<OpenBadgeCredentialDto> {
    const credential = await this.prisma.credential.findUnique({
      where: { id },
    });

    if (!credential) {
      throw new NotFoundException(`Credential ${id} not found`);
    }

    return credential.payloadJson as unknown as OpenBadgeCredentialDto;
  }

  /**
   * Get statistics for credentials
   */
  async getStatistics(tenantId: string, year?: number): Promise<CredentialStatisticsDto> {
    const targetYear = year || new Date().getFullYear();
    const startDate = new Date(`${targetYear}-01-01`);
    const endDate = new Date(`${targetYear + 1}-01-01`);

    const [total, active, revoked, expired] = await Promise.all([
      this.prisma.credential.count({
        where: { tenantId, issuedAt: { gte: startDate, lt: endDate } },
      }),
      this.prisma.credential.count({
        where: {
          tenantId,
          status: 'ACTIVE',
          issuedAt: { gte: startDate, lt: endDate },
        },
      }),
      this.prisma.credential.count({
        where: {
          tenantId,
          status: 'REVOKED',
          issuedAt: { gte: startDate, lt: endDate },
        },
      }),
      this.prisma.credential.count({
        where: {
          tenantId,
          status: 'EXPIRED',
          issuedAt: { gte: startDate, lt: endDate },
        },
      }),
    ]);

    // Monthly breakdown
    const byMonth: { month: number; count: number }[] = [];
    for (let month = 1; month <= 12; month++) {
      const monthStart = new Date(`${targetYear}-${month.toString().padStart(2, '0')}-01`);
      const monthEnd = new Date(targetYear, month, 1);

      const count = await this.prisma.credential.count({
        where: {
          tenantId,
          issuedAt: { gte: monthStart, lt: monthEnd },
        },
      });

      byMonth.push({ month, count });
    }

    // Type breakdown (simplified - would need JSON query for full implementation)
    const byType = [
      { type: AchievementType.Course, count: total }, // Placeholder
    ];

    return { total, active, revoked, expired, byType, byMonth };
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Build OBv3 compliant credential
   */
  private buildOBv3Credential(params: {
    credentialUri: string;
    tenant: any;
    trainee: any;
    achievement: any;
    alignments?: AlignmentDto[];
    expiresAt?: string;
    evidence?: string[];
  }): OpenBadgeCredentialDto {
    const { credentialUri, tenant, trainee, achievement, alignments, expiresAt, evidence } = params;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://avala.mx';
    const issuanceDate = new Date().toISOString();

    // Build credential subject
    const credentialSubject: any = {
      id: `urn:uuid:${trainee.id}`,
      type: ['AchievementSubject'],
      name: `${trainee.firstName || ''} ${trainee.lastName || ''}`.trim(),
      achievement: {
        id: `${baseUrl}/achievements/${randomUUID()}`,
        type: ['Achievement'],
        achievementType: achievement.achievementType || AchievementType.Achievement,
        name: achievement.name,
        description: achievement.description,
        criteria: {
          narrative: achievement.criteria || `Completion of ${achievement.name}`,
        },
        image: achievement.image
          ? {
              id: achievement.image,
              type: 'Image',
            }
          : undefined,
      },
    };

    // Add alignments
    if (alignments && alignments.length > 0) {
      credentialSubject.achievement.alignment = alignments.map((a) => ({
        type: ['Alignment'],
        targetName: a.targetName,
        targetUrl: a.targetUrl,
        targetCode: a.targetCode,
        targetDescription: a.targetDescription,
        targetFramework: a.targetFramework,
      }));
    }

    // Build full credential
    const credential: OpenBadgeCredentialDto = {
      '@context': this.OB_CONTEXT,
      id: credentialUri,
      type: ['VerifiableCredential', 'OpenBadgeCredential'],
      issuer: {
        id: `${baseUrl}/issuers/${tenant.id}`,
        type: ['Profile'],
        name: tenant.legalName || tenant.name,
        url: tenant.website || baseUrl,
        email: tenant.contactEmail,
        description: tenant.description,
        image: tenant.logoUrl,
      } as any,
      issuanceDate,
      credentialSubject,
    };

    // Add expiration if provided
    if (expiresAt) {
      credential.expirationDate = new Date(expiresAt).toISOString();
    }

    // Add evidence if provided
    if (evidence && evidence.length > 0) {
      credential.evidence = evidence.map((url) => ({
        id: url,
        type: ['Evidence'],
      }));
    }

    // Add credential status (for revocation checking)
    credential.credentialStatus = {
      id: `${baseUrl}/credentials/${credentialUri.split('/').pop()}/status`,
      type: 'BitstringStatusListEntry',
      statusPurpose: 'revocation',
      statusListIndex: '0',
      statusListCredential: `${baseUrl}/status-list/${tenant.id}`,
    };

    return credential;
  }

  /**
   * Build alignments from provided data and course EC codes
   */
  private buildAlignments(
    providedAlignments?: AlignmentDto[],
    course?: any,
  ): AlignmentDto[] {
    const alignments: AlignmentDto[] = [...(providedAlignments || [])];

    // Add EC codes from course if available
    if (course?.ecCodes && Array.isArray(course.ecCodes)) {
      for (const ecCode of course.ecCodes) {
        alignments.push({
          targetName: `CONOCER EC ${ecCode}`,
          targetCode: ecCode,
          targetDescription: `Estándar de Competencia ${ecCode}`,
          targetFramework: 'CONOCER' as any,
          targetUrl: `https://conocer.gob.mx/registro-nacional-estandares-competencia/?q=${ecCode}`,
        });
      }
    }

    return alignments;
  }

  /**
   * Map database record to response DTO
   */
  private mapToResponse(
    credential: any,
    additionalMetadata?: Record<string, any>,
  ): CredentialResponseDto {
    const payload = credential.payloadJson as any;

    return {
      id: credential.id,
      tenantId: credential.tenantId,
      traineeId: credential.traineeId,
      type: credential.type,
      status: credential.status as CredentialStatusDto,
      issuedAt: credential.issuedAt,
      expiresAt: credential.expiresAt || undefined,
      revokedAt: credential.revokedAt || undefined,
      credential: payload,
      ...additionalMetadata,
    };
  }
}
