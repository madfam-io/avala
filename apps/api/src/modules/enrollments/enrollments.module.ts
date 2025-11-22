import { Module } from '@nestjs/common';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { ProgressService } from './progress.service';
import { DatabaseModule } from '../../database/database.module';

/**
 * EnrollmentsModule
 * Phase 3-A: Course enrollment and progress tracking
 */
@Module({
  imports: [DatabaseModule],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService, ProgressService],
  exports: [EnrollmentsService, ProgressService],
})
export class EnrollmentsModule {}
