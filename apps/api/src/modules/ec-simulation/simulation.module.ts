import { Module } from "@nestjs/common";
import { SimulationController } from "./simulation.controller";
import { SimulationService } from "./simulation.service";
import { SimulationEngineService } from "./simulation-engine.service";
import { DatabaseModule } from "../../database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [SimulationController],
  providers: [SimulationService, SimulationEngineService],
  exports: [SimulationService, SimulationEngineService],
})
export class SimulationModule {}
