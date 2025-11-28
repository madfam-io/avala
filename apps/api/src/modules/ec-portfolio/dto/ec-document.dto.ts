import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsEnum,
  IsArray,
  IsObject,
  ValidateNested,
  Min,
  IsUUID,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";

// ============================================
// TEMPLATE DTOs
// ============================================

export class TemplateSectionDto {
  @ApiProperty({ description: "Section ID" })
  @IsString()
  id: string;

  @ApiProperty({ description: "Section title" })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiPropertyOptional({ description: "Section description/instructions" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: ["text", "textarea", "list", "table", "structured"],
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: "Whether section is required" })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ description: "Placeholder text" })
  @IsOptional()
  @IsString()
  placeholder?: string;

  @ApiPropertyOptional({ description: "Validation rules" })
  @IsOptional()
  @IsObject()
  validation?: Record<string, any>;

  @ApiPropertyOptional({
    type: [TemplateSectionDto],
    description: "Nested subsections",
  })
  @IsOptional()
  @IsArray()
  subsections?: TemplateSectionDto[];
}

export class CreateECTemplateDto {
  @ApiProperty({ example: "problem_description", description: "Template code" })
  @IsString()
  code: string;

  @ApiProperty({ example: "Descripción de la Problemática" })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: "Element ID this template belongs to" })
  @IsUUID()
  elementId: string;

  @ApiPropertyOptional({
    enum: ["REQUIRED", "OPTIONAL", "SUPPLEMENTARY"],
    default: "REQUIRED",
  })
  @IsOptional()
  @IsEnum(["REQUIRED", "OPTIONAL", "SUPPLEMENTARY"])
  category?: "REQUIRED" | "OPTIONAL" | "SUPPLEMENTARY";

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;

  @ApiPropertyOptional({ description: "Support video YouTube ID" })
  @IsOptional()
  @IsString()
  supportVideoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supportVideoTitle?: string;

  @ApiPropertyOptional({ type: [TemplateSectionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateSectionDto)
  sections?: TemplateSectionDto[];

  @ApiPropertyOptional({ type: [String], description: "Evaluation criteria" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evaluationCriteria?: string[];
}

export class UpdateECTemplateDto extends PartialType(CreateECTemplateDto) {}

export class ECTemplateQueryDto {
  @ApiPropertyOptional({ description: "Filter by element ID" })
  @IsOptional()
  @IsUUID()
  elementId?: string;

  @ApiPropertyOptional({ description: "Filter by category" })
  @IsOptional()
  @IsEnum(["REQUIRED", "OPTIONAL", "SUPPLEMENTARY"])
  category?: string;

  @ApiPropertyOptional({ description: "Search term" })
  @IsOptional()
  @IsString()
  search?: string;
}

// ============================================
// DOCUMENT DTOs
// ============================================

export class SectionContentDto {
  @ApiProperty({ description: "Section ID" })
  @IsString()
  sectionId: string;

  @ApiPropertyOptional({ description: "Section value/content" })
  @IsOptional()
  value?: string | string[] | Record<string, any>;

  @ApiPropertyOptional({
    type: [SectionContentDto],
    description: "Subsection content",
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionContentDto)
  subsections?: SectionContentDto[];
}

export class CreateECDocumentDto {
  @ApiProperty({ description: "Template ID" })
  @IsUUID()
  templateId: string;

  @ApiPropertyOptional({ description: "Custom document title" })
  @IsOptional()
  @IsString()
  title?: string;
}

export class UpdateECDocumentDto {
  @ApiPropertyOptional({ description: "Custom document title" })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: "Document content by section" })
  @IsOptional()
  @IsObject()
  content?: Record<string, SectionContentDto>;
}

export class SaveDocumentContentDto {
  @ApiProperty({ description: "Document content by section" })
  @IsObject()
  content: Record<string, SectionContentDto>;
}

export class ECDocumentQueryDto {
  @ApiPropertyOptional({ description: "Filter by status" })
  @IsOptional()
  @IsEnum([
    "DRAFT",
    "IN_PROGRESS",
    "COMPLETED",
    "SUBMITTED",
    "APPROVED",
    "REJECTED",
  ])
  status?: string;

  @ApiPropertyOptional({ description: "Filter by template ID" })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({ description: "Only incomplete documents" })
  @IsOptional()
  @IsBoolean()
  incomplete?: boolean;
}

// ============================================
// VALIDATION DTOs
// ============================================

export class ValidationErrorDto {
  @ApiProperty()
  sectionId: string;

  @ApiProperty()
  field: string;

  @ApiProperty()
  message: string;

  @ApiProperty({ enum: ["error", "warning"] })
  severity: "error" | "warning";
}

export class ValidationResultDto {
  @ApiProperty()
  isValid: boolean;

  @ApiProperty()
  score: number;

  @ApiProperty({ type: [ValidationErrorDto] })
  errors: ValidationErrorDto[];

  @ApiProperty({ type: [ValidationErrorDto] })
  warnings: ValidationErrorDto[];

  @ApiProperty()
  completedSections: number;

  @ApiProperty()
  totalSections: number;
}

// ============================================
// RESPONSE DTOs
// ============================================

export class ECTemplateResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ecId: string;

  @ApiProperty()
  elementId: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  titleEn?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  orderIndex: number;

  @ApiPropertyOptional()
  supportVideoId?: string;

  @ApiPropertyOptional()
  supportVideoTitle?: string;

  @ApiProperty({ type: [TemplateSectionDto] })
  sections: TemplateSectionDto[];

  @ApiProperty({ type: [String] })
  evaluationCriteria: string[];

  @ApiPropertyOptional()
  element?: {
    code: string;
    title: string;
  };
}

export class ECDocumentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  enrollmentId: string;

  @ApiProperty()
  templateId: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  title?: string;

  @ApiProperty()
  content: Record<string, any>;

  @ApiPropertyOptional()
  validationScore?: number;

  @ApiProperty()
  validationErrors: ValidationErrorDto[];

  @ApiProperty()
  isComplete: boolean;

  @ApiProperty()
  version: number;

  @ApiPropertyOptional()
  pdfPath?: string;

  @ApiPropertyOptional()
  exportedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  submittedAt?: Date;

  @ApiPropertyOptional()
  template?: ECTemplateResponseDto;
}

export class PortfolioSummaryDto {
  @ApiProperty()
  enrollmentId: string;

  @ApiProperty()
  ecCode: string;

  @ApiProperty()
  totalDocuments: number;

  @ApiProperty()
  completedDocuments: number;

  @ApiProperty()
  submittedDocuments: number;

  @ApiProperty()
  approvedDocuments: number;

  @ApiProperty()
  overallProgress: number;

  @ApiProperty()
  byElement: {
    elementId: string;
    elementCode: string;
    elementTitle: string;
    totalTemplates: number;
    completedDocuments: number;
    progress: number;
  }[];

  @ApiProperty()
  certificationReady: boolean;
}
