import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCourseDto } from './create-course.dto';

export class UpdateCourseDto extends PartialType(CreateCourseDto) {
  @ApiPropertyOptional({
    description: 'Publication date',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  publishedAt?: Date;

  @ApiPropertyOptional({
    description: 'Archive date',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  archivedAt?: Date;
}
