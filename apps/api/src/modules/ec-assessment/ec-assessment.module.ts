import { Module } from '@nestjs/common';
import { ECAssessmentService } from './ec-assessment.service';
import { ECAssessmentController } from './ec-assessment.controller';

@Module({
  controllers: [ECAssessmentController],
  providers: [ECAssessmentService],
  exports: [ECAssessmentService],
})
export class ECAssessmentModule {}
