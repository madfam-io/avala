import { Test, TestingModule } from "@nestjs/testing";
import { SearchStrategyRegistry } from "./search-strategy.registry";
import { SearchEntityType } from "./dto/search.dto";
import {
  SearchStrategy,
  UserSearchStrategy,
  CourseSearchStrategy,
  LessonSearchStrategy,
  ECStandardSearchStrategy,
  ECEnrollmentSearchStrategy,
  RenecCenterSearchStrategy,
  RenecCertifierSearchStrategy,
  RenecECSearchStrategy,
  CertificationSearchStrategy,
  SimulationSearchStrategy,
  DocumentSearchStrategy,
} from "./strategies";

describe("SearchStrategyRegistry", () => {
  let registry: SearchStrategyRegistry;

  // Create mock strategies
  const createMockStrategy = (name: string): SearchStrategy => ({
    entityType: name as SearchEntityType,
    search: jest.fn(),
    calculateScore: jest.fn(),
  });

  const mockUserStrategy = createMockStrategy("user");
  const mockCourseStrategy = createMockStrategy("course");
  const mockLessonStrategy = createMockStrategy("lesson");
  const mockECStandardStrategy = createMockStrategy("ec_standard");
  const mockECEnrollmentStrategy = createMockStrategy("ec_enrollment");
  const mockRenecCenterStrategy = createMockStrategy("renec_centro");
  const mockRenecCertifierStrategy = createMockStrategy("renec_certificador");
  const mockRenecECStrategy = createMockStrategy("renec_ec");
  const mockCertificationStrategy = createMockStrategy("certification");
  const mockSimulationStrategy = createMockStrategy("simulation_scenario");
  const mockDocumentStrategy = createMockStrategy("document");

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchStrategyRegistry,
        { provide: UserSearchStrategy, useValue: mockUserStrategy },
        { provide: CourseSearchStrategy, useValue: mockCourseStrategy },
        { provide: LessonSearchStrategy, useValue: mockLessonStrategy },
        { provide: ECStandardSearchStrategy, useValue: mockECStandardStrategy },
        {
          provide: ECEnrollmentSearchStrategy,
          useValue: mockECEnrollmentStrategy,
        },
        {
          provide: RenecCenterSearchStrategy,
          useValue: mockRenecCenterStrategy,
        },
        {
          provide: RenecCertifierSearchStrategy,
          useValue: mockRenecCertifierStrategy,
        },
        { provide: RenecECSearchStrategy, useValue: mockRenecECStrategy },
        {
          provide: CertificationSearchStrategy,
          useValue: mockCertificationStrategy,
        },
        { provide: SimulationSearchStrategy, useValue: mockSimulationStrategy },
        { provide: DocumentSearchStrategy, useValue: mockDocumentStrategy },
      ],
    }).compile();

    registry = module.get<SearchStrategyRegistry>(SearchStrategyRegistry);
  });

  it("should be defined", () => {
    expect(registry).toBeDefined();
  });

  describe("getStrategy", () => {
    it("should return UserSearchStrategy for USER type", () => {
      const strategy = registry.getStrategy(SearchEntityType.USER);
      expect(strategy).toBe(mockUserStrategy);
    });

    it("should return CourseSearchStrategy for COURSE type", () => {
      const strategy = registry.getStrategy(SearchEntityType.COURSE);
      expect(strategy).toBe(mockCourseStrategy);
    });

    it("should return LessonSearchStrategy for LESSON type", () => {
      const strategy = registry.getStrategy(SearchEntityType.LESSON);
      expect(strategy).toBe(mockLessonStrategy);
    });

    it("should return ECStandardSearchStrategy for EC_STANDARD type", () => {
      const strategy = registry.getStrategy(SearchEntityType.EC_STANDARD);
      expect(strategy).toBe(mockECStandardStrategy);
    });

    it("should return ECEnrollmentSearchStrategy for EC_ENROLLMENT type", () => {
      const strategy = registry.getStrategy(SearchEntityType.EC_ENROLLMENT);
      expect(strategy).toBe(mockECEnrollmentStrategy);
    });

    it("should return RenecCenterSearchStrategy for RENEC_CENTRO type", () => {
      const strategy = registry.getStrategy(SearchEntityType.RENEC_CENTRO);
      expect(strategy).toBe(mockRenecCenterStrategy);
    });

    it("should return RenecCertifierSearchStrategy for RENEC_CERTIFICADOR type", () => {
      const strategy = registry.getStrategy(
        SearchEntityType.RENEC_CERTIFICADOR,
      );
      expect(strategy).toBe(mockRenecCertifierStrategy);
    });

    it("should return RenecECSearchStrategy for RENEC_EC type", () => {
      const strategy = registry.getStrategy(SearchEntityType.RENEC_EC);
      expect(strategy).toBe(mockRenecECStrategy);
    });

    it("should return CertificationSearchStrategy for CERTIFICATION type", () => {
      const strategy = registry.getStrategy(SearchEntityType.CERTIFICATION);
      expect(strategy).toBe(mockCertificationStrategy);
    });

    it("should return SimulationSearchStrategy for SIMULATION_SCENARIO type", () => {
      const strategy = registry.getStrategy(
        SearchEntityType.SIMULATION_SCENARIO,
      );
      expect(strategy).toBe(mockSimulationStrategy);
    });

    it("should return DocumentSearchStrategy for DOCUMENT type", () => {
      const strategy = registry.getStrategy(SearchEntityType.DOCUMENT);
      expect(strategy).toBe(mockDocumentStrategy);
    });

    it("should return undefined for unknown entity type", () => {
      const strategy = registry.getStrategy("unknown" as SearchEntityType);
      expect(strategy).toBeUndefined();
    });
  });

  describe("getAllStrategies", () => {
    it("should return all registered strategies", () => {
      const strategies = registry.getAllStrategies();

      expect(strategies).toHaveLength(11);
      expect(strategies).toContain(mockUserStrategy);
      expect(strategies).toContain(mockCourseStrategy);
      expect(strategies).toContain(mockLessonStrategy);
      expect(strategies).toContain(mockECStandardStrategy);
      expect(strategies).toContain(mockECEnrollmentStrategy);
      expect(strategies).toContain(mockRenecCenterStrategy);
      expect(strategies).toContain(mockRenecCertifierStrategy);
      expect(strategies).toContain(mockRenecECStrategy);
      expect(strategies).toContain(mockCertificationStrategy);
      expect(strategies).toContain(mockSimulationStrategy);
      expect(strategies).toContain(mockDocumentStrategy);
    });
  });

  describe("getStrategiesForTypes", () => {
    it("should return strategies for specified types", () => {
      const types = [SearchEntityType.USER, SearchEntityType.COURSE];
      const strategies = registry.getStrategiesForTypes(types);

      expect(strategies).toHaveLength(2);
      expect(strategies).toContain(mockUserStrategy);
      expect(strategies).toContain(mockCourseStrategy);
    });

    it("should filter out undefined strategies for unknown types", () => {
      const types = [
        SearchEntityType.USER,
        "unknown" as SearchEntityType,
        SearchEntityType.COURSE,
      ];
      const strategies = registry.getStrategiesForTypes(types);

      expect(strategies).toHaveLength(2);
      expect(strategies).toContain(mockUserStrategy);
      expect(strategies).toContain(mockCourseStrategy);
    });

    it("should return empty array for empty types array", () => {
      const strategies = registry.getStrategiesForTypes([]);
      expect(strategies).toHaveLength(0);
    });

    it("should return all strategies when all types are specified", () => {
      const types = [
        SearchEntityType.USER,
        SearchEntityType.COURSE,
        SearchEntityType.LESSON,
        SearchEntityType.EC_STANDARD,
        SearchEntityType.EC_ENROLLMENT,
        SearchEntityType.RENEC_CENTRO,
        SearchEntityType.RENEC_CERTIFICADOR,
        SearchEntityType.RENEC_EC,
        SearchEntityType.CERTIFICATION,
        SearchEntityType.SIMULATION_SCENARIO,
        SearchEntityType.DOCUMENT,
      ];
      const strategies = registry.getStrategiesForTypes(types);

      expect(strategies).toHaveLength(11);
    });
  });

  describe("getAllEntityTypes", () => {
    it("should return all registered entity types", () => {
      const types = registry.getAllEntityTypes();

      expect(types).toHaveLength(11);
      expect(types).toContain(SearchEntityType.USER);
      expect(types).toContain(SearchEntityType.COURSE);
      expect(types).toContain(SearchEntityType.LESSON);
      expect(types).toContain(SearchEntityType.EC_STANDARD);
      expect(types).toContain(SearchEntityType.EC_ENROLLMENT);
      expect(types).toContain(SearchEntityType.RENEC_CENTRO);
      expect(types).toContain(SearchEntityType.RENEC_CERTIFICADOR);
      expect(types).toContain(SearchEntityType.RENEC_EC);
      expect(types).toContain(SearchEntityType.CERTIFICATION);
      expect(types).toContain(SearchEntityType.SIMULATION_SCENARIO);
      expect(types).toContain(SearchEntityType.DOCUMENT);
    });
  });
});
