import { Module } from '@nestjs/common';
import { CredentialsController } from './credentials.controller';
import { OpenBadgeService } from './open-badge.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [CredentialsController],
  providers: [OpenBadgeService, PrismaService],
  exports: [OpenBadgeService],
})
export class CredentialsModule {}
