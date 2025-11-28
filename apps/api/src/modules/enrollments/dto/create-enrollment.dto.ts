import { IsString, IsNotEmpty, IsOptional, IsDate, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum EnrollmentType {
  SELF_ENROLLED = 'SELF_ENROLLED',
  ASSIGNED = 'ASSIGNED',
  PREREQUISITE = 'PREREQUISITE',
}

export class CreateEnrollmentDto {
  @ApiProperty({
    description: 'User ID to enroll',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Course ID to enroll in',
  })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiPropertyOptional({
    description: 'Enrollment type',
    enum: EnrollmentType,
    default: EnrollmentType.SELF_ENROLLED,
  })
  @IsOptional()
  @IsEnum(EnrollmentType)
  type?: EnrollmentType;

  @ApiPropertyOptional({
    description: 'Due date for course completion',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @ApiPropertyOptional({
    description: 'ID of the user who assigned this enrollment (for ASSIGNED type)',
  })
  @IsOptional()
  @IsString()
  assignedById?: string;

  @ApiPropertyOptional({
    description: 'Notes about the enrollment',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkEnrollmentDto {
  @ApiProperty({
    description: 'User IDs to enroll',
    type: [String],
  })
  @IsString({ each: true })
  userIds: string[];

  @ApiProperty({
    description: 'Course ID to enroll users in',
  })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiPropertyOptional({
    description: 'Due date for all enrollments',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @ApiPropertyOptional({
    description: 'Notes for all enrollments',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
