import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { GamificationController } from "./gamification.controller";
import { GamificationService } from "./gamification.service";
import { AchievementEngineService } from "./achievement-engine.service";
import { StreakService } from "./streak.service";
import { LeaderboardService } from "./leaderboard.service";
import { GamificationEventsListener } from "./gamification-events.listener";
import { DatabaseModule } from "../../database/database.module";

@Module({
  imports: [
    DatabaseModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
  ],
  controllers: [GamificationController],
  providers: [
    GamificationService,
    AchievementEngineService,
    StreakService,
    LeaderboardService,
    GamificationEventsListener,
  ],
  exports: [
    GamificationService,
    AchievementEngineService,
    StreakService,
    LeaderboardService,
  ],
})
export class GamificationModule {}
