import { Module } from "@nestjs/common";
import { CertificationController } from "./certification.controller";
import { CertificationService } from "./certification.service";
import { DatabaseModule } from "../../database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [CertificationController],
  providers: [CertificationService],
  exports: [CertificationService],
})
export class CertificationModule {}
