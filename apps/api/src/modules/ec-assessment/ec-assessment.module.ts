import { Module } from "@nestjs/common";
import { ECAssessmentService } from "./ec-assessment.service";
import { ECAssessmentController } from "./ec-assessment.controller";
import { GradingService, AttemptService } from "./services";
import {
  MultipleChoiceHandler,
  TrueFalseHandler,
  ShortAnswerHandler,
  MatchingHandler,
  EssayHandler,
} from "./handlers";

const questionHandlers = [
  MultipleChoiceHandler,
  TrueFalseHandler,
  ShortAnswerHandler,
  MatchingHandler,
  EssayHandler,
];

@Module({
  controllers: [ECAssessmentController],
  providers: [
    ECAssessmentService,
    GradingService,
    AttemptService,
    ...questionHandlers,
  ],
  exports: [ECAssessmentService],
})
export class ECAssessmentModule {}
