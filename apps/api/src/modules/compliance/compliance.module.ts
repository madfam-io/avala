import { Module } from '@nestjs/common';
import { ComplianceController } from './compliance.controller';
import { SIRCEService } from './sirce.service';
import { LFTPlanService } from './lft-plan.service';
import { PrismaService } from '../../database/prisma.service';

/**
 * Compliance Module
 * 
 * Handles Mexican labor compliance requirements:
 * - SIRCE: Training record exports for STPS reporting
 * - LFT Plans: Annual training plans per Ley Federal del Trabajo
 * - DC-3: Integration with certificate generation (via CertificationModule)
 */
@Module({
  controllers: [ComplianceController],
  providers: [SIRCEService, LFTPlanService, PrismaService],
  exports: [SIRCEService, LFTPlanService],
})
export class ComplianceModule {}
