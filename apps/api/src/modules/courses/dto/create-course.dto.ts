import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsArray,
  IsBoolean,
  IsUrl,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export enum CourseStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

export enum CourseLevel {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
}

export enum CourseFormat {
  SELF_PACED = "SELF_PACED",
  INSTRUCTOR_LED = "INSTRUCTOR_LED",
  BLENDED = "BLENDED",
}

export class CreateCourseDto {
  @ApiProperty({
    description: "Course title in Spanish",
    example: "Seguridad Industrial Nivel 1",
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: "Course title in English",
    example: "Industrial Safety Level 1",
  })
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiProperty({
    description: "Course description in Spanish",
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    description: "Course description in English",
  })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({
    description: "Short summary for cards/previews",
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({
    description: "Course thumbnail URL",
  })
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @ApiPropertyOptional({
    description: "Course preview video URL",
  })
  @IsOptional()
  @IsUrl()
  previewVideoUrl?: string;

  @ApiProperty({
    description: "Course difficulty level",
    enum: CourseLevel,
    default: CourseLevel.BEGINNER,
  })
  @IsEnum(CourseLevel)
  level: CourseLevel;

  @ApiPropertyOptional({
    description: "Course delivery format",
    enum: CourseFormat,
    default: CourseFormat.SELF_PACED,
  })
  @IsOptional()
  @IsEnum(CourseFormat)
  format?: CourseFormat;

  @ApiPropertyOptional({
    description: "Estimated duration in minutes",
    example: 120,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedDuration?: number;

  @ApiPropertyOptional({
    description: "Passing score percentage for course completion",
    default: 70,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  passingScore?: number;

  @ApiPropertyOptional({
    description: "Category ID for the course",
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: "Competency IDs this course develops",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  competencyIds?: string[];

  @ApiPropertyOptional({
    description: "Prerequisite course IDs",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisiteIds?: string[];

  @ApiPropertyOptional({
    description: "Tags for search and categorization",
    example: ["safety", "compliance", "nom-001"],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: "Related STPS norms",
    example: ["NOM-001-STPS-2008"],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stpsNorms?: string[];

  @ApiPropertyOptional({
    description: "Whether this course generates a DC-3 certificate",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  dc3Eligible?: boolean;

  @ApiPropertyOptional({
    description: "DC-3 training hours for certificate",
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  dc3Hours?: number;

  @ApiPropertyOptional({
    description: "Whether this course is featured",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    description: "Course status",
    enum: CourseStatus,
    default: CourseStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;
}
