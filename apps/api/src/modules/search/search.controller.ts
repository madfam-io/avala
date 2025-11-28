import { Controller, Get, Post, Query, Body, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { SearchService } from "./search.service";
import {
  GlobalSearchDto,
  AdvancedSearchDto,
  AutocompleteDto,
  SearchResponseDto,
  AutocompleteSuggestionDto,
  SearchAnalyticsDto,
} from "./dto/search.dto";

@ApiTags("Search")
@Controller("search")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: "Global search across all entities" })
  @ApiResponse({ status: 200, description: "Search results" })
  async globalSearch(
    @Query() dto: GlobalSearchDto,
  ): Promise<SearchResponseDto> {
    return this.searchService.globalSearch(dto);
  }

  @Post("advanced")
  @ApiOperation({ summary: "Advanced search with filters" })
  @ApiResponse({ status: 200, description: "Filtered search results" })
  async advancedSearch(
    @Body() dto: AdvancedSearchDto,
  ): Promise<SearchResponseDto> {
    return this.searchService.advancedSearch(dto);
  }

  @Get("autocomplete")
  @ApiOperation({ summary: "Get autocomplete suggestions" })
  @ApiResponse({ status: 200, description: "Autocomplete suggestions" })
  async autocomplete(
    @Query() dto: AutocompleteDto,
  ): Promise<AutocompleteSuggestionDto[]> {
    return this.searchService.autocomplete(dto);
  }

  @Get("analytics")
  @ApiOperation({ summary: "Get search analytics" })
  @ApiResponse({ status: 200, description: "Search analytics data" })
  async getAnalytics(): Promise<SearchAnalyticsDto> {
    return this.searchService.getSearchAnalytics();
  }
}
