import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { DocumentStatus } from "@avala/db";

export class DocumentQueryDto {
  @ApiPropertyOptional({ description: "Filter by element (E0875, E0876, E0877)" })
  @IsOptional()
  @IsString()
  element?: string;

  @ApiPropertyOptional({ description: "Filter by status", enum: DocumentStatus })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @ApiPropertyOptional({ description: "Page number", default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: "Items per page", default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class TemplateQueryDto {
  @ApiPropertyOptional({ description: "Filter by element (E0875, E0876, E0877)" })
  @IsOptional()
  @IsString()
  element?: string;

  @ApiPropertyOptional({ description: "Page number", default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: "Items per page", default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
