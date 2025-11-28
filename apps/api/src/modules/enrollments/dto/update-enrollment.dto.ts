import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDate, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  PAUSED = 'PAUSED',
}

export class UpdateEnrollmentDto {
  @ApiPropertyOptional({
    description: 'Enrollment status',
    enum: EnrollmentStatus,
  })
  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;

  @ApiPropertyOptional({
    description: 'Due date for course completion',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @ApiPropertyOptional({
    description: 'Notes about the enrollment',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
