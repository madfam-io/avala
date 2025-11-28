import { Module } from "@nestjs/common";
import { RenecController } from "./renec.controller";
import { RenecService } from "./renec.service";
import { RenecScraperService } from "./renec-scraper.service";
import { DatabaseModule } from "../../database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [RenecController],
  providers: [RenecService, RenecScraperService],
  exports: [RenecService, RenecScraperService],
})
export class RenecModule {}
