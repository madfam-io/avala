# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Enclii DevOps Infrastructure
- Enclii PaaS deployment configuration (`.enclii.yml`)
- Service specifications for API and Web (`infra/enclii/`)
- Health check endpoints for Kubernetes probes
  - API: `/health`, `/health/live`, `/health/ready`
  - Web: `/api/health`
- Canary deployment strategy with auto-rollback
- Secrets template for production deployment
- Comprehensive deployment documentation

#### Marketing Pages
- Registration page (`/registro`)
- Pricing page with plans and FAQ (`/precios`)
- Contact page with form (`/contacto`)
- Legal pages: Privacy (`/privacidad`), Terms (`/terminos`), Cookies (`/cookies`)
- Status page (`/status`)
- Coming soon placeholders for product and solution pages
- Reusable `ComingSoon` component

#### Interactive Demo System
- Multi-role demo at `/demo` with four user personas
- **HR Manager view** - Compliance dashboard, DC-3 tracking, team oversight
- **Instructor view** - Course management, assessments, student progress
- **Trainee view** - Learning progress, credentials, gamification (XP, levels, achievements)
- **Executive view** - ROI analytics, compliance metrics, strategic reports
- Role switcher component for seamless persona navigation
- Guided tour overlay with role-specific onboarding
- Contextual CTAs for conversion optimization
- Shared demo data seed (tenant, users, courses, enrollments, DC-3s, credentials)

#### Test Coverage
- Comprehensive API test coverage (80 suites, 1,087 tests)
- Web component tests (8 suites, 96 tests)
- Handler tests for all API controllers
- Strategy tests for search and authentication
- Guard and interceptor tests
- React component tests with Vitest

#### E2E Testing
- DC-3 generation E2E flow tests
- SIRCE export E2E flow tests
- Open Badges 3.0 issuance E2E tests

### Changed
- Updated Next.js to 15.1.6
- Updated React to 18.3.1
- Updated NestJS to 10.4.15
- Updated TypeScript to 5.7.2
- Improved documentation organization and cross-linking
- Enhanced README with current tech stack and features
- Updated CLAUDE.md with comprehensive quick reference
- Reorganized docs/INDEX.md as central documentation hub

### Fixed
- `/explorar` standards listing - fixed API endpoint mismatch and response format
- Replaced `avala.mx` references with `avala.studio`
- Removed placeholder social media links from footer
- Documentation port numbers (Web: 3060, API: 4900)
- Node.js version requirements (20+)
- Test configuration for JWT strategy
- Unused import lint errors in demo components
- Next.js 15 async params handling in dynamic routes

### Documentation
- Created docs/DEMO.md for interactive demo system
- Updated all documentation with accurate version numbers
- Added cross-links between related documentation files
- Improved API endpoint documentation

## [0.1.0] - 2024-11-27

### Added
- **AVALA** - Learning & Competency Management Platform
- Mexican education standards alignment (EC/CONOCER)
- DC-3 training record management
- SIRCE export functionality
- Open Badges 3.0 credential issuance
- Verifiable Credentials support
- xAPI/cmi5 learning record store
- Competency mapping to national standards
- Portfolio evidence management
- Course and module management
- Assessment and evaluation tools
- Certificate generation
- Bilingual interface (Spanish primary, English)
- Janua billing and email integration
- RENEC integration for EC standards

### Standards Compliance
- EC (Estándares de Competencia) mapping
- CONOCER certification alignment
- DC-3 format compliance
- SIRCE registry integration
- Open Badges 3.0 specification
- W3C Verifiable Credentials

### Technical
- Next.js 15 with App Router and React 19
- NestJS 10 with Prisma ORM
- PostgreSQL 15+ with row-level security
- Redis for caching and sessions
- SHA-256 content-addressed storage
- Turborepo monorepo with pnpm workspaces
- Docker containerization
- GitHub Actions CI/CD

### Security
- Row-level security (RLS) policies
- Evidence integrity verification
- Audit log immutability
- PII handling with consent management
- Mexico data residency by default

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| Unreleased | - | Interactive demo, E2E tests, documentation overhaul |
| 0.1.0 | 2024-11-27 | Initial release with EC/CONOCER, DC-3, Open Badges |

---

## Migration Notes

### From Pre-Alpha to 0.1.0
- Database schema stabilized
- API endpoints finalized
- Authentication flow complete

### Upcoming in Next Release
- Enhanced gamification features
- Advanced analytics dashboard
- Mobile app (React Native)
- Additional EC standards support
