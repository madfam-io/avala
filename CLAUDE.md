# AVALA - CLAUDE.md

> **Alineamiento y Verificación de Aprendizajes y Logros Acreditables**

## Overview

**Status**: 🟡 Pre-Alpha (Foundation Phase)  
**Purpose**: Multi-tenant Learning & Competency Cloud for Mexico's EC/CONOCER standards  
**License**: © Innovaciones MADFAM S.A.S. de C.V. — All rights reserved  
**Domain**: TBD

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
pnpm backend prisma migrate deploy
pnpm backend seed  # Creates admin@avala.local / changeme

# 6. Run development
pnpm dev
```

---

## Project Structure

```
avala/
├── apps/
│   ├── api/              # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/  # Feature modules
│   │   │   ├── common/   # Shared utilities
│   │   │   └── config/   # Configuration
│   │   └── prisma/       # Database schema
│   └── web/              # Next.js frontend
│       ├── app/          # App Router pages
│       ├── components/   # React components
│       └── lib/          # Utilities
├── packages/
│   ├── client/           # API client SDK
│   └── db/               # Shared database types
├── keys/                 # Ed25519 keys for badges
├── docker-compose.yml    # Local infrastructure
└── .env.example          # Environment template
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
```

### Backend (NestJS)
```bash
cd apps/api

pnpm dev              # Start with hot reload (port 4900)
pnpm build            # Production build
pnpm test             # Unit tests
pnpm test:e2e         # E2E tests
pnpm test:cov         # Coverage report

# Database
pnpm prisma generate  # Generate Prisma client
pnpm prisma migrate dev --name <name>  # Create migration
pnpm prisma migrate deploy  # Apply migrations
pnpm prisma studio    # Database GUI
pnpm seed             # Seed initial data
```

### Frontend (Next.js)
```bash
cd apps/web

pnpm dev              # Start dev server (port 4901)
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # Lint code
```

---

## Port Allocation

| Service | Port | Description |
|---------|------|-------------|
| API | 4900 | NestJS backend |
| Web | 4901 | Next.js frontend |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache/Sessions |
| MinIO | 9000 | Object storage |
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
POST   /api/v1/auth/login
POST   /api/v1/auth/register

# Learning
GET    /api/v1/paths
POST   /api/v1/paths
GET    /api/v1/paths/:id/lessons
POST   /api/v1/lessons/:id/complete

# Assessment
POST   /api/v1/assessments
GET    /api/v1/assessments/:id/results
POST   /api/v1/evidence

# Compliance
POST   /api/v1/dc3/generate
GET    /api/v1/sirce/export
GET    /api/v1/training-plans

# Badges
POST   /api/v1/badges/issue
GET    /api/v1/badges/:id/verify
```

---

## Testing

```bash
# Backend unit tests
cd apps/api && pnpm test

# Backend E2E tests
cd apps/api && pnpm test:e2e

# Frontend tests
cd apps/web && pnpm test

# Full test suite
pnpm test
```

---

## Deployment

### Docker Compose (Development)
```bash
docker compose up -d
```

### Production (Enclii)
```bash
enclii deploy --service avala
```

### Environment Requirements
- PostgreSQL 15+
- Redis 7+
- MinIO or S3-compatible storage
- SMTP server

---

## Related Documentation

- **SOFTWARE_SPEC.md** - Detailed product specification
- **ALIGNMENT.md** - Standards & HR alignment brief
- **DC-3 Guide** - Mexican labor training compliance
- **Open Badges** - Credential issuance guide

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
