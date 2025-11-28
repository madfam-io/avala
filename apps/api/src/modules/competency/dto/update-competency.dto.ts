import { PartialType, OmitType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';
import { CreateCompetencyDto } from './create-competency.dto';

export class UpdateCompetencyDto extends PartialType(
  OmitType(CreateCompetencyDto, ['code'] as const),
) {
  @ApiPropertyOptional({
    description: 'Whether the competency is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
