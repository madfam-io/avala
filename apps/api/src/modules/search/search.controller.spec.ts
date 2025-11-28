import { Test, TestingModule } from "@nestjs/testing";
import { SearchController } from "./search.controller";
import { SearchService } from "./search.service";

describe("SearchController", () => {
  let controller: SearchController;
  let searchService: jest.Mocked<SearchService>;

  const mockSearchService = {
    globalSearch: jest.fn(),
    advancedSearch: jest.fn(),
    autocomplete: jest.fn(),
    getSearchAnalytics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [{ provide: SearchService, useValue: mockSearchService }],
    }).compile();

    controller = module.get<SearchController>(SearchController);
    searchService = module.get(SearchService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("globalSearch", () => {
    it("should perform global search", async () => {
      const mockDto = { query: "test", page: 1, limit: 10 };
      searchService.globalSearch.mockResolvedValue({
        results: [],
        total: 0,
      } as any);
      await controller.globalSearch(mockDto as any);
      expect(searchService.globalSearch).toHaveBeenCalledWith(mockDto);
    });
  });

  describe("advancedSearch", () => {
    it("should perform advanced search", async () => {
      const mockDto = { query: "test", filters: {} };
      searchService.advancedSearch.mockResolvedValue({
        results: [],
        total: 0,
      } as any);
      await controller.advancedSearch(mockDto as any);
      expect(searchService.advancedSearch).toHaveBeenCalledWith(mockDto);
    });
  });

  describe("autocomplete", () => {
    it("should return autocomplete suggestions", async () => {
      const mockDto = { query: "test" };
      searchService.autocomplete.mockResolvedValue([]);
      await controller.autocomplete(mockDto as any);
      expect(searchService.autocomplete).toHaveBeenCalledWith(mockDto);
    });
  });

  describe("getAnalytics", () => {
    it("should return search analytics", async () => {
      searchService.getSearchAnalytics.mockResolvedValue({} as any);
      await controller.getAnalytics();
      expect(searchService.getSearchAnalytics).toHaveBeenCalled();
    });
  });
});
