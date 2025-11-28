import { SearchEntityType, SearchResultItemDto } from '../dto/search.dto';

export interface SearchOptions {
  limit: number;
  dateFilter?: {
    from?: Date;
    to?: Date;
  };
}

export interface SearchStrategy {
  readonly entityType: SearchEntityType;

  search(
    query: string,
    tenantId?: string,
    options?: SearchOptions,
  ): Promise<SearchResultItemDto[]>;

  calculateScore(query: string, fields: string[]): number;
}

export abstract class BaseSearchStrategy implements SearchStrategy {
  abstract readonly entityType: SearchEntityType;

  abstract search(
    query: string,
    tenantId?: string,
    options?: SearchOptions,
  ): Promise<SearchResultItemDto[]>;

  calculateScore(query: string, fields: string[]): number {
    const normalizedQuery = query.toLowerCase();
    let score = 0;

    for (const field of fields) {
      if (!field) continue;
      const normalizedField = field.toLowerCase();

      if (normalizedField === normalizedQuery) {
        score += 100;
      } else if (normalizedField.startsWith(normalizedQuery)) {
        score += 80;
      } else if (normalizedField.includes(normalizedQuery)) {
        score += 50;
      } else {
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

  protected applyDateFilter(
    results: SearchResultItemDto[],
    dateFilter?: { from?: Date; to?: Date },
  ): SearchResultItemDto[] {
    if (!dateFilter) return results;

    return results.filter((r) => {
      if (!r.createdAt) return true;
      const date = new Date(r.createdAt);
      if (dateFilter.from && date < dateFilter.from) return false;
      if (dateFilter.to && date > dateFilter.to) return false;
      return true;
    });
  }
}
