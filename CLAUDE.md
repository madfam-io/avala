# AVALA - CLAUDE.md

> **Alineamiento y Verificación de Aprendizajes y Logros Acreditables**

## Overview

**Status**: 🟡 Pre-Alpha (Foundation Phase)  
**Purpose**: Multi-tenant Learning & Competency Cloud for Mexico's EC/CONOCER standards  
**License**: © Innovaciones MADFAM S.A.S. de C.V. — All rights reserved

AVALA is a SaaS platform to **design, deliver, evidence, and verify applied learning** mapped to Mexico's Estándares de Competencia (EC/CONOCER) and international standards. It automates DC-3 issuance, SIRCE/LFT reporting, and issues Open Badges 3.0 / Verifiable Credentials.

---

## Quick Start

```bash
# Prerequisites: Node.js ≥20, pnpm ≥9, Docker

# 1. Clone and setup
cd avala
cp .env.example .env

# 2. Generate keys (for Open Badges / JWT)
openssl genpkey -algorithm ed25519 -out ./keys/issuer.key
openssl pkey -in ./keys/issuer.key -pubout -out ./keys/issuer.pub

# 3. Start infrastructure
docker compose up -d

# 4. Install and build
pnpm install
pnpm build

# 5. Database setup
pnpm db:migrate
pnpm db:seed  # Creates admin@avala.local / changeme

# 6. Run development
pnpm dev
```

---

## Project Structure

```
avala/
├── apps/
│   ├── api/              # NestJS backend (port 4900)
│   │   ├── src/
│   │   │   ├── modules/  # Feature modules
│   │   │   ├── common/   # Shared utilities
│   │   │   └── config/   # Configuration
│   │   └── test/         # Test utilities
│   └── web/              # Next.js frontend (port 3060)
│       ├── app/          # App Router pages
│       ├── components/   # React components
│       └── lib/          # Utilities
├── packages/
│   ├── db/               # Prisma schema & migrations
│   ├── client/           # TypeScript API client
│   ├── renec-client/     # RENEC integration client
│   ├── assessment-engine/# Quiz & evaluation logic
│   └── document-engine/  # PDF generation
├── docs/                 # Documentation
├── keys/                 # Ed25519 keys for badges
└── docker-compose.yml    # Local infrastructure
```

---

## Development Commands

### Monorepo (from root)
```bash
pnpm install          # Install all dependencies
pnpm dev              # Run all apps in dev mode
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm test             # Run all tests
pnpm typecheck        # Type check all packages
```

### API (NestJS)
```bash
pnpm --filter api dev           # Start with hot reload (port 4900)
pnpm --filter api build         # Production build
pnpm --filter api test          # Unit tests (80 suites, 1,087 tests)
pnpm --filter api test:e2e      # E2E tests
pnpm --filter api test:cov      # Coverage report
```

### Web (Next.js)
```bash
pnpm --filter web dev           # Start dev server (port 3060)
pnpm --filter web build         # Production build
pnpm --filter web start         # Start production server
pnpm --filter web test          # Unit tests (8 suites, 96 tests)
```

### Database
```bash
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Apply migrations (dev)
pnpm db:push          # Push schema changes
pnpm db:seed          # Seed initial data
pnpm db:studio        # Database GUI
```

---

## Port Allocation

| Service | Port | Description |
|---------|------|-------------|
| Web | 3060 | Next.js frontend |
| API | 4900 | NestJS backend |
| API Docs | 4900/api | Swagger documentation |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache/Sessions |
| MinIO | 9000 | Object storage |
| MinIO Console | 9001 | MinIO admin UI |
| Mailhog | 8025 | Email testing UI |

---

## Core Modules

### Avala Learn
- Learning paths and lessons
- Attendance tracking
- cmi5/xAPI integration
- Progress analytics

### Avala Assess
- Multi-method evaluations
- Criterion-level scoring
- Portfolio of Evidence management
- Rubric builder

### Avala Comply
- **DC-3** form generation (Mexican labor training)
- **SIRCE** export (Sistema de Registro y Control)
- **LFT** plan snapshots (Ley Federal del Trabajo)
- Audit trails

