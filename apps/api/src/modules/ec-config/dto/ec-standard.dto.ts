import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

// ============================================
// EC STANDARD DTOs
// ============================================

export class CreateECStandardDto {
  @ApiProperty({ example: 'EC0249', description: 'Unique EC code' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ example: '01', description: 'Version number' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiProperty({ example: 'Diseño de cursos de formación del capital humano de manera presencial grupal' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Design of in-person group training courses' })
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiProperty({ description: 'Detailed description of the competency standard' })
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({ example: 'CONOCER' })
  @IsOptional()
  @IsString()
  issuer?: string;

  @ApiPropertyOptional({ example: 'Capacitación' })
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiPropertyOptional({ example: 3, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  level?: number;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedHours?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  dc3Eligible?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;
}

export class UpdateECStandardDto extends PartialType(CreateECStandardDto) {
  @ApiPropertyOptional({ enum: ['DRAFT', 'PUBLISHED', 'DEPRECATED'] })
  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'DEPRECATED'])
  status?: 'DRAFT' | 'PUBLISHED' | 'DEPRECATED';
}

export class ECStandardQueryDto {
  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'DEPRECATED'])
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by sector' })
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiPropertyOptional({ description: 'Filter by competency level' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  level?: number;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ============================================
// EC ELEMENT DTOs
// ============================================

export class CreateECElementDto {
  @ApiProperty({ example: 'E0875', description: 'Element code' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Diseñar cursos de capacitación presenciales' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiProperty({ description: 'Detailed element description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  requiredDocuments?: number;

  @ApiPropertyOptional({ default: 70 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  requiredScore?: number;

  @ApiPropertyOptional({ type: [String], description: 'Performance criteria' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  performanceCriteria?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Knowledge criteria' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  knowledgeCriteria?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Product criteria' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productCriteria?: string[];
}

export class UpdateECElementDto extends PartialType(CreateECElementDto) {}

// ============================================
// EC MODULE DTOs
// ============================================

export class CreateECModuleDto {
  @ApiProperty({ example: 'module1', description: 'Module code' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Fundamentos del Diseño Instruccional' })
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

  @ApiPropertyOptional({ example: '📚' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;

  @ApiPropertyOptional({ default: 60 })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedMinutes?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ type: [String], description: 'Element IDs this module covers' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  elementIds?: string[];
}

export class UpdateECModuleDto extends PartialType(CreateECModuleDto) {}

// ============================================
// EC LESSON DTOs
// ============================================

export class LessonSectionDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ enum: ['text', 'video', 'interactive', 'quiz'] })
  @IsOptional()
  @IsString()
  type?: string;
}

export class CreateECLessonDto {
  @ApiProperty({ example: 'lesson1' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Introducción al Diseño Instruccional' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;

  @ApiPropertyOptional({ type: [LessonSectionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LessonSectionDto)
  sections?: LessonSectionDto[];

  @ApiPropertyOptional({ description: 'YouTube video ID' })
  @IsOptional()
  @IsString()
  videoId?: string;

  @ApiPropertyOptional({ description: 'Video duration in seconds' })
  @IsOptional()
  @IsInt()
  @Min(0)
  videoDuration?: number;

  @ApiPropertyOptional({ default: 15 })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedMinutes?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

export class UpdateECLessonDto extends PartialType(CreateECLessonDto) {}

// ============================================
// RESPONSE DTOs
// ============================================

export class ECStandardResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  version: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  titleEn?: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  issuer: string;

  @ApiPropertyOptional()
  sector?: string;

  @ApiProperty()
  level: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  estimatedHours: number;

  @ApiProperty()
  dc3Eligible: boolean;

  @ApiPropertyOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional()
  publishedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Nested counts
  @ApiPropertyOptional()
  _count?: {
    elements: number;
    modules: number;
    templates: number;
    assessments: number;
    simulations: number;
    enrollments: number;
  };
}

export class ECElementResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ecId: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  titleEn?: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  orderIndex: number;

  @ApiProperty()
  requiredDocuments: number;

  @ApiProperty()
  requiredScore: number;

  @ApiProperty({ type: [String] })
  performanceCriteria: string[];

  @ApiProperty({ type: [String] })
  knowledgeCriteria: string[];

  @ApiProperty({ type: [String] })
  productCriteria: string[];
}

export class ECModuleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ecId: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  titleEn?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  icon?: string;

  @ApiProperty()
  orderIndex: number;

  @ApiProperty()
  estimatedMinutes: number;

  @ApiProperty()
  isRequired: boolean;

  @ApiPropertyOptional()
  _count?: {
    lessons: number;
    assessments: number;
  };
}

export class ECLessonResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  moduleId: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  titleEn?: string;

  @ApiProperty()
  orderIndex: number;

  @ApiProperty()
  sections: LessonSectionDto[];

  @ApiPropertyOptional()
  videoId?: string;

  @ApiPropertyOptional()
  videoDuration?: number;

  @ApiProperty()
  estimatedMinutes: number;

  @ApiProperty()
  isRequired: boolean;
}

export class PaginatedResponseDto<T> {
  @ApiProperty()
  data: T[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
