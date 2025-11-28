# AVALA Documentation

> *Alineamiento y Verificación de Aprendizajes y Logros Acreditables*
> 
> Multi-tenant Learning & Competency Cloud aligned to EC/CONOCER, DC-3/SIRCE (MX), and verifiable credentials.

## Quick Navigation

| Document | Description |
|----------|-------------|
| [README](../README.md) | Project overview and quickstart |
| [CHANGELOG](../CHANGELOG.md) | Version history and changes |
| [CONTRIBUTING](../CONTRIBUTING.md) | Development guidelines |
| [SECURITY](../SECURITY.md) | Security policies |
| [CLAUDE.md](../CLAUDE.md) | AI assistant configuration |

## Architecture

| Document | Description |
|----------|-------------|
| [SOFTWARE_SPEC](architecture/SOFTWARE_SPEC.md) | Full product specification |
| [ALIGNMENT](architecture/ALIGNMENT.md) | Standards & HR alignment brief |
| [MULTI_EC_ARCHITECTURE](MULTI_EC_ARCHITECTURE.md) | Multi-EC training system design |

## Setup & Deployment

| Document | Description |
|----------|-------------|
| [Setup Guide](setup/SETUP.md) | Installation and configuration |
| [Deployment Guide](setup/DEPLOY.md) | Production deployment |

## Migration & Integration

| Document | Description |
|----------|-------------|
| [RENEC Integration](INTEGRATION_PLAN_RENEC_EC0249.md) | RENEC/EC0249 integration plan |
| [Feature Parity](FEATURE_PARITY_VALIDATION.md) | Multi-EC migration validation |

## Core Modules

### Avala Learn
- **Paths & Courses** - EC-aligned learning paths with criterion coverage
- **Lessons** - Video, text, interactive content delivery
- **Progress Tracking** - xAPI/cmi5 compliant tracking
- **Offline Support** - PWA with background sync

### Avala Assess
- **Multi-Method Evaluation** - Quiz, observation, interview, task check-off
- **Portfolio of Evidence** - Hash-verified artifacts with signatures
- **Rubrics** - Criterion-level scoring with inter-rater metrics

### Avala Comply
- **DC-3 Generation** - Official constancias with serial/folio
- **SIRCE Export** - STPS-ready reports
- **LFT Plans** - Immutable training plan snapshots

### Avala Badges
- **Open Badges 3.0** - Verifiable credentials issuance
- **EC Alignment** - Credentials linked to competency evidence
- **Verification** - QR code and API verification

### Avala Connect
- **SSO/SCIM** - Enterprise identity integration
- **HRIS Sync** - Employee data synchronization
- **Webhooks** - Event-driven integrations

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| **API** | NestJS, TypeScript, Prisma ORM |
| **Database** | PostgreSQL 15+ with Row-Level Security |
| **Cache/Queue** | Redis |
| **Storage** | S3-compatible (MinIO/AWS) |
| **LRS** | Built-in xAPI/cmi5 endpoints |

## Repository Structure

```
avala/
├── apps/
│   ├── api/           # NestJS REST API
│   ├── web/           # Next.js PWA frontend
│   └── backend/       # Legacy/migration (deprecated)
├── packages/
│   ├── db/            # Prisma schema & migrations
│   ├── client/        # TypeScript API client
│   ├── renec-client/  # RENEC integration client
│   ├── assessment-engine/  # Quiz & evaluation logic
│   └── document-engine/    # PDF generation
├── docs/              # Documentation
└── infra/             # Docker, Terraform, K8s
```

## API Overview

### EC Standards & Training
```
GET  /ec-standards              # List available standards
GET  /ec-standards/:id          # Get standard with modules
POST /ec-standards/:id/clone    # Clone standard configuration
```

### Enrollments & Progress
```
POST /training/enroll           # Enroll in EC standard
GET  /training/enrollments      # List user enrollments
PUT  /training/progress/:id     # Update lesson progress
```

### Portfolio & Documents
```
GET  /portfolio/templates       # Get document templates
POST /portfolio/documents       # Create portfolio document
PUT  /portfolio/documents/:id   # Update document
POST /portfolio/documents/:id/submit  # Submit for review
```

### Assessments
```
GET  /assessments/:standardId   # List assessments
POST /assessments/:id/attempt   # Start assessment attempt
POST /assessments/:id/submit    # Submit answers
```

## Development

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- pnpm 9+
- Docker & Docker Compose

### Quick Start
```bash
# Clone and setup
git clone <repo> && cd avala
cp .env.example .env

# Start infrastructure
docker compose up -d

# Install and build
pnpm install
pnpm build

# Run migrations and seed
pnpm db:migrate
pnpm db:seed

# Start development
pnpm dev
```

### Default URLs
- Web: http://localhost:3000
- API: http://localhost:4000
- Mailhog: http://localhost:8025
- MinIO: http://localhost:9001

---

*Last updated: November 2024*
