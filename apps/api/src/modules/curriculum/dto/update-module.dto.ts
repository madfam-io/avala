import { PartialType, OmitType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';
import { CreateModuleDto, CreateLessonDto } from './create-module.dto';

export class UpdateModuleDto extends PartialType(
  OmitType(CreateModuleDto, ['courseId'] as const),
) {
  @ApiPropertyOptional({
    description: 'Whether the module is published',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateLessonDto extends PartialType(
  OmitType(CreateLessonDto, ['moduleId'] as const),
) {
  @ApiPropertyOptional({
    description: 'Whether the lesson is published',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
