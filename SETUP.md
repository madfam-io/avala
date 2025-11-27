# AVALA Phase 0 Setup Guide

> **Status:** Phase 0 Complete - Foundation Ready
> **Date:** 2025-11-21

## 🎯 What's Implemented (Phase 0)

✅ **Monorepo Structure** (Turborepo)
- `apps/api` - NestJS backend with tenant isolation
- `apps/web` - Next.js frontend (placeholder)
- `packages/db` - Prisma schema & client
- `packages/ui` - Shared UI components (placeholder)
- `packages/core` - Domain models & validators (placeholder)
- `packages/sdk` - TypeScript SDK (placeholder)

✅ **Database Schema** (Prisma + PostgreSQL)
- Multi-tenant with Row-Level Security (RLS)
- RBAC (7 roles: ADMIN, INSTRUCTOR, ASSESSOR, etc.)
- Competency Standards (EC) structure: Standard → Element → Criterion
- Evidence Portfolios with hash-based integrity
- Complete domain models for Phase 0

✅ **Backend Architecture** (NestJS)
- Repository Pattern with automatic tenant scoping
- Tenant decorator & interceptor
- Modules: Tenant, User, Competency, Portfolio
- Swagger documentation at `/docs`
- Global validation & error handling

✅ **Infrastructure**
- Docker Compose with PostgreSQL, Redis, MinIO, Mailhog
- Environment configuration (.env.example)
- Seed script with sample EC (EC0217.01)

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)

### NPM Registry Configuration

AVALA uses MADFAM's private npm registry for internal packages. Configure your `.npmrc`:

```bash
# Add to ~/.npmrc
@madfam:registry=https://npm.madfam.io
@avala:registry=https://npm.madfam.io
@janua:registry=https://npm.madfam.io
//npm.madfam.io/:_authToken=${NPM_MADFAM_TOKEN}
```

Set the `NPM_MADFAM_TOKEN` environment variable with your registry token.

### 1. Clone & Install

```bash
# Already done if you're reading this!
cd avala

# Install dependencies
pnpm install
```

### 2. Start Infrastructure

```bash
# Start PostgreSQL, Redis, MinIO, Mailhog
cd infra/docker
docker compose up -d

# Verify services are running
docker compose ps
```

**Services:**
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- MinIO: `localhost:9000` (Console: `localhost:9001`)
- Mailhog UI: `localhost:8025`

### 3. Environment Setup

```bash
# Copy environment file
cp .env.example .env

# The default values work for local development
# Update if needed (JWT secrets, etc.)
```

### 4. Database Setup

```bash
# Generate Prisma client
cd packages/db
pnpm prisma generate

# Create initial migration
pnpm prisma migrate dev --name init

# Seed the database
pnpm db:seed
```

**Seeded Data:**
- Tenant: `madfam` (Innovaciones MADFAM)
- Users:
  - `admin@avala.local` (ADMIN)
  - `instructor@avala.local` (INSTRUCTOR)
  - `assessor@avala.local` (ASSESSOR)
  - `trainee@avala.local` (TRAINEE)
- EC Standard: EC0217.01 (Impartición de cursos)
  - 3 Elements
  - 10 Criteria
- 1 Sample Course
- 1 Learning Path
- 1 Portfolio

### 5. Run Development Server

```bash
# From project root
pnpm dev

# Or run API only
pnpm --filter @avala/api dev
```

**Access:**
- API: `http://localhost:4000/v1`
- Swagger Docs: `http://localhost:4000/docs`

---

## 🧪 Testing the API

### Get Tenant

```bash
# Get tenant by slug
curl http://localhost:4000/v1/tenants/slug/madfam
```

### List Users (with Tenant Header)

```bash
# Get the tenant ID from previous call
export TENANT_ID="<tenant-id-from-above>"

curl http://localhost:4000/v1/users \
  -H "X-Tenant-Id: $TENANT_ID"
```

### Search Competency Standards

```bash
curl "http://localhost:4000/v1/ec/search?q=EC0217" \
  -H "X-Tenant-Id: $TENANT_ID"
```

### Get EC Coverage

```bash
# Get standard ID from search
export EC_ID="<standard-id>"

curl "http://localhost:4000/v1/ec/$EC_ID/coverage" \
  -H "X-Tenant-Id: $TENANT_ID"
```

### Get Portfolio

```bash
# Get trainee ID from users list
export TRAINEE_ID="<trainee-id>"

curl "http://localhost:4000/v1/portfolios/trainee/$TRAINEE_ID" \
  -H "X-Tenant-Id: $TENANT_ID"
```

---

## 📊 Database Management

### Prisma Studio

```bash
# Visual database browser
pnpm db:studio

# Opens at http://localhost:5555
```

