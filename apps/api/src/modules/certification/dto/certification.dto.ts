import { IsString, IsOptional, IsEnum, IsBoolean } from "class-validator";

/**
 * Certification status
 */
export enum CertificationStatus {
  PENDING = "PENDING",
  ISSUED = "ISSUED",
  REVOKED = "REVOKED",
}

/**
 * Export format options
 */
export enum ExportFormat {
  PDF = "PDF",
  XML = "XML",
  JSON = "JSON",
}

/**
 * DC-3 format variations
 */
export enum DC3Format {
  STPS_STANDARD = "stps_standard",
  CONOCER_EXTENDED = "conocer_extended",
}

/**
 * Create DC-3 DTO
 */
export class CreateCertificationDto {
  @IsString()
  tenantId: string;

  @IsString()
  traineeId: string;

  @IsString()
  courseId: string;
}

/**
 * Export DC-3 DTO
 */
export class ExportDC3Dto {
  @IsString()
  certificationId: string;

  @IsEnum(ExportFormat)
  format: ExportFormat;

  @IsOptional()
  @IsEnum(DC3Format)
  dc3Format?: DC3Format = DC3Format.STPS_STANDARD;

  @IsOptional()
  @IsBoolean()
  includeQRCode?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeSignature?: boolean = true;
}

/**
 * DC-3 Export Result
 */
export class DC3ExportResultDto {
  certificationId: string;
  format: ExportFormat;
  content?: string; // Base64 for PDF
  xmlContent?: string;
  jsonData?: Record<string, unknown>;
  filename: string;
  mimeType: string;
  generatedAt: Date;
}
