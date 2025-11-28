import { Module } from '@nestjs/common';
import { ECPortfolioService } from './ec-portfolio.service';
import { ECPortfolioController } from './ec-portfolio.controller';

@Module({
  controllers: [ECPortfolioController],
  providers: [ECPortfolioService],
  exports: [ECPortfolioService],
})
export class ECPortfolioModule {}
