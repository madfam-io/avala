import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
  Max,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

/**
 * DC-3 Status enum
 */
export enum DC3StatusDto {
  ISSUED = "ISSUED",
  REVOKED = "REVOKED",
}

/**
 * Trainee information for DC-3
 */
export class DC3TraineeDto {
  @ApiProperty({ description: "Full name of the trainee" })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ description: "CURP (Mexican ID)" })
  @IsOptional()
  @IsString()
  curp?: string;

  @ApiPropertyOptional({ description: "RFC (Tax ID)" })
  @IsOptional()
  @IsString()
  rfc?: string;

  @ApiPropertyOptional({ description: "Job position" })
  @IsOptional()
  @IsString()
  jobPosition?: string;

  @ApiPropertyOptional({ description: "Department/Area" })
  @IsOptional()
  @IsString()
  department?: string;
}

/**
 * Course/Training information for DC-3
 */
export class DC3CourseDto {
  @ApiProperty({ description: "Course/Training name" })
  @IsString()
  name: string;

  @ApiProperty({ description: "Course code" })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: "EC Standard code (e.g., EC0249)" })
  @IsOptional()
  @IsString()
  ecCode?: string;

  @ApiProperty({ description: "Duration in hours" })
  @IsNumber()
  @Min(1)
  durationHours: number;

  @ApiPropertyOptional({ description: "Training modality" })
  @IsOptional()
  @IsString()
  modality?: string;

  @ApiPropertyOptional({ description: "Training start date" })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: "Training end date" })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

/**
 * Instructor/ACE information for DC-3
 */
export class DC3InstructorDto {
  @ApiProperty({ description: "Instructor full name" })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ description: "Instructor credentials/certifications" })
  @IsOptional()
  @IsString()
  credentials?: string;

  @ApiPropertyOptional({ description: "ACE registration number" })
  @IsOptional()
  @IsString()
  aceNumber?: string;
}

/**
 * Employer information for DC-3
 */
export class DC3EmployerDto {
  @ApiProperty({ description: "Company/Employer name" })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: "RFC of the company" })
  @IsOptional()
  @IsString()
  rfc?: string;

  @ApiPropertyOptional({ description: "IMSS employer registration" })
  @IsOptional()
  @IsString()
  imssRegistration?: string;

  @ApiPropertyOptional({ description: "Company address" })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: "Legal representative name" })
  @IsOptional()
  @IsString()
  legalRepresentative?: string;
}

/**
 * Create DC-3 DTO
 */
export class CreateDC3Dto {
  @ApiProperty({ description: "Tenant ID" })
  @IsUUID()
  tenantId: string;

  @ApiProperty({ description: "Trainee ID" })
  @IsUUID()
  traineeId: string;

  @ApiProperty({ description: "Course ID" })
  @IsUUID()
  courseId: string;

  @ApiPropertyOptional({
    description: "EC Enrollment ID (for EC-aligned training)",
  })
  @IsOptional()
  @IsUUID()
  enrollmentId?: string;

  @ApiPropertyOptional({ description: "Trainee information override" })
  @IsOptional()
  @ValidateNested()
  @Type(() => DC3TraineeDto)
  traineeInfo?: DC3TraineeDto;

  @ApiPropertyOptional({ description: "Course information override" })
  @IsOptional()
  @ValidateNested()
  @Type(() => DC3CourseDto)
  courseInfo?: DC3CourseDto;

  @ApiPropertyOptional({ description: "Instructor information" })
  @IsOptional()
  @ValidateNested()
  @Type(() => DC3InstructorDto)
  instructorInfo?: DC3InstructorDto;

  @ApiPropertyOptional({ description: "Employer information override" })
  @IsOptional()
  @ValidateNested()
  @Type(() => DC3EmployerDto)
  employerInfo?: DC3EmployerDto;

