import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateSIRCEExportDto,
  SIRCEExportResultDto,
  SIRCETraineeRecordDto,
  SIRCEExportFormat,
  SIRCEExportQueryDto,
  SIRCEValidationResultDto,
} from './dto/sirce.dto';

/**
 * SIRCE Export Service
 * 
 * Generates STPS-compliant SIRCE export files for Mexican labor compliance.
 * SIRCE (Sistema de Registro de Cursos de Capacitación) is the official
 * STPS system for reporting workforce training activities.
 */
@Injectable()
export class SIRCEService {
  private readonly logger = new Logger(SIRCEService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new SIRCE export
   */
  async createExport(dto: CreateSIRCEExportDto): Promise<SIRCEExportResultDto> {
    this.logger.log(`Creating SIRCE export for tenant ${dto.tenantId}, period ${dto.period}`);

    // Validate tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${dto.tenantId} not found`);
    }

    // Parse period to date range
    const { startDate, endDate } = this.parsePeriodToDateRange(dto.period, dto.startDate, dto.endDate);

    // Fetch training records (DC3s with related data)
    const records = await this.fetchTrainingRecords(dto.tenantId, startDate, endDate, dto.completedOnly ?? true);

    // Transform to SIRCE format
    const sirceRecords = await this.transformToSIRCEFormat(records, tenant);

    // Generate export file
    const format = dto.format ?? SIRCEExportFormat.XML;
    const { content, fileRef } = await this.generateExportFile(sirceRecords, format, dto.period);

    // Save export record
    const exportRecord = await this.prisma.sIRCEExport.create({
      data: {
        tenantId: dto.tenantId,
        period: dto.period,
        fileRef,
        status: 'COMPLETED',
      },
    });

    this.logger.log(`SIRCE export created: ${exportRecord.id} with ${sirceRecords.length} records`);

    return {
      id: exportRecord.id,
      period: exportRecord.period,
      status: exportRecord.status,
      fileRef: exportRecord.fileRef,
      format,
      recordCount: sirceRecords.length,
      content: format !== SIRCEExportFormat.JSON ? content : undefined,
      records: format === SIRCEExportFormat.JSON ? sirceRecords : undefined,
      createdAt: exportRecord.createdAt,
    };
  }

  /**
   * Get export by ID
   */
  async getExport(id: string): Promise<SIRCEExportResultDto> {
    const exportRecord = await this.prisma.sIRCEExport.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!exportRecord) {
      throw new NotFoundException(`SIRCE export ${id} not found`);
    }

