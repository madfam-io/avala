import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { DatabaseModule } from "./database/database.module";
import { TenantInterceptor } from "./common/interceptors/tenant.interceptor";
import { TenantModule } from "./modules/tenant/tenant.module";
import { UserModule } from "./modules/user/user.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CompetencyModule } from "./modules/competency/competency.module";
import { PortfolioModule } from "./modules/portfolio/portfolio.module";
import { CoursesModule } from "./modules/courses/courses.module";
import { CurriculumModule } from "./modules/curriculum/curriculum.module";
import { EnrollmentsModule } from "./modules/enrollments/enrollments.module";
import { CertificatesModule } from "./modules/certificates/certificates.module";
import { MailModule } from "./modules/mail/mail.module";
import { BillingModule } from "./modules/billing/billing.module";
import { QuizModule } from "./modules/quiz/quiz.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { GamificationModule } from "./modules/gamification/gamification.module";
import { RenecModule } from "./modules/renec/renec.module";
import { SimulationModule } from "./modules/ec-simulation/simulation.module";
import { CertificationModule } from "./modules/certification/certification.module";
import { SearchModule } from "./modules/search/search.module";

// Multi-EC Training System (Phase 7)
import { ECConfigModule } from "./modules/ec-config/ec-config.module";
import { ECTrainingModule } from "./modules/ec-training/ec-training.module";
import { ECPortfolioModule } from "./modules/ec-portfolio/ec-portfolio.module";
import { ECAssessmentModule } from "./modules/ec-assessment/ec-assessment.module";

/**
 * Root Application Module
 * Phase 0: Tenant foundation, RBAC, EC structure, Portfolios
 * Phase 1-A: Authentication & App Shell
 * Phase 2-A: Course Management & EC Alignment
 * Phase 2-B: Curriculum Structure (Modules & Lessons)
 * Phase 3-A: Enrollment & Learning Player
 * Phase 3-B: Compliance Engine (DC-3 Certificates)
 * Phase 5: Production Readiness (Mailer & Docker)
 */
@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),

    // Scheduling (for RENEC harvest cron jobs)
    ScheduleModule.forRoot(),

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

    // Enrollment & Progress (Phase 3-A)
    EnrollmentsModule,

    // DC-3 Certificates (Phase 3-B)
    CertificatesModule,

    // Email Notifications (Phase 5)
    MailModule,

    // Billing & Subscriptions (Phase 6)
    BillingModule,

    // Quiz & Assessment (Phase 4)
    QuizModule,

    // Document Templates & Editor (Phase 4)
    DocumentsModule,

    // Gamification System (Phase 4)
    GamificationModule,

    // RENEC Catalog (Phase 4)
    RenecModule,

    // EC Simulation Engine (Phase 7)
    SimulationModule,

    // DC-3 Certification Export (Phase 7)
    CertificationModule,

    // Global Search (Phase 7)
    SearchModule,

    // Multi-EC Training System (Phase 7)
    // Configuration-driven EC training for EC0249, EC0217, etc.
    ECConfigModule,
    ECTrainingModule,
    ECPortfolioModule,
    ECAssessmentModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
})
export class AppModule {}
