# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive test coverage for API (80 suites, 1,087 tests)
- Comprehensive test coverage for Web (8 suites, 96 tests)
- Handler tests for all API controllers
- Strategy tests for search and authentication
- Guard and interceptor tests
- React component tests with Vitest
- Interactive LMS demo route at `/demo`

### Changed
- Updated Next.js to 15 with React 19
- Updated NestJS to 10
- Improved documentation accuracy

### Fixed
- Documentation port numbers (Web: 3060, API: 4900)
- Node.js version requirements (20+)
- Test configuration for JWT strategy

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
