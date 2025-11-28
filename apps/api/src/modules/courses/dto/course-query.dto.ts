import {
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsString,
  IsBoolean,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type, Transform } from "class-transformer";
import { CourseStatus, CourseLevel, CourseFormat } from "./create-course.dto";

export class CourseQueryDto {
  @ApiPropertyOptional({ description: "Search by title or description" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: "Filter by status", enum: CourseStatus })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @ApiPropertyOptional({ description: "Filter by level", enum: CourseLevel })
  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;

  @ApiPropertyOptional({ description: "Filter by format", enum: CourseFormat })
  @IsOptional()
  @IsEnum(CourseFormat)
  format?: CourseFormat;

  @ApiPropertyOptional({ description: "Filter by category ID" })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: "Filter by competency ID" })
  @IsOptional()
  @IsString()
  competencyId?: string;

  @ApiPropertyOptional({ description: "Filter by tag" })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ description: "Filter by DC-3 eligibility" })
  @IsOptional()
  @Transform(({ value }) => value === "true")
  @IsBoolean()
  dc3Eligible?: boolean;

  @ApiPropertyOptional({ description: "Filter by featured status" })
  @IsOptional()
  @Transform(({ value }) => value === "true")
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    description: "Include module details",
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === "true")
  @IsBoolean()
  includeModules?: boolean;

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

  @ApiPropertyOptional({ description: "Sort field", default: "createdAt" })
  @IsOptional()
  @IsString()
  sortBy?: string = "createdAt";

  @ApiPropertyOptional({
    description: "Sort order",
    enum: ["asc", "desc"],
    default: "desc",
  })
  @IsOptional()
  @IsEnum(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "desc";
}
