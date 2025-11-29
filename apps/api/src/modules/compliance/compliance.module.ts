import { Module } from "@nestjs/common";
import { ComplianceController } from "./compliance.controller";
import { SIRCEService } from "./sirce.service";
import { LFTPlanService } from "./lft-plan.service";
import { DC3Service } from "./dc3.service";
import { PrismaService } from "../../database/prisma.service";

/**
 * Compliance Module
 *
 * Handles Mexican labor compliance requirements:
 * - DC-3: Training constancia generation with serial numbers
 * - SIRCE: Training record exports for STPS reporting
 * - LFT Plans: Annual training plans per Ley Federal del Trabajo
 */
@Module({
  controllers: [ComplianceController],
  providers: [DC3Service, SIRCEService, LFTPlanService, PrismaService],
  exports: [DC3Service, SIRCEService, LFTPlanService],
})
export class ComplianceModule {}
