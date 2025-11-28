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
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ModuleType {
  VIDEO = 'VIDEO',
  READING = 'READING',
  INTERACTIVE = 'INTERACTIVE',
  ASSESSMENT = 'ASSESSMENT',
  MIXED = 'MIXED',
}

export class CreateModuleDto {
  @ApiProperty({
    description: 'Course ID this module belongs to',
  })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({
    description: 'Module title in Spanish',
    example: 'Introducción a la Seguridad Industrial',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Module title in English',
  })
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiPropertyOptional({
    description: 'Module description in Spanish',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Module description in English',
  })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiProperty({
    description: 'Module type',
    enum: ModuleType,
    default: ModuleType.MIXED,
  })
  @IsEnum(ModuleType)
  type: ModuleType;

  @ApiPropertyOptional({
    description: 'Display order within course',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;

  @ApiPropertyOptional({
    description: 'Estimated duration in minutes',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedDuration?: number;

  @ApiPropertyOptional({
    description: 'Whether this module is required for course completion',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Module thumbnail URL',
  })
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;
}

export class CreateLessonDto {
  @ApiProperty({
    description: 'Module ID this lesson belongs to',
  })
  @IsString()
  @IsNotEmpty()
  moduleId: string;

  @ApiProperty({
    description: 'Lesson title in Spanish',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Lesson title in English',
  })
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiPropertyOptional({
    description: 'Lesson content in Spanish (markdown supported)',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: 'Lesson content in English',
  })
  @IsOptional()
  @IsString()
  contentEn?: string;

  @ApiPropertyOptional({
    description: 'Video URL for video lessons',
  })
  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @ApiPropertyOptional({
    description: 'Video duration in seconds',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  videoDuration?: number;

  @ApiPropertyOptional({
    description: 'Display order within module',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;

  @ApiPropertyOptional({
    description: 'Estimated duration in minutes',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedDuration?: number;

  @ApiPropertyOptional({
    description: 'Whether this lesson is required',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Downloadable resources',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  resources?: string[];
}
