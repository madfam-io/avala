import { Module } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { LessonsService } from './lessons.service';
import { CurriculumController } from './curriculum.controller';

@Module({
  controllers: [CurriculumController],
  providers: [ModulesService, LessonsService],
  exports: [ModulesService, LessonsService],
})
export class CurriculumModule {}