### Create New Migration

```bash
# After schema changes
cd packages/db
pnpm prisma migrate dev --name <migration-name>
```

### Reset Database

```bash
# WARNING: Deletes all data!
cd packages/db
pnpm prisma migrate reset
```

---

## 🏗️ Architecture Details

### Tenant Isolation Pattern

All API endpoints automatically scope queries to the tenant specified in the `X-Tenant-Id` header.

**Implementation:**
1. `@TenantId()` decorator extracts tenant from request
2. `createTenantClient(tenantId)` creates scoped Prisma client
3. All queries automatically filter by `tenantId`

**Example (UserService):**

```typescript
async findAll(tenantId: string): Promise<User[]> {
  const tenantClient = this.prisma.forTenant(tenantId);

  // Automatically filtered to tenantId
  return tenantClient.user.findMany({
    orderBy: { createdAt: 'desc' },
  });
}
```

### Repository Pattern

Each module follows the Repository Pattern:
- **Service**: Business logic + data access
- **Controller**: HTTP endpoints + validation
- **Module**: Dependency injection

**File Structure:**
```
modules/
├── tenant/
│   ├── tenant.module.ts
│   ├── tenant.service.ts      # Repository
│   └── tenant.controller.ts
├── user/
│   ├── user.module.ts
│   ├── user.service.ts
│   └── user.controller.ts
└── competency/
    ├── competency.module.ts
    ├── competency.service.ts
    └── competency.controller.ts
```

### Database Schema Highlights

**Multi-Tenancy:**
- Every tenant-scoped table has `tenantId` field
- Foreign keys with cascade deletes
- Indices on `[tenantId, ...]` for performance

**EC Structure:**
```
CompetencyStandard (EC)
  ↓ 1:N
Element
  ↓ 1:N
Criterion (Performance, Knowledge, Product, Attitude)
  ↓ M:N
Lesson (via LessonCriterion join table)
```

**Evidence Integrity:**
```typescript
{
  ref: "s3://bucket/evidence/file.pdf",
  hash: "sha256:abc123...",     // SHA-256 of content
  signerId: "uuid",             // Who verified it
  signedAt: "2025-11-21T10:00Z"
}
```

---

## 🔐 Security Notes

**Phase 0 Security:**
- ⚠️ Tenant ID currently from header (demo only)
- ⚠️ No authentication implemented yet
- ✅ Input validation (class-validator)
- ✅ Tenant isolation at ORM level
- ✅ Hash-based evidence integrity

**Phase 1 TODO:**
- JWT authentication
- RBAC guards per endpoint
- Rate limiting
- Audit logging

---

## 📋 Available Scripts

```bash
# Development
pnpm dev                    # Run all apps in dev mode
pnpm --filter @avala/api dev  # Run API only

# Build
pnpm build                  # Build all packages
pnpm --filter @avala/api build

# Database
pnpm db:generate            # Generate Prisma client
pnpm db:migrate             # Run migrations
pnpm db:seed                # Seed database
pnpm db:studio              # Open Prisma Studio

# Testing
pnpm test                   # Run tests
pnpm lint                   # Lint code

# Clean
pnpm clean                  # Remove all build artifacts
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :4000

# Kill it
kill -9 <PID>
```

### Database Connection Error

```bash
# Restart PostgreSQL
cd infra/docker
docker compose restart postgres

# Check logs
docker compose logs -f postgres
```

### Prisma Client Not Found

```bash
# Regenerate Prisma client
cd packages/db
pnpm prisma generate
```

### Migration Conflicts

```bash
# Reset and re-apply migrations
cd packages/db
pnpm prisma migrate reset
pnpm db:seed
```

---

## 📚 Next Steps (Phase 1)

- [ ] Next.js web app with App Router
- [ ] Authentication (JWT + SSO)
- [ ] DC-3 generation
- [ ] SIRCE export
- [ ] LFT Plan management
- [ ] File upload to MinIO
- [ ] Email notifications

---

## 📖 Documentation

- **Swagger API Docs**: http://localhost:4000/docs
- **Prisma Schema**: `packages/db/prisma/schema.prisma`
- **Software Spec**: `SOFTWARE_SPEC.md`
- **Alignment Doc**: `ALIGNMENT.md`

---

## 🆘 Support

For issues or questions:
1. Check `SOFTWARE_SPEC.md` for requirements
2. Review API docs at `/docs`
3. Inspect database with Prisma Studio
4. Check Docker logs: `docker compose logs -f`

---

**Phase 0 Status:** ✅ Complete
**Next Phase:** Phase 1 - DC-3, SIRCE, LFT Plans
**Team:** Innovaciones MADFAM S.A.S. de C.V.
