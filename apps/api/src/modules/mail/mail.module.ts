import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { MailService } from './mail.service';
import { JanuaEmailService } from './janua-email.service';

/**
 * MailModule
 * Phase 5: Production Readiness (Mailer)
 * Provides email notification capabilities across the application
 *
 * Supports two email providers:
 * - JanuaEmailService: Centralized Resend integration (preferred)
 * - MailService: SMTP fallback for local development
 */
@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 3,
    }),
  ],
  providers: [MailService, JanuaEmailService],
  exports: [MailService, JanuaEmailService],
})
export class MailModule {}
