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

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // GLOBAL SEARCH
  // ============================================

  async globalSearch(dto: GlobalSearchDto): Promise<SearchResponseDto> {
    const startTime = Date.now();
    const { query, entityTypes, tenantId, skip, limit, highlightMatches } = dto;

    const searchableTypes = entityTypes?.length
      ? entityTypes
      : Object.values(SearchEntityType);

    // Execute parallel searches across all entity types
    const searchPromises = searchableTypes.map((type) =>
      this.searchEntityType(type, query, tenantId, limit || 20),
    );

    const searchResults = await Promise.all(searchPromises);

    // Flatten and sort by score
    let allResults: SearchResultItemDto[] = searchResults.flat();

    // Sort by relevance score
    allResults.sort((a, b) => b.score - a.score);

    // Apply pagination
    const totalResults = allResults.length;
    allResults = allResults.slice(skip || 0, (skip || 0) + (limit || 20));

    // Add highlights if requested
    if (highlightMatches) {
      allResults = allResults.map((result) => ({
        ...result,
        highlights: this.generateHighlights(result, query),
      }));
    }

    // Group results by entity type
    const groupedResults = this.groupResultsByType(searchResults.flat());

    // Generate facets
    const facets = await this.generateFacets(query, tenantId);

    // Generate suggestions for refinement
    const suggestions = await this.generateSuggestions(query);

    const took = Date.now() - startTime;

    // Log search for analytics
    this.logSearch(query, entityTypes || [], totalResults, tenantId);

    return {
      query,
      totalResults,
      took,
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
      : Object.values(SearchEntityType);

    // Build date filter
    const dateFilter = this.buildDateFilter(dateFrom, dateTo);

    // Execute searches with additional filters
    const searchPromises = searchableTypes.map((type) =>
      this.searchEntityTypeAdvanced(type, query, tenantId, {
        dateFilter,
        limit: limit || 20,
      }),
    );

    const searchResults = await Promise.all(searchPromises);

    // Flatten, filter by minScore, and sort
    let allResults: SearchResultItemDto[] = searchResults
      .flat()
      .filter((r) => r.score >= (minScore || 0));

    allResults.sort((a, b) => b.score - a.score);

    const totalResults = allResults.length;
    allResults = allResults.slice(skip || 0, (skip || 0) + (limit || 20));

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

  // ============================================
  // ENTITY-SPECIFIC SEARCH
  // ============================================

  private async searchEntityType(
    entityType: SearchEntityType,
    query: string,
    tenantId?: string,
    limit: number = 20,
  ): Promise<SearchResultItemDto[]> {
    const normalizedQuery = query.toLowerCase().trim();

    switch (entityType) {
      case SearchEntityType.USER:
        return this.searchUsers(normalizedQuery, tenantId, limit);
      case SearchEntityType.COURSE:
        return this.searchCourses(normalizedQuery, tenantId, limit);
      case SearchEntityType.LESSON:
        return this.searchLessons(normalizedQuery, tenantId, limit);
      case SearchEntityType.EC_STANDARD:
        return this.searchECStandards(normalizedQuery, tenantId, limit);
      case SearchEntityType.EC_ENROLLMENT:
        return this.searchECEnrollments(normalizedQuery, tenantId, limit);
      case SearchEntityType.RENEC_CENTRO:
        return this.searchRenecCenters(normalizedQuery, limit);
      case SearchEntityType.RENEC_CERTIFICADOR:
        return this.searchRenecCertifiers(normalizedQuery, limit);
      case SearchEntityType.RENEC_EC:
        return this.searchRenecECs(normalizedQuery, limit);
      case SearchEntityType.CERTIFICATION:
        return this.searchCertificates(normalizedQuery, tenantId, limit);
      case SearchEntityType.SIMULATION_SCENARIO:
        return this.searchSimulations(normalizedQuery, tenantId, limit);
      case SearchEntityType.DOCUMENT:
        return this.searchDocuments(normalizedQuery, tenantId, limit);
      default:
        return [];
    }
  }

  private async searchEntityTypeAdvanced(
    entityType: SearchEntityType,
    query: string,
    tenantId?: string,
    filters?: {
      dateFilter?: { from?: Date; to?: Date };
      limit?: number;
    },
  ): Promise<SearchResultItemDto[]> {
    const results = await this.searchEntityType(
      entityType,
      query,
      tenantId,
      filters?.limit || 20,
    );

    // Apply date filter
    if (filters?.dateFilter) {
      return results.filter((r) => {
        if (!r.createdAt) return true;
        const date = new Date(r.createdAt);
        if (filters.dateFilter?.from && date < filters.dateFilter.from)
          return false;
        if (filters.dateFilter?.to && date > filters.dateFilter.to)
          return false;
        return true;
      });
    }

    return results;
  }

  // ============================================
  // INDIVIDUAL ENTITY SEARCHES
  // ============================================

  private async searchUsers(
    query: string,
    tenantId?: string,
    limit: number = 20,
  ): Promise<SearchResultItemDto[]> {
    const where: Record<string, unknown> = {
      OR: [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    };
    if (tenantId) where.tenantId = tenantId;

    const users = await this.prisma.user.findMany({
      where,
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return users.map((user) => {
      const fullName =
        [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
      return {
        id: user.id,
        entityType: SearchEntityType.USER,
        title: fullName,
        description: `${user.role} - ${user.email}`,
        score: this.calculateScore(query, [
          user.firstName || "",
          user.lastName || "",
          user.email,
        ]),
        metadata: { role: user.role },
        url: `/admin/users/${user.id}`,
        createdAt: user.createdAt,
      };
    });
  }

  private async searchCourses(
    query: string,
    tenantId?: string,
    limit: number = 20,
  ): Promise<SearchResultItemDto[]> {
    const where: Record<string, unknown> = {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { code: { contains: query, mode: "insensitive" } },
      ],
    };
    if (tenantId) where.tenantId = tenantId;

    const courses = await this.prisma.course.findMany({
      where,
      take: limit,
      include: {
        standards: { select: { code: true, title: true }, take: 1 },
      },
    });

    return courses.map((course) => ({
      id: course.id,
      entityType: SearchEntityType.COURSE,
      title: course.title,
      description: course.description || undefined,
      score: this.calculateScore(query, [
        course.title,
        course.description || "",
        course.code || "",
      ]),
      metadata: {
        code: course.code,
        ecStandard: course.standards?.[0]?.code,
        status: course.status,
      },
      url: `/courses/${course.id}`,
      createdAt: course.createdAt,
    }));
  }

  private async searchLessons(
    query: string,
    tenantId?: string,
    limit: number = 20,
  ): Promise<SearchResultItemDto[]> {
    const where: Record<string, unknown> = {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
      ],
    };
    if (tenantId) {
      where.module = { course: { tenantId } };
    }

    const lessons = await this.prisma.lesson.findMany({
      where,
      take: limit,
      include: {
        module: {
          select: {
            title: true,
            course: { select: { id: true, title: true } },
          },
        },
      },
    });

    return lessons.map((lesson) => ({
      id: lesson.id,
      entityType: SearchEntityType.LESSON,
      title: lesson.title,
      description: lesson.content?.substring(0, 200) || undefined,
      score: this.calculateScore(query, [lesson.title, lesson.content || ""]),
      metadata: {
        moduleTitle: lesson.module?.title,
        courseId: lesson.module?.course?.id,
        courseTitle: lesson.module?.course?.title,
      },
      url: `/courses/${lesson.module?.course?.id}/lessons/${lesson.id}`,
      createdAt: lesson.createdAt,
    }));
  }

  private async searchECStandards(
    query: string,
    tenantId?: string,
    limit: number = 20,
  ): Promise<SearchResultItemDto[]> {
    const where: Record<string, unknown> = {
      OR: [
        { code: { contains: query, mode: "insensitive" } },
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    };
    if (tenantId) where.tenantId = tenantId;

    const standards = await this.prisma.eCStandard.findMany({
      where,
      take: limit,
    });

    return standards.map((standard) => ({
      id: standard.id,
      entityType: SearchEntityType.EC_STANDARD,
      title: `${standard.code} - ${standard.title}`,
      description: standard.description || undefined,
      score: this.calculateScore(query, [
        standard.code,
        standard.title,
        standard.description || "",
      ]),
      metadata: {
        code: standard.code,
        sector: standard.sector,
        status: standard.status,
      },
      url: `/ec-standards/${standard.id}`,
      createdAt: standard.createdAt,
    }));
  }

  private async searchECEnrollments(
    query: string,
    tenantId?: string,
    limit: number = 20,
  ): Promise<SearchResultItemDto[]> {
    const where: Record<string, unknown> = {
      OR: [
        { ec: { code: { contains: query, mode: "insensitive" } } },
        { ec: { title: { contains: query, mode: "insensitive" } } },
      ],
    };
    if (tenantId) where.tenantId = tenantId;

    const enrollments = await this.prisma.eCEnrollment.findMany({
      where,
      take: limit,
      include: {
        ec: { select: { id: true, code: true, title: true } },
      },
    });

    return enrollments.map((enrollment) => ({
      id: enrollment.id,
      entityType: SearchEntityType.EC_ENROLLMENT,
      title: `Enrollment - ${enrollment.ec?.code}`,
      description: enrollment.ec?.title,
      score: this.calculateScore(query, [
        enrollment.ec?.code || "",
        enrollment.ec?.title || "",
      ]),
      metadata: {
        userId: enrollment.userId,
        ecId: enrollment.ecId,
        status: enrollment.status,
        progress: enrollment.overallProgress,
      },
      url: `/enrollments/${enrollment.id}`,
      createdAt: enrollment.enrolledAt,
    }));
  }

  private async searchRenecCenters(
    query: string,
    limit: number = 20,
  ): Promise<SearchResultItemDto[]> {
    const centers = await this.prisma.renecCenter.findMany({
      where: {
        OR: [
          { nombre: { contains: query, mode: "insensitive" } },
          { direccion: { contains: query, mode: "insensitive" } },
          { municipio: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit,
    });

    return centers.map((center) => ({
      id: center.id,
      entityType: SearchEntityType.RENEC_CENTRO,
      title: center.nombre,
      description: `${center.municipio || ""}, ${center.estado || ""}`,
      score: this.calculateScore(query, [
        center.nombre,
        center.municipio || "",
      ]),
      metadata: {
        estado: center.estado,
        telefono: center.telefono,
      },
      url: `/renec/centers/${center.id}`,
      createdAt: center.createdAt,
    }));
  }

  private async searchRenecCertifiers(
    query: string,
    limit: number = 20,
  ): Promise<SearchResultItemDto[]> {
    const certifiers = await this.prisma.renecCertifier.findMany({
      where: {
        OR: [
          { razonSocial: { contains: query, mode: "insensitive" } },
          { nombreComercial: { contains: query, mode: "insensitive" } },
          { direccion: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit,
    });

    return certifiers.map((cert) => ({
      id: cert.id,
      entityType: SearchEntityType.RENEC_CERTIFICADOR,
      title: cert.razonSocial,
      description: cert.nombreComercial || undefined,
      score: this.calculateScore(query, [
        cert.razonSocial,
        cert.nombreComercial || "",
      ]),
      metadata: {
        nombreComercial: cert.nombreComercial,
        tipo: cert.tipo,
        estado: cert.estado,
      },
      url: `/renec/certifiers/${cert.id}`,
      createdAt: cert.createdAt,
    }));
  }

  private async searchRenecECs(
    query: string,
    limit: number = 20,
  ): Promise<SearchResultItemDto[]> {
    const ecs = await this.prisma.renecEC.findMany({
      where: {
        OR: [
          { ecClave: { contains: query, mode: "insensitive" } },
          { titulo: { contains: query, mode: "insensitive" } },
          { sector: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit,
    });

    return ecs.map((ec) => ({
      id: ec.id,
      entityType: SearchEntityType.RENEC_EC,
      title: `${ec.ecClave} - ${ec.titulo}`,
      description: ec.sector || undefined,
      score: this.calculateScore(query, [
        ec.ecClave,
        ec.titulo,
        ec.sector || "",
      ]),
      metadata: {
        sector: ec.sector,
        nivel: ec.nivelCompetencia,
        vigente: ec.vigente,
      },
      url: `/renec/ec/${ec.id}`,
      createdAt: ec.createdAt,
    }));
  }

  private async searchCertificates(
    query: string,
    tenantId?: string,
    limit: number = 20,
  ): Promise<SearchResultItemDto[]> {
    const where: Record<string, unknown> = {
      OR: [{ serial: { contains: query, mode: "insensitive" } }],
    };
    if (tenantId) where.tenantId = tenantId;

    const certs = await this.prisma.dC3.findMany({
      where,
      take: limit,
      include: {
        course: { select: { title: true, code: true } },
      },
    });

    return certs.map((cert) => ({
      id: cert.id,
      entityType: SearchEntityType.CERTIFICATION,
      title: cert.serial,
      description: cert.course?.title,
      score: this.calculateScore(query, [
        cert.serial,
        cert.course?.title || "",
      ]),
      metadata: {
        status: cert.status,
        courseCode: cert.course?.code,
      },
      url: `/certifications/${cert.id}`,
      createdAt: cert.issuedAt,
    }));
  }

  private async searchSimulations(
    query: string,
    _tenantId?: string,
    limit: number = 20,
  ): Promise<SearchResultItemDto[]> {
    const where: Record<string, unknown> = {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { code: { contains: query, mode: "insensitive" } },
      ],
    };

    const simulations = await this.prisma.eCSimulation.findMany({
      where,
      take: limit,
      include: {
        ec: { select: { code: true, title: true } },
      },
    });

    return simulations.map((sim) => ({
      id: sim.id,
      entityType: SearchEntityType.SIMULATION_SCENARIO,
      title: sim.title,
      description: sim.ec?.title,
      score: this.calculateScore(query, [sim.title, sim.code || ""]),
      metadata: {
        type: sim.type,
        ecCode: sim.ec?.code,
      },
      url: `/simulations/${sim.id}`,
      createdAt: sim.createdAt,
    }));
  }

  private async searchDocuments(
    query: string,
    tenantId?: string,
    limit: number = 20,
  ): Promise<SearchResultItemDto[]> {
    const where: Record<string, unknown> = {
      OR: [{ title: { contains: query, mode: "insensitive" } }],
    };
    if (tenantId) where.tenantId = tenantId;

    const documents = await this.prisma.document.findMany({
      where,
      take: limit,
    });

    return documents.map((doc) => ({
      id: doc.id,
      entityType: SearchEntityType.DOCUMENT,
      title: doc.title || `Document ${doc.id.slice(0, 8)}`,
      description: undefined,
      score: this.calculateScore(query, [doc.title || ""]),
      metadata: {
        status: doc.status,
      },
      url: `/documents/${doc.id}`,
      createdAt: doc.createdAt,
    }));
  }

  // ============================================
  // AUTOCOMPLETE
  // ============================================

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

    const suggestions: AutocompleteSuggestionDto[] = [];

    for (const type of searchableTypes) {
      const results = await this.searchEntityType(type, query, tenantId, 5);
      suggestions.push(
        ...results.map((r) => ({
          text: r.title,
          entityType: r.entityType,
          entityId: r.id,
          score: r.score,
        })),
      );
    }

    // Sort by score and limit
    return suggestions.sort((a, b) => b.score - a.score).slice(0, limit || 10);
  }

  // ============================================
  // ANALYTICS
  // ============================================

  async getSearchAnalytics(): Promise<SearchAnalyticsDto> {
    // In production, this would query a search_logs table
    return {
      totalSearches: 0,
      uniqueQueries: 0,
      averageResultCount: 0,
      topQueries: [],
      noResultQueries: [],
      entityTypeDistribution: Object.values(SearchEntityType).map((type) => ({
        type,
        percentage: 100 / Object.values(SearchEntityType).length,
      })),
    };
  }

  // ============================================
  // HELPERS
  // ============================================

  private calculateScore(query: string, fields: string[]): number {
    const normalizedQuery = query.toLowerCase();
    let score = 0;

    for (const field of fields) {
      if (!field) continue;
      const normalizedField = field.toLowerCase();

      // Exact match
      if (normalizedField === normalizedQuery) {
        score += 100;
      }
      // Starts with query
      else if (normalizedField.startsWith(normalizedQuery)) {
        score += 80;
      }
      // Contains query
      else if (normalizedField.includes(normalizedQuery)) {
        score += 50;
      }
      // Word match
      else {
        const words = normalizedField.split(/\s+/);
        for (const word of words) {
          if (word === normalizedQuery) {
            score += 40;
          } else if (word.startsWith(normalizedQuery)) {
            score += 30;
          }
        }
      }
    }

    return Math.min(score, 100);
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
    const entityTypeCounts = await Promise.all(
      Object.values(SearchEntityType).map(async (type) => {
        const results = await this.searchEntityType(type, query, tenantId, 100);
        return { type, count: results.length };
      }),
    );

    return {
      entityTypes: entityTypeCounts.filter((e) => e.count > 0),
    };
  }

  private async generateSuggestions(query: string): Promise<string[]> {
    const suggestions: string[] = [];

    // Suggest EC codes if query looks like one
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
