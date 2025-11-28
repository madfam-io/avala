import { IsOptional, IsBoolean, IsString, IsArray, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { RenecItemType } from './catalog-query.dto';

export class SyncRenecDto {
  @ApiPropertyOptional({
    description: 'Force full sync even if data exists',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  forceSync?: boolean;

  @ApiPropertyOptional({
    description: 'Item types to sync',
    enum: RenecItemType,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(RenecItemType, { each: true })
  types?: RenecItemType[];

  @ApiPropertyOptional({
    description: 'Specific sector codes to sync',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sectorCodes?: string[];
}

export class RenecSyncResultDto {
  success: boolean;
  syncedAt: Date;
  occupationsProcessed: number;
  competenciesProcessed: number;
  normsProcessed: number;
  errors: string[];
}
