import { Module } from '@nestjs/common';
import { ECConfigService } from './ec-config.service';
import { ECConfigController } from './ec-config.controller';

@Module({
  controllers: [ECConfigController],
  providers: [ECConfigService],
  exports: [ECConfigService],
})
export class ECConfigModule {}
