import { Module } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { LessonsService } from './lessons.service';
import { CompetencyMappingService } from './competency-mapping.service';
import { CurriculumController } from './curriculum.controller';

@Module({
  controllers: [CurriculumController],
  providers: [ModulesService, LessonsService, CompetencyMappingService],
  exports: [ModulesService, LessonsService, CompetencyMappingService],
})
export class CurriculumModule {}
