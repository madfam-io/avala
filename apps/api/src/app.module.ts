import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { TenantModule } from './modules/tenant/tenant.module';
import { UserModule } from './modules/user/user.module';
import { CompetencyModule } from './modules/competency/competency.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';

/**
 * Root Application Module
 * Phase 0: Tenant foundation, RBAC, EC structure, Portfolios
 */
@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    DatabaseModule,

    // Feature modules (Phase 0)
    TenantModule,
    UserModule,
    CompetencyModule,
    PortfolioModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
})
export class AppModule {}
