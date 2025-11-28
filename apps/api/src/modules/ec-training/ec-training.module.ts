import { Module } from "@nestjs/common";
import { ECTrainingService } from "./ec-training.service";
import { ECTrainingController } from "./ec-training.controller";
import {
  ProgressCalculationService,
  EnrollmentManagementService,
  LessonProgressService,
  EnrollmentAnalyticsService,
} from "./services";

@Module({
  controllers: [ECTrainingController],
  providers: [
    ECTrainingService,
    ProgressCalculationService,
    EnrollmentManagementService,
    LessonProgressService,
    EnrollmentAnalyticsService,
  ],
  exports: [ECTrainingService],
})
export class ECTrainingModule {}
