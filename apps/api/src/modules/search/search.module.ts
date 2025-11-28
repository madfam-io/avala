import { Module } from "@nestjs/common";
import { SearchService } from "./search.service";
import { SearchController } from "./search.controller";
import { DatabaseModule } from "../../database/database.module";
import { SearchStrategyRegistry } from "./search-strategy.registry";
import {
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

const searchStrategies = [
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
];

@Module({
  imports: [DatabaseModule],
  controllers: [SearchController],
  providers: [SearchService, SearchStrategyRegistry, ...searchStrategies],
  exports: [SearchService],
})
export class SearchModule {}
