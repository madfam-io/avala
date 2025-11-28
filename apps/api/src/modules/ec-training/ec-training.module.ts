import { Module } from '@nestjs/common';
import { ECTrainingService } from './ec-training.service';
import { ECTrainingController } from './ec-training.controller';

@Module({
  controllers: [ECTrainingController],
  providers: [ECTrainingService],
  exports: [ECTrainingService],
})
export class ECTrainingModule {}
