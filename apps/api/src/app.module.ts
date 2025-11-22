import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { TenantModule } from './modules/tenant/tenant.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompetencyModule } from './modules/competency/competency.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { CoursesModule } from './modules/courses/courses.module';
import { CurriculumModule } from './modules/curriculum/curriculum.module';

/**
 * Root Application Module
 * Phase 0: Tenant foundation, RBAC, EC structure, Portfolios
 * Phase 1-A: Authentication & App Shell
 * Phase 2-A: Course Management & EC Alignment
 * Phase 2-B: Curriculum Structure (Modules & Lessons)
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

    // Auth (Phase 1-A)
    AuthModule,

    // Feature modules (Phase 0)
    TenantModule,
    UserModule,
    CompetencyModule,
    PortfolioModule,

    // Course Management (Phase 2-A)
    CoursesModule,

    // Curriculum Builder (Phase 2-B)
    CurriculumModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
})
export class AppModule {}
