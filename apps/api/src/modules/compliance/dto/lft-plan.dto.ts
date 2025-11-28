import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * LFT Plan DTOs
 * Ley Federal del Trabajo - Annual Training Plan requirements
 */

export enum TrainingProgramType {
  INDUCTION = 'INDUCTION',
  TECHNICAL = 'TECHNICAL',
  SAFETY = 'SAFETY',
  QUALITY = 'QUALITY',
  LEADERSHIP = 'LEADERSHIP',
  COMPETENCY = 'COMPETENCY',
  OTHER = 'OTHER',
}

export enum TrainingModality {
  PRESENCIAL = 'PRESENCIAL',
  EN_LINEA = 'EN_LINEA',
  MIXTA = 'MIXTA',
}

export class TrainingProgramDto {
  @ApiProperty({ description: 'Program name' })
  @IsString()
  nombre: string;

  @ApiProperty({ description: 'Program objective' })
  @IsString()
  objetivo: string;

  @ApiProperty({ enum: TrainingProgramType })
  @IsEnum(TrainingProgramType)
  tipo: TrainingProgramType;

  @ApiProperty({ enum: TrainingModality })
  @IsEnum(TrainingModality)
  modalidad: TrainingModality;

  @ApiProperty({ description: 'Duration in hours' })
  @IsNumber()
  @Min(1)
  duracionHoras: number;

  @ApiProperty({ description: 'Target departments/areas' })
  @IsArray()
  @IsString({ each: true })
  areasObjetivo: string[];

  @ApiProperty({ description: 'Target positions' })
  @IsArray()
  @IsString({ each: true })
  puestosObjetivo: string[];

  @ApiProperty({ description: 'Estimated participants' })
  @IsNumber()
  @Min(1)
  participantesEstimados: number;

  @ApiProperty({ description: 'Planned start month (1-12)' })
  @IsNumber()
  @Min(1)
  @Max(12)
  mesInicio: number;

  @ApiProperty({ description: 'Planned end month (1-12)' })
  @IsNumber()
  @Min(1)
  @Max(12)
  mesFin: number;

  @ApiPropertyOptional({ description: 'EC Standard code if applicable' })
  @IsOptional()
  @IsString()
  codigoEC?: string;

  @ApiPropertyOptional({ description: 'Training provider' })
  @IsOptional()
  @IsString()
  proveedor?: string;

  @ApiPropertyOptional({ description: 'Estimated cost' })
  @IsOptional()
  @IsNumber()
  costoEstimado?: number;
}

export class CreateLFTPlanDto {
  @ApiProperty({ description: 'Tenant ID' })
  @IsUUID()
  tenantId: string;

  @ApiProperty({ description: 'Plan year', example: 2025 })
  @IsNumber()
  @Min(2020)
  @Max(2100)
  year: number;

  @ApiProperty({ description: 'Business unit name' })
  @IsString()
  businessUnit: string;

  @ApiProperty({ description: 'Training programs for the year', type: [TrainingProgramDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrainingProgramDto)
  programs: TrainingProgramDto[];
}

export class UpdateLFTPlanDto {
  @ApiPropertyOptional({ description: 'Business unit name' })
  @IsOptional()
  @IsString()
  businessUnit?: string;

  @ApiPropertyOptional({ description: 'Training programs', type: [TrainingProgramDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrainingProgramDto)
  programs?: TrainingProgramDto[];
}

export class LFTPlanResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  year: number;

  @ApiProperty()
  businessUnit: string;

  @ApiProperty({ type: [TrainingProgramDto] })
  programs: TrainingProgramDto[];

  @ApiProperty({ description: 'Whether the plan is locked for editing' })
  isLocked: boolean;

  @ApiPropertyOptional()
  lockedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  totalPrograms: number;

  @ApiProperty()
  totalHours: number;

  @ApiProperty()
  totalParticipants: number;
}

export class LFTPlanQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessUnit?: string;

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

export class LFTPlanSummaryDto {
  @ApiProperty()
  year: number;

  @ApiProperty()
  totalPlans: number;

  @ApiProperty()
  totalPrograms: number;

  @ApiProperty()
  totalHours: number;

  @ApiProperty()
  totalParticipants: number;

  @ApiProperty()
  lockedPlans: number;

  @ApiProperty({ description: 'Programs by type breakdown' })
  byType: Record<string, number>;

  @ApiProperty({ description: 'Programs by modality breakdown' })
  byModality: Record<string, number>;
}

export class LockLFTPlanDto {
  @ApiProperty({ description: 'Lock the plan to prevent edits' })
  @IsBoolean()
  lock: boolean;
}
