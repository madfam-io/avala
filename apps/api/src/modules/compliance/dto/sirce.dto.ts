import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsDateString,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * SIRCE (Sistema de Registro de Cursos de Capacitación) DTOs
 * Mexican STPS compliance format for training reporting
 */

export enum SIRCEExportFormat {
  XML = 'XML',
  JSON = 'JSON',
  CSV = 'CSV',
}

export class CreateSIRCEExportDto {
  @ApiProperty({ description: 'Tenant ID' })
  @IsUUID()
  tenantId: string;

  @ApiProperty({ description: 'Export period (YYYY-MM or YYYY-Q1/Q2/Q3/Q4)', example: '2025-Q1' })
  @IsString()
  period: string;

  @ApiPropertyOptional({ description: 'Start date for training records filter' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for training records filter' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: SIRCEExportFormat, default: SIRCEExportFormat.XML })
  @IsOptional()
  @IsEnum(SIRCEExportFormat)
  format?: SIRCEExportFormat = SIRCEExportFormat.XML;

  @ApiPropertyOptional({ description: 'Include only completed trainings', default: true })
  @IsOptional()
  completedOnly?: boolean = true;
}

export class SIRCETraineeRecordDto {
  @ApiProperty({ description: 'Employee CURP (18 characters)' })
  curp: string;

  @ApiProperty({ description: 'Employee RFC' })
  rfc: string;

  @ApiProperty({ description: 'Full name' })
  nombreCompleto: string;

  @ApiProperty({ description: 'Job position' })
  puesto: string;

  @ApiProperty({ description: 'Training area/department' })
  area: string;

  @ApiProperty({ description: 'Course name' })
  nombreCurso: string;

  @ApiProperty({ description: 'Training objective' })
  objetivoCapacitacion: string;

  @ApiProperty({ description: 'Training modality (PRESENCIAL, EN_LINEA, MIXTA)' })
  modalidad: string;

  @ApiProperty({ description: 'Training hours' })
  duracionHoras: number;

  @ApiProperty({ description: 'Start date' })
  fechaInicio: string;

  @ApiProperty({ description: 'End date' })
  fechaTermino: string;

  @ApiProperty({ description: 'Instructor name' })
  nombreInstructor: string;

  @ApiProperty({ description: 'Instructor external (INTERNO, EXTERNO)' })
  tipoInstructor: string;

  @ApiProperty({ description: 'Training agent (company providing training)' })
  agenteCapacitador: string;

  @ApiProperty({ description: 'Training agent RFC' })
  rfcAgenteCapacitador: string;

  @ApiProperty({ description: 'Training type code per STPS catalog' })
  tipoCapacitacion: string;

  @ApiProperty({ description: 'Training result (APROBADO, NO_APROBADO)' })
  resultado: string;

  @ApiProperty({ description: 'DC-3 folio number' })
  folioDC3: string;
}

export class SIRCEExportResultDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  period: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  fileRef: string;

  @ApiProperty()
  format: string;

  @ApiProperty()
  recordCount: number;

  @ApiProperty({ description: 'Base64 encoded file content for XML/CSV' })
  @IsOptional()
  content?: string;

  @ApiProperty({ description: 'JSON records if format is JSON' })
  @IsOptional()
  records?: SIRCETraineeRecordDto[];

  @ApiProperty()
  createdAt: Date;
}

export class SIRCEExportQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class SIRCEValidationResultDto {
  @ApiProperty()
  isValid: boolean;

  @ApiProperty()
  totalRecords: number;

  @ApiProperty()
  validRecords: number;

  @ApiProperty()
  invalidRecords: number;

  @ApiProperty({ type: [String] })
  errors: string[];

  @ApiProperty({ type: [String] })
  warnings: string[];
}
