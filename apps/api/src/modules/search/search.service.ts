import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import {
  GlobalSearchDto,
  AdvancedSearchDto,
  AutocompleteDto,
  SearchResponseDto,
  SearchResultItemDto,
  GroupedSearchResultDto,
  SearchFacetsDto,
  AutocompleteSuggestionDto,
  SearchEntityType,
  SearchAnalyticsDto,
} from "./dto/search.dto";
import { SearchStrategyRegistry } from "./search-strategy.registry";
import { SearchOptions } from "./strategies";

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly strategyRegistry: SearchStrategyRegistry,
  ) {}

  async globalSearch(dto: GlobalSearchDto): Promise<SearchResponseDto> {
    const startTime = Date.now();
    const { query, entityTypes, tenantId, skip, limit, highlightMatches } = dto;

    const searchableTypes = entityTypes?.length
      ? entityTypes
      : this.strategyRegistry.getAllEntityTypes();

    const searchResults = await this.executeParallelSearch(
      searchableTypes,
      query,
      tenantId,
      { limit: limit || 20 },
    );

    let allResults = this.flattenAndSort(searchResults);
    const totalResults = allResults.length;

    allResults = this.paginate(allResults, skip || 0, limit || 20);

    if (highlightMatches) {
      allResults = this.addHighlights(allResults, query);
    }

    const groupedResults = this.groupResultsByType(searchResults.flat());
    const facets = await this.generateFacets(query, tenantId);
    const suggestions = await this.generateSuggestions(query);

    this.logSearch(query, entityTypes || [], totalResults, tenantId);

    return {
      query,
      totalResults,
      took: Date.now() - startTime,
      results: allResults,
      groupedResults,
      facets,
      suggestions,
    };
  }

  async advancedSearch(dto: AdvancedSearchDto): Promise<SearchResponseDto> {
    const startTime = Date.now();
    const {
      query,
      entityTypes,
      tenantId,
      skip,
      limit,
      dateFrom,
      dateTo,
      minScore,
    } = dto;

    const searchableTypes = entityTypes?.length
      ? entityTypes
      : this.strategyRegistry.getAllEntityTypes();

    const dateFilter = this.buildDateFilter(dateFrom, dateTo);

    const searchResults = await this.executeParallelSearch(
      searchableTypes,
      query,
      tenantId,
      { limit: limit || 20, dateFilter },
    );

    let allResults = this.flattenAndSort(searchResults).filter(
      (r) => r.score >= (minScore || 0),
    );

    const totalResults = allResults.length;
    allResults = this.paginate(allResults, skip || 0, limit || 20);

    const groupedResults = this.groupResultsByType(searchResults.flat());
    const facets = await this.generateFacets(query, tenantId);

    return {
      query,
      totalResults,
      took: Date.now() - startTime,
      results: allResults,
      groupedResults,
      facets,
    };
  }

  async autocomplete(
    dto: AutocompleteDto,
  ): Promise<AutocompleteSuggestionDto[]> {
    const { query, entityTypes, tenantId, limit } = dto;

    if (query.length < 2) return [];

    const searchableTypes = entityTypes?.length
      ? entityTypes
      : [
          SearchEntityType.COURSE,
          SearchEntityType.EC_STANDARD,
          SearchEntityType.USER,
          SearchEntityType.RENEC_EC,
        ];

    const searchResults = await this.executeParallelSearch(
      searchableTypes,
      query,
      tenantId,
      { limit: 5 },
    );

    const suggestions: AutocompleteSuggestionDto[] = searchResults
      .flat()
      .map((r) => ({
        text: r.title,
        entityType: r.entityType,
        entityId: r.id,
        score: r.score,
      }));

    return suggestions.sort((a, b) => b.score - a.score).slice(0, limit || 10);
  }

  async getSearchAnalytics(): Promise<SearchAnalyticsDto> {
    return {
      totalSearches: 0,
      uniqueQueries: 0,
      averageResultCount: 0,
      topQueries: [],
      noResultQueries: [],
      entityTypeDistribution: this.strategyRegistry
        .getAllEntityTypes()
        .map((type) => ({
          type,
          percentage: 100 / this.strategyRegistry.getAllEntityTypes().length,
        })),
    };
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private async executeParallelSearch(
    entityTypes: SearchEntityType[],
    query: string,
    tenantId?: string,
    options?: SearchOptions,
  ): Promise<SearchResultItemDto[][]> {
    const strategies = this.strategyRegistry.getStrategiesForTypes(entityTypes);

    const searchPromises = strategies.map((strategy) =>
      strategy.search(query, tenantId, options),
    );

    return Promise.all(searchPromises);
  }

  private flattenAndSort(
    results: SearchResultItemDto[][],
  ): SearchResultItemDto[] {
    return results.flat().sort((a, b) => b.score - a.score);
  }

  private paginate(
    results: SearchResultItemDto[],
    skip: number,
    limit: number,
  ): SearchResultItemDto[] {
    return results.slice(skip, skip + limit);
  }

  private addHighlights(
    results: SearchResultItemDto[],
    query: string,
  ): SearchResultItemDto[] {
    return results.map((result) => ({
      ...result,
      highlights: this.generateHighlights(result, query),
    }));
  }

  private generateHighlights(
    result: SearchResultItemDto,
    query: string,
  ): Record<string, string[]> {
    const highlights: Record<string, string[]> = {};
    const regex = new RegExp(`(${this.escapeRegex(query)})`, "gi");

    if (result.title) {
      const titleHighlight = result.title.replace(regex, "<mark>$1</mark>");
      if (titleHighlight !== result.title) {
        highlights.title = [titleHighlight];
      }
    }

    if (result.description) {
      const descHighlight = result.description.replace(
        regex,
        "<mark>$1</mark>",
      );
      if (descHighlight !== result.description) {
        highlights.description = [descHighlight];
      }
    }

    return highlights;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private groupResultsByType(
    results: SearchResultItemDto[],
  ): GroupedSearchResultDto[] {
    const groups = new Map<SearchEntityType, SearchResultItemDto[]>();

    for (const result of results) {
      const existing = groups.get(result.entityType) || [];
      existing.push(result);
      groups.set(result.entityType, existing);
    }

    return Array.from(groups.entries()).map(([entityType, items]) => ({
      entityType,
      count: items.length,
      items: items.sort((a, b) => b.score - a.score),
    }));
  }

  private async generateFacets(
    query: string,
    tenantId?: string,
  ): Promise<SearchFacetsDto> {
    const entityTypes = this.strategyRegistry.getAllEntityTypes();

    const entityTypeCounts = await Promise.all(
      entityTypes.map(async (type) => {
        const strategy = this.strategyRegistry.getStrategy(type);
        if (!strategy) return { type, count: 0 };
        const results = await strategy.search(query, tenantId, { limit: 100 });
        return { type, count: results.length };
      }),
    );

    return {
      entityTypes: entityTypeCounts.filter((e) => e.count > 0),
    };
  }

  private async generateSuggestions(query: string): Promise<string[]> {
    const suggestions: string[] = [];

    if (/^ec\d/i.test(query)) {
      const ecs = await this.prisma.eCStandard.findMany({
        where: { code: { startsWith: query.toUpperCase() } },
        take: 5,
        select: { code: true },
      });
      suggestions.push(...ecs.map((e) => e.code));
    }

    return suggestions;
  }

  private buildDateFilter(
    dateFrom?: string,
    dateTo?: string,
  ): { from?: Date; to?: Date } | undefined {
    if (!dateFrom && !dateTo) return undefined;

    return {
      from: dateFrom ? new Date(dateFrom) : undefined,
      to: dateTo ? new Date(dateTo) : undefined,
    };
  }

  private logSearch(
    query: string,
    entityTypes: SearchEntityType[],
    resultCount: number,
    tenantId?: string,
  ): void {
    this.logger.debug(
      `Search: "${query}" | Types: ${entityTypes.join(",")} | Results: ${resultCount} | Tenant: ${tenantId || "all"}`,
    );
  }
}
