import { Injectable } from "@nestjs/common";
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

@Injectable()
export class SearchStrategyRegistry {
  private readonly strategies: Map<SearchEntityType, SearchStrategy>;

  constructor(
    userStrategy: UserSearchStrategy,
    courseStrategy: CourseSearchStrategy,
    lessonStrategy: LessonSearchStrategy,
    ecStandardStrategy: ECStandardSearchStrategy,
    ecEnrollmentStrategy: ECEnrollmentSearchStrategy,
    renecCenterStrategy: RenecCenterSearchStrategy,
    renecCertifierStrategy: RenecCertifierSearchStrategy,
    renecECStrategy: RenecECSearchStrategy,
    certificationStrategy: CertificationSearchStrategy,
    simulationStrategy: SimulationSearchStrategy,
    documentStrategy: DocumentSearchStrategy,
  ) {
    this.strategies = new Map<SearchEntityType, SearchStrategy>();
    this.strategies.set(SearchEntityType.USER, userStrategy);
    this.strategies.set(SearchEntityType.COURSE, courseStrategy);
    this.strategies.set(SearchEntityType.LESSON, lessonStrategy);
    this.strategies.set(SearchEntityType.EC_STANDARD, ecStandardStrategy);
    this.strategies.set(SearchEntityType.EC_ENROLLMENT, ecEnrollmentStrategy);
    this.strategies.set(SearchEntityType.RENEC_CENTRO, renecCenterStrategy);
    this.strategies.set(
      SearchEntityType.RENEC_CERTIFICADOR,
      renecCertifierStrategy,
    );
    this.strategies.set(SearchEntityType.RENEC_EC, renecECStrategy);
    this.strategies.set(SearchEntityType.CERTIFICATION, certificationStrategy);
    this.strategies.set(
      SearchEntityType.SIMULATION_SCENARIO,
      simulationStrategy,
    );
    this.strategies.set(SearchEntityType.DOCUMENT, documentStrategy);
  }

  getStrategy(entityType: SearchEntityType): SearchStrategy | undefined {
    return this.strategies.get(entityType);
  }

  getAllStrategies(): SearchStrategy[] {
    return Array.from(this.strategies.values());
  }

  getStrategiesForTypes(types: SearchEntityType[]): SearchStrategy[] {
    return types
      .map((type) => this.strategies.get(type))
      .filter((s): s is SearchStrategy => s !== undefined);
  }

  getAllEntityTypes(): SearchEntityType[] {
    return Array.from(this.strategies.keys());
  }
}
