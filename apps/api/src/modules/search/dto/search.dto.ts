import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  IsBoolean,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";

/**
 * Searchable entity types in AVALA
 */
export enum SearchEntityType {
  // Core entities
  USER = "user",
  COURSE = "course",
  LESSON = "lesson",

  // EC entities
  EC_STANDARD = "ec_standard",
  EC_ENROLLMENT = "ec_enrollment",

  // RENEC entities
  RENEC_CENTRO = "renec_centro",
  RENEC_CERTIFICADOR = "renec_certificador",
  RENEC_EC = "renec_ec",

  // Certification entities
  CERTIFICATION = "certification",

  // Simulation entities
  SIMULATION_SCENARIO = "simulation_scenario",

  // Document entities
  DOCUMENT = "document",
}

/**
 * Sort order options
 */
export enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

/**
 * Search result relevance factors
 */
export enum RelevanceFactor {
  EXACT_MATCH = "exact_match",
  TITLE_MATCH = "title_match",
  DESCRIPTION_MATCH = "description_match",
  TAG_MATCH = "tag_match",
  CONTENT_MATCH = "content_match",
  RECENT = "recent",
  POPULAR = "popular",
}

/**
 * Global search query DTO
 */
export class GlobalSearchDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsArray()
  @IsEnum(SearchEntityType, { each: true })
  entityTypes?: SearchEntityType[];

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  skip?: number = 0;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeArchived?: boolean = false;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  highlightMatches?: boolean = true;
}

/**
 * Advanced search with filters
 */
export class AdvancedSearchDto extends GlobalSearchDto {
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  ecStandardCode?: string;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  minScore?: number;
}

/**
 * Single search result item
 */
export class SearchResultItemDto {
  id: string;
  entityType: SearchEntityType;
  title: string;
  description?: string;
  highlights?: Record<string, string[]>;
  score: number;
  metadata?: Record<string, unknown>;
  url?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Search results grouped by entity type
 */
export class GroupedSearchResultDto {
  entityType: SearchEntityType;
  count: number;
  items: SearchResultItemDto[];
}

/**
 * Global search response
 */
export class SearchResponseDto {
  query: string;
  totalResults: number;
  took: number; // milliseconds
  results: SearchResultItemDto[];
  groupedResults?: GroupedSearchResultDto[];
  facets?: SearchFacetsDto;
  suggestions?: string[];
}

/**
 * Search facets for filtering
 */
export class SearchFacetsDto {
  entityTypes: { type: SearchEntityType; count: number }[];
  dateRanges?: { label: string; count: number }[];
  tags?: { tag: string; count: number }[];
  statuses?: { status: string; count: number }[];
  ecStandards?: { code: string; name: string; count: number }[];
}

/**
 * Autocomplete suggestion request
 */
export class AutocompleteDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsArray()
  @IsEnum(SearchEntityType, { each: true })
  entityTypes?: SearchEntityType[];

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(20)
  limit?: number = 10;
}

/**
 * Autocomplete suggestion response
 */
export class AutocompleteSuggestionDto {
  text: string;
  entityType: SearchEntityType;
  entityId: string;
  score: number;
}

/**
 * Recent searches for a user
 */
export class RecentSearchDto {
  query: string;
  entityTypes?: SearchEntityType[];
  timestamp: Date;
  resultCount: number;
}

/**
 * Search analytics
 */
export class SearchAnalyticsDto {
  totalSearches: number;
  uniqueQueries: number;
  averageResultCount: number;
  topQueries: { query: string; count: number }[];
  noResultQueries: { query: string; count: number }[];
  entityTypeDistribution: { type: SearchEntityType; percentage: number }[];
}