### Avala Badges
- Open Badges 3.0 / Verifiable Credentials
- Ed25519 signing
- Public verification endpoints
- Badge analytics

### Avala Connect
- SSO/SCIM integration (via Janua)
- HRIS connectors
- Email/SMS notifications
- Webhook system

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://avala:avala@localhost:5432/avala

# Redis
REDIS_URL=redis://localhost:6379

# JWT/Auth
JWT_SECRET=your-secret-key
JWT_EXPIRATION=3600

# Open Badges
BADGE_ISSUER_KEY_PATH=./keys/issuer.key
BADGE_ISSUER_PUBLIC_KEY_PATH=./keys/issuer.pub
BADGE_ISSUER_ID=https://avala.example.com

# Storage (MinIO)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=avala

# Email
SMTP_HOST=localhost
SMTP_PORT=1025
```

---

## Testing

### API Tests
```bash
# Run all API tests
pnpm --filter api test

# Run with coverage
pnpm --filter api test:cov

# Run specific test file
pnpm --filter api test auth.controller.spec.ts

# Watch mode
pnpm --filter api test:watch
```

**Coverage**: 80 test suites, 1,087 tests
- Statements: 74.75%
- Branches: 60.53%
- Functions: 75.39%
- Lines: 75.62%

### Web Tests
```bash
# Run all web tests
pnpm --filter web test

# Run with UI
pnpm --filter web test:ui
```

**Coverage**: 8 test suites, 96 tests

---

## NPM Registry

AVALA uses MADFAM's private npm registry:

```bash
# Add to .npmrc
@madfam:registry=https://npm.madfam.io
@avala:registry=https://npm.madfam.io
@janua:registry=https://npm.madfam.io
//npm.madfam.io/:_authToken=${NPM_MADFAM_TOKEN}
```

---

## Mexican Compliance Standards

### EC/CONOCER
- **Estándares de Competencia** - National competency standards
- Mapped to specific job functions
- Validated by certified assessors

### DC-3 (Constancia de Competencias)
- Proof of training completion
- Required by STPS (Secretaría del Trabajo)
- Auto-generated from assessment results

### SIRCE
- Online registration system for training
- Export format for STPS compliance
- Batch upload support

### LFT Compliance
- Training plan documentation
- Annual training requirements
- Worker skill development tracking

---

## API Endpoints (Preview)

```
# Authentication
POST   /auth/login
POST   /auth/register
POST   /auth/refresh

# EC Standards
GET    /ec-standards
GET    /ec-standards/:id
POST   /ec-standards/:id/clone

# Training & Progress
POST   /training/enroll
GET    /training/enrollments
PUT    /training/progress/:id

# Portfolio
GET    /portfolio/templates
POST   /portfolio/documents
POST   /portfolio/documents/:id/submit

# Assessments
GET    /assessments/:standardId
POST   /assessments/:id/attempt
POST   /assessments/:id/submit

# Compliance
POST   /dc3/generate
GET    /sirce/export

# Badges
POST   /badges/issue
GET    /badges/:id/verify
```

---

## Deployment

### Docker Compose (Development)
```bash
docker compose up -d
```

### Production
See [Deployment Guide](docs/setup/DEPLOY.md)

### Environment Requirements
- PostgreSQL 15+
- Redis 7+
- MinIO or S3-compatible storage
- SMTP server

---

## Related Documentation

| Document | Description |
|----------|-------------|
| [INDEX](docs/INDEX.md) | Documentation hub |
| [SOFTWARE_SPEC](docs/architecture/SOFTWARE_SPEC.md) | Detailed product specification |
| [ALIGNMENT](docs/architecture/ALIGNMENT.md) | Standards & HR alignment brief |
| [SETUP](docs/setup/SETUP.md) | Installation guide |
| [CONTRIBUTING](CONTRIBUTING.md) | Development guidelines |

---

## Key Concepts

| Term | Description |
|------|-------------|
| **Trainee** | Person receiving training/certification |
| **Assessor** | Certified evaluator (EC/CONOCER certified) |
| **Evidence** | Documentation proving competency |
| **Competency Standard** | Official EC/CONOCER specification |
| **Badge** | Verifiable credential (Open Badges 3.0) |

---

*AVALA - The Human Standard | Verification for Applied Learning*
