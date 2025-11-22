import { Module } from '@nestjs/common';
import { CertificatesController } from './certificates.controller';
import { CertificatesService } from './certificates.service';
import { DatabaseModule } from '../../database/database.module';
import { MailModule } from '../mail/mail.module';

/**
 * CertificatesModule
 * Phase 3-B: DC-3 Certificate Generation and Management
 */
@Module({
  imports: [DatabaseModule, MailModule],
  controllers: [CertificatesController],
  providers: [CertificatesService],
  exports: [CertificatesService],
})
export class CertificatesModule {}
