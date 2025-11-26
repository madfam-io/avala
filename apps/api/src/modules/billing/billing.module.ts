import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { DatabaseModule } from '../../database/database.module';

/**
 * Billing Module for Avala
 *
 * Integrates with Janua's multi-provider billing system:
 * - Conekta for Mexico (SPEI, cards, CFDI)
 * - Polar.sh for international
 * - Stripe as fallback
 *
 * Avala-specific billing:
 * - Per-seat pricing (learners)
 * - DC-3 certificate generation limits
 * - Storage quotas for evidence portfolios
 * - Course/path limits by tier
 */
@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