  @ApiPropertyOptional({ description: "Final score/grade achieved" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  finalScore?: number;

  @ApiPropertyOptional({ description: "Custom issue date (defaults to now)" })
  @IsOptional()
  @IsDateString()
  issueDate?: string;
}

/**
 * Query DC-3 records DTO
 */
export class DC3QueryDto {
  @ApiProperty({ description: "Tenant ID" })
  @IsUUID()
  tenantId: string;

  @ApiPropertyOptional({ description: "Filter by trainee ID" })
  @IsOptional()
  @IsUUID()
  traineeId?: string;

  @ApiPropertyOptional({ description: "Filter by course ID" })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional({ description: "Filter by status" })
  @IsOptional()
  @IsEnum(DC3StatusDto)
  status?: DC3StatusDto;

  @ApiPropertyOptional({ description: "Filter by serial number" })
  @IsOptional()
  @IsString()
  serial?: string;

  @ApiPropertyOptional({ description: "Filter by issue date from" })
  @IsOptional()
  @IsDateString()
  issuedFrom?: string;

  @ApiPropertyOptional({ description: "Filter by issue date to" })
  @IsOptional()
  @IsDateString()
  issuedTo?: string;

  @ApiPropertyOptional({ description: "Page number", default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: "Items per page", default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}

/**
 * Revoke DC-3 DTO
 */
export class RevokeDC3Dto {
  @ApiProperty({ description: "Reason for revocation" })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: "Additional notes" })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Bulk create DC-3 DTO
 */
export class BulkCreateDC3Dto {
  @ApiProperty({ description: "Tenant ID" })
  @IsUUID()
  tenantId: string;

  @ApiProperty({ description: "Course ID" })
  @IsUUID()
  courseId: string;

  @ApiProperty({ description: "List of trainee IDs", type: [String] })
  @IsUUID("4", { each: true })
  traineeIds: string[];

  @ApiPropertyOptional({ description: "Instructor information" })
  @IsOptional()
  @ValidateNested()
  @Type(() => DC3InstructorDto)
  instructorInfo?: DC3InstructorDto;

  @ApiPropertyOptional({ description: "Employer information override" })
  @IsOptional()
  @ValidateNested()
  @Type(() => DC3EmployerDto)
  employerInfo?: DC3EmployerDto;
}

/**
 * DC-3 Response DTO
 */
export class DC3ResponseDto {
  @ApiProperty({ description: "DC-3 ID" })
  id: string;

  @ApiProperty({ description: "Serial number (unique identifier)" })
  serial: string;

  @ApiProperty({ description: "Tenant ID" })
  tenantId: string;

  @ApiProperty({ description: "Trainee ID" })
  traineeId: string;

  @ApiProperty({ description: "Course ID" })
  courseId: string;

  @ApiProperty({ description: "Status", enum: DC3StatusDto })
  status: DC3StatusDto;

  @ApiPropertyOptional({ description: "PDF reference/URL" })
  pdfRef?: string;

  @ApiProperty({ description: "Issue date" })
  issuedAt: Date;

  @ApiPropertyOptional({ description: "Revocation date" })
  revokedAt?: Date;

  @ApiPropertyOptional({ description: "Revocation reason" })
  revocationReason?: string;

  @ApiPropertyOptional({ description: "DC-3 metadata (JSON)" })
  metadata?: Record<string, any>;
}

/**
 * Verify DC-3 Response DTO
 */
export class VerifyDC3ResponseDto {
  @ApiProperty({ description: "Whether the DC-3 is valid" })
  valid: boolean;

  @ApiProperty({ description: "DC-3 serial number" })
  serial: string;

  @ApiProperty({ description: "DC-3 status", enum: DC3StatusDto })
  status: DC3StatusDto;

  @ApiPropertyOptional({ description: "Issue date" })
  issuedAt?: Date;

  @ApiPropertyOptional({ description: "Trainee name (partial)" })
  traineeName?: string;

  @ApiPropertyOptional({ description: "Course name" })
  courseName?: string;

  @ApiPropertyOptional({ description: "Issuer/Tenant name" })
  issuerName?: string;

  @ApiPropertyOptional({ description: "Verification message" })
  message?: string;
}
