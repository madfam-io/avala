# AVALA

> **Alineamiento y Verificación de Aprendizajes y Logros Acreditables**
>
> Trainee-first, multi-tenant Learning & Competency Cloud aligned to EC/CONOCER, DC-3/SIRCE (MX), and verifiable credentials.

<div align="center">

**Status:** Alpha • **Monorepo:** Turborepo + pnpm • **License:** © Innovaciones MADFAM S.A.S. de C.V. — All rights reserved

</div>

---

## What is AVALA?

AVALA is a SaaS platform to **design, deliver, evidence, and verify applied learning** mapped to Mexico's **Estándares de Competencia (EC/CONOCER)** and international best practices. It automates **DC-3** issuance, prepares **SIRCE/LFT** reporting, and issues **Open Badges 3.0 / Verifiable Credentials**.

### Core Modules

| Module | Description |
|--------|-------------|
| **Avala Learn** | Learning paths, lessons, attendance, cmi5/xAPI tracking |
| **Avala Assess** | Multi-method evaluations, criterion-level scoring, Portfolio of Evidence |
| **Avala Comply** | DC-3 generation, SIRCE exports, LFT plan snapshots |
| **Avala Badges** | Open Badges 3.0 / VC issuance & verification |
| **Avala Connect** | SSO/SCIM, HRIS & email/SMS integrations |

---

## Quick Start

### Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9
- **Docker** & **Docker Compose**

### NPM Registry Configuration

AVALA uses MADFAM's private npm registry. Configure your `.npmrc`:

```bash
@madfam:registry=https://npm.madfam.io
@avala:registry=https://npm.madfam.io
@janua:registry=https://npm.madfam.io
//npm.madfam.io/:_authToken=${NPM_MADFAM_TOKEN}
```

### Setup

```bash
# 1) Clone
git clone https://your.git.server/madfam/avala.git && cd avala

# 2) Environment
cp .env.example .env

# 3) Start infrastructure (Postgres, Redis, MinIO, Mailhog)
docker compose up -d

# 4) Install & build
pnpm install
pnpm build

# 5) Database setup
pnpm db:migrate
pnpm db:seed

# 6) Run development
pnpm dev
```

### Default URLs

| Service | URL | Description |
|---------|-----|-------------|
| Web | http://localhost:3060 | Next.js frontend |
| API | http://localhost:4900 | NestJS backend |
| API Docs | http://localhost:4900/docs | Swagger documentation |
| Mailhog | http://localhost:8025 | Email testing UI |
| MinIO | http://localhost:9001 | Object storage console |

**Default Login:** `admin@avala.local` / `changeme`

---

## Repository Structure

```
avala/
├── apps/
│   ├── api/                  # NestJS REST API
│   │   ├── src/modules/      # Feature modules (auth, courses, ec-*, etc.)
│   │   ├── src/common/       # Guards, interceptors, decorators
│   │   └── prisma/           # Database schema
│   └── web/                  # Next.js 14 PWA
│       ├── app/              # App Router pages
│       ├── components/       # React components
│       └── lib/              # Utilities & API client
├── packages/
│   ├── db/                   # Prisma schema & migrations
│   ├── client/               # TypeScript API client
│   ├── renec-client/         # RENEC integration client
│   ├── assessment-engine/    # Quiz & evaluation logic
│   └── document-engine/      # PDF generation (DC-3, certificates)
├── docs/                     # Documentation
│   ├── architecture/         # SOFTWARE_SPEC.md, ALIGNMENT.md
│   ├── setup/                # SETUP.md, DEPLOY.md
│   └── INDEX.md              # Documentation index
└── infra/                    # Docker, Terraform, K8s configs
```

---

## Development

### Scripts

```bash
# Development
pnpm dev                      # Run all apps in dev mode
pnpm dev --filter @avala/api  # API only
pnpm dev --filter @avala/web  # Web only

# Build & Test
pnpm build                    # Build all packages
pnpm test                     # Run all tests
pnpm lint                     # Lint all packages

# Database
pnpm db:generate              # Generate Prisma client
pnpm db:migrate               # Run migrations
pnpm db:seed                  # Seed database
pnpm db:studio                # Open Prisma Studio
```

### Test Coverage

| App | Test Suites | Tests | Coverage |
|-----|-------------|-------|----------|
| API | 80 | 1,087 | ~75% |
| Web | 8 | 96 | UI components |

```bash
# Run with coverage
cd apps/api && pnpm test:cov
cd apps/web && pnpm test:coverage
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| **API** | NestJS, TypeScript, Prisma ORM |
| **Database** | PostgreSQL 16 with Row-Level Security |
| **Cache** | Redis |
| **Storage** | S3-compatible (MinIO/AWS) |
| **Auth** | JWT + Janua SSO integration |
| **Testing** | Jest (API), Vitest (Web) |

---

## API Overview

### Authentication
```
POST /auth/login              # Email/password login
POST /auth/register           # User registration
GET  /auth/me                 # Current user profile
```

### EC Standards & Training
```
GET  /ec-standards            # List competency standards
POST /training/enroll         # Enroll in EC standard
GET  /training/enrollments    # User enrollments
PUT  /training/progress/:id   # Update lesson progress
```

### Portfolio & Assessment
```
GET  /portfolio/templates     # Document templates
POST /portfolio/documents     # Create document
POST /assessments/:id/attempt # Start assessment
```

### Compliance
```
POST /compliance/dc3          # Generate DC-3
POST /compliance/sirce        # Export SIRCE data
GET  /compliance/lft-plan     # Get LFT plan
```

See full API documentation at `/docs` when running the API.

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/INDEX.md](./docs/INDEX.md) | Documentation hub |
| [docs/architecture/SOFTWARE_SPEC.md](./docs/architecture/SOFTWARE_SPEC.md) | Full product specification |
| [docs/setup/SETUP.md](./docs/setup/SETUP.md) | Detailed setup guide |
| [docs/setup/DEPLOY.md](./docs/setup/DEPLOY.md) | Deployment guide |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Development guidelines |
| [SECURITY.md](./SECURITY.md) | Security policies |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |

---

## Mexican Compliance Standards

- **EC/CONOCER** — National competency standards alignment
- **DC-3** — Training completion certificates (STPS requirement)
- **SIRCE** — Government registry integration
- **LFT** — Federal Labor Law compliance

---

## Security

- **Multi-tenancy** with Row-Level Security
- **Evidence integrity** via SHA-256 content addressing
- **Audit logging** for all compliance operations
- **PII protection** with consent management

Report vulnerabilities to **security@madfam.io** — see [SECURITY.md](./SECURITY.md)

---

## License

© Innovaciones MADFAM S.A.S. de C.V. All rights reserved.

"AVALA" is a trademark. DC-3/SIRCE/LFT/CONOCER references are for interoperability; all rights belong to their respective holders.
