import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsArray,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export enum CompetencyLevel {
  BASIC = "BASIC",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
  EXPERT = "EXPERT",
}

export enum CompetencyType {
  TECHNICAL = "TECHNICAL",
  SOFT_SKILL = "SOFT_SKILL",
  REGULATORY = "REGULATORY",
  SAFETY = "SAFETY",
}

export class CreateCompetencyDto {
  @ApiProperty({
    description: "Unique code for the competency",
    example: "COMP-SEC-001",
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: "Competency name in Spanish",
    example: "Seguridad Industrial Básica",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: "Competency name in English",
    example: "Basic Industrial Safety",
  })
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiProperty({
    description: "Detailed description in Spanish",
    example: "Competencia en normas básicas de seguridad industrial...",
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    description: "Detailed description in English",
  })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiProperty({
    description: "Competency type",
    enum: CompetencyType,
    example: CompetencyType.SAFETY,
  })
  @IsEnum(CompetencyType)
  type: CompetencyType;

  @ApiProperty({
    description: "Competency difficulty level",
    enum: CompetencyLevel,
    example: CompetencyLevel.BASIC,
  })
  @IsEnum(CompetencyLevel)
  level: CompetencyLevel;

  @ApiPropertyOptional({
    description: "Parent competency ID for hierarchical organization",
  })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({
    description: "Display order within parent/category",
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;

  @ApiPropertyOptional({
    description: "Related STPS norm codes",
    example: ["NOM-001-STPS-2008", "NOM-002-STPS-2010"],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stpsNorms?: string[];

  @ApiPropertyOptional({
    description: "Icon name for UI display",
    example: "shield-check",
  })
  @IsOptional()
  @IsString()
  icon?: string;
}