    return {
      id: exportRecord.id,
      period: exportRecord.period,
      status: exportRecord.status,
      fileRef: exportRecord.fileRef,
      format: 'XML', // Default, could be stored in DB
      recordCount: 0, // Would need to regenerate or store
      createdAt: exportRecord.createdAt,
    };
  }

  /**
   * List exports with pagination
   */
  async listExports(query: SIRCEExportQueryDto) {
    const { tenantId, period, status, page = 1, limit = 20 } = query;

    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (period) where.period = period;
    if (status) where.status = status;

    const [exports, total] = await Promise.all([
      this.prisma.sIRCEExport.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { tenant: { select: { name: true, slug: true } } },
      }),
      this.prisma.sIRCEExport.count({ where }),
    ]);

    return {
      data: exports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Validate data before export
   */
  async validateExportData(dto: CreateSIRCEExportDto): Promise<SIRCEValidationResultDto> {
    const { startDate, endDate } = this.parsePeriodToDateRange(dto.period, dto.startDate, dto.endDate);
    const records = await this.fetchTrainingRecords(dto.tenantId, startDate, endDate, dto.completedOnly ?? true);

    const errors: string[] = [];
    const warnings: string[] = [];
    let validRecords = 0;
    let invalidRecords = 0;

    for (const record of records) {
      const recordErrors = this.validateRecord(record);
      if (recordErrors.length > 0) {
        invalidRecords++;
        errors.push(...recordErrors.map(e => `DC3 ${record.serial}: ${e}`));
      } else {
        validRecords++;
      }

      // Check for warnings
      const recordWarnings = this.checkRecordWarnings(record);
      if (recordWarnings.length > 0) {
        warnings.push(...recordWarnings.map(w => `DC3 ${record.serial}: ${w}`));
      }
    }

    return {
      isValid: invalidRecords === 0,
      totalRecords: records.length,
      validRecords,
      invalidRecords,
      errors: errors.slice(0, 50), // Limit to first 50 errors
      warnings: warnings.slice(0, 20),
    };
  }

  /**
   * Regenerate export file
   */
  async regenerateExport(id: string, format: SIRCEExportFormat): Promise<SIRCEExportResultDto> {
    const exportRecord = await this.prisma.sIRCEExport.findUnique({
      where: { id },
    });

    if (!exportRecord) {
      throw new NotFoundException(`SIRCE export ${id} not found`);
    }

    // Regenerate with same parameters
    return this.createExport({
      tenantId: exportRecord.tenantId,
      period: exportRecord.period,
      format,
    });
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private parsePeriodToDateRange(
    period: string,
    customStart?: string,
    customEnd?: string,
  ): { startDate: Date; endDate: Date } {
    if (customStart && customEnd) {
      return {
        startDate: new Date(customStart),
        endDate: new Date(customEnd),
      };
    }

    // Parse period format: YYYY-MM, YYYY-Q1/Q2/Q3/Q4, or YYYY
    const yearMatch = period.match(/^(\d{4})$/);
    const monthMatch = period.match(/^(\d{4})-(\d{2})$/);
    const quarterMatch = period.match(/^(\d{4})-Q([1-4])$/);

    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      return {
        startDate: new Date(year, 0, 1),
        endDate: new Date(year, 11, 31, 23, 59, 59),
      };
    }

    if (monthMatch) {
      const year = parseInt(monthMatch[1]);
      const month = parseInt(monthMatch[2]) - 1;
      const lastDay = new Date(year, month + 1, 0).getDate();
      return {
        startDate: new Date(year, month, 1),
        endDate: new Date(year, month, lastDay, 23, 59, 59),
      };
    }

    if (quarterMatch) {
      const year = parseInt(quarterMatch[1]);
      const quarter = parseInt(quarterMatch[2]);
      const startMonth = (quarter - 1) * 3;
      const endMonth = startMonth + 2;
      const lastDay = new Date(year, endMonth + 1, 0).getDate();
      return {
        startDate: new Date(year, startMonth, 1),
        endDate: new Date(year, endMonth, lastDay, 23, 59, 59),
      };
    }

    throw new BadRequestException(`Invalid period format: ${period}. Use YYYY, YYYY-MM, or YYYY-Q1/Q2/Q3/Q4`);
  }

  private async fetchTrainingRecords(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    completedOnly: boolean,
  ) {
    const where: any = {
      tenantId,
      issuedAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (completedOnly) {
      where.status = 'ISSUED';
    }

    return this.prisma.dC3.findMany({
      where,
      include: {
        course: true,
        tenant: true,
      },
      orderBy: { issuedAt: 'asc' },
    });
  }

  private async transformToSIRCEFormat(
    records: any[],
    tenant: any,
  ): Promise<SIRCETraineeRecordDto[]> {
    const sirceRecords: SIRCETraineeRecordDto[] = [];

    for (const record of records) {
      // Fetch trainee data
      const trainee = await this.prisma.user.findUnique({
        where: { id: record.traineeId },
      });

      if (!trainee) continue;

      const course = record.course;

      sirceRecords.push({
        curp: trainee.curp || 'PENDIENTE',
        rfc: trainee.rfc || tenant.rfc || 'PENDIENTE',
        nombreCompleto: `${trainee.lastName || ''} ${trainee.firstName || ''}`.trim(),
        puesto: (trainee as any).jobTitle || 'NO ESPECIFICADO',
        area: (trainee as any).department || 'GENERAL',
        nombreCurso: course?.title || 'CURSO DE CAPACITACIÓN',
        objetivoCapacitacion: course?.objectives || 'Desarrollar competencias laborales',
        modalidad: this.mapModality(course?.modality),
        duracionHoras: course?.durationHours || 8,
        fechaInicio: this.formatMexicanDate(record.issuedAt),
        fechaTermino: this.formatMexicanDate(record.issuedAt),
        nombreInstructor: 'INSTRUCTOR INTERNO',
        tipoInstructor: 'INTERNO',
        agenteCapacitador: tenant.name,
        rfcAgenteCapacitador: tenant.rfc || 'PENDIENTE',
        tipoCapacitacion: this.mapTrainingType(course?.category),
        resultado: 'APROBADO',
        folioDC3: record.serial,
      });
    }

    return sirceRecords;
  }

  private async generateExportFile(
    records: SIRCETraineeRecordDto[],
    format: SIRCEExportFormat,
    period: string,
  ): Promise<{ content: string; fileRef: string }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileRef = `SIRCE_${period}_${timestamp}`;

    let content: string;

    switch (format) {
      case SIRCEExportFormat.XML:
        content = this.generateXML(records, period);
        break;
      case SIRCEExportFormat.CSV:
        content = this.generateCSV(records);
        break;
      case SIRCEExportFormat.JSON:
        content = JSON.stringify(records, null, 2);
        break;
      default:
        content = this.generateXML(records, period);
    }

    // In production, would save to S3/storage and return URL
    // For now, return base64 encoded content
    const base64Content = Buffer.from(content, 'utf-8').toString('base64');

    return {
      content: base64Content,
      fileRef: `${fileRef}.${format.toLowerCase()}`,
    };
  }

  private generateXML(records: SIRCETraineeRecordDto[], period: string): string {
    const recordsXml = records.map(r => `
    <RegistroCapacitacion>
      <CURP>${this.escapeXml(r.curp)}</CURP>
      <RFC>${this.escapeXml(r.rfc)}</RFC>
      <NombreCompleto>${this.escapeXml(r.nombreCompleto)}</NombreCompleto>
      <Puesto>${this.escapeXml(r.puesto)}</Puesto>
      <Area>${this.escapeXml(r.area)}</Area>
      <NombreCurso>${this.escapeXml(r.nombreCurso)}</NombreCurso>
      <ObjetivoCapacitacion>${this.escapeXml(r.objetivoCapacitacion)}</ObjetivoCapacitacion>
      <Modalidad>${r.modalidad}</Modalidad>
      <DuracionHoras>${r.duracionHoras}</DuracionHoras>
      <FechaInicio>${r.fechaInicio}</FechaInicio>
      <FechaTermino>${r.fechaTermino}</FechaTermino>
      <NombreInstructor>${this.escapeXml(r.nombreInstructor)}</NombreInstructor>
      <TipoInstructor>${r.tipoInstructor}</TipoInstructor>
      <AgenteCapacitador>${this.escapeXml(r.agenteCapacitador)}</AgenteCapacitador>
      <RFCAgenteCapacitador>${this.escapeXml(r.rfcAgenteCapacitador)}</RFCAgenteCapacitador>
      <TipoCapacitacion>${r.tipoCapacitacion}</TipoCapacitacion>
      <Resultado>${r.resultado}</Resultado>
      <FolioDC3>${r.folioDC3}</FolioDC3>
    </RegistroCapacitacion>`).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<SIRCE xmlns="http://www.stps.gob.mx/sirce" version="1.0">
  <Encabezado>
    <Periodo>${period}</Periodo>
    <FechaGeneracion>${this.formatMexicanDate(new Date())}</FechaGeneracion>
    <TotalRegistros>${records.length}</TotalRegistros>
  </Encabezado>
  <Registros>${recordsXml}
  </Registros>
</SIRCE>`;
  }

  private generateCSV(records: SIRCETraineeRecordDto[]): string {
    const headers = [
      'CURP', 'RFC', 'NombreCompleto', 'Puesto', 'Area', 'NombreCurso',
      'ObjetivoCapacitacion', 'Modalidad', 'DuracionHoras', 'FechaInicio',
      'FechaTermino', 'NombreInstructor', 'TipoInstructor', 'AgenteCapacitador',
      'RFCAgenteCapacitador', 'TipoCapacitacion', 'Resultado', 'FolioDC3',
    ];

    const rows = records.map(r => [
      r.curp, r.rfc, r.nombreCompleto, r.puesto, r.area, r.nombreCurso,
      r.objetivoCapacitacion, r.modalidad, r.duracionHoras.toString(), r.fechaInicio,
      r.fechaTermino, r.nombreInstructor, r.tipoInstructor, r.agenteCapacitador,
      r.rfcAgenteCapacitador, r.tipoCapacitacion, r.resultado, r.folioDC3,
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

    return [headers.join(','), ...rows].join('\n');
  }

  private validateRecord(record: any): string[] {
    const errors: string[] = [];

    // Basic validation rules per STPS requirements
    if (!record.traineeId) {
      errors.push('Missing trainee reference');
    }

    if (!record.courseId) {
      errors.push('Missing course reference');
    }

    return errors;
  }

  private checkRecordWarnings(record: any): string[] {
    const warnings: string[] = [];

    // Check for recommended but not required fields
    if (!record.course?.durationHours) {
      warnings.push('Course duration not specified, using default 8 hours');
    }

    return warnings;
  }

  private mapModality(modality?: string): string {
    const map: Record<string, string> = {
      ONLINE: 'EN_LINEA',
      IN_PERSON: 'PRESENCIAL',
      HYBRID: 'MIXTA',
      BLENDED: 'MIXTA',
    };
    return map[modality?.toUpperCase() || ''] || 'PRESENCIAL';
  }

  private mapTrainingType(category?: string): string {
    // STPS training type codes
    const map: Record<string, string> = {
      TECHNICAL: '01',
      SAFETY: '02',
      QUALITY: '03',
      LEADERSHIP: '04',
      COMPETENCY: '05',
      INDUCTION: '06',
    };
    return map[category?.toUpperCase() || ''] || '01';
  }

  private formatMexicanDate(date: Date): string {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
