# AVALA Architecture Overview

> High-level system architecture and design principles.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │   Web App    │  │  Mobile App  │  │   LTI Tool   │  │  HRIS/SSO  │  │
│  │  (Next.js)   │  │   (Future)   │  │   (Future)   │  │   (Janua)  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  │
└─────────┼─────────────────┼─────────────────┼────────────────┼──────────┘
          │                 │                 │                │
          └─────────────────┴────────┬────────┴────────────────┘
                                     │
                              ┌──────▼──────┐
                              │   API GW    │
                              │  (NestJS)   │
                              └──────┬──────┘
                                     │
┌────────────────────────────────────┼────────────────────────────────────┐
│                              API LAYER                                   │
│  ┌─────────────────────────────────┴─────────────────────────────────┐  │
│  │                        NestJS Application                          │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐  │  │
│  │  │  Auth   │ │ Courses │ │Training │ │ Assess  │ │  Compliance │  │  │
│  │  │ Module  │ │ Module  │ │ Module  │ │ Module  │ │   Module    │  │  │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └──────┬──────┘  │  │
│  │       │           │           │           │             │          │  │
│  │  ┌────┴───────────┴───────────┴───────────┴─────────────┴──────┐  │  │
│  │  │                      Prisma ORM                              │  │  │
│  │  └──────────────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────┬───────────────────────────────────┘
                                       │
┌──────────────────────────────────────┼───────────────────────────────────┐
│                            DATA LAYER                                     │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────┐  │
│  │  PostgreSQL   │  │    Redis      │  │    MinIO      │  │   xAPI    │  │
│  │   (Primary)   │  │   (Cache)     │  │  (Storage)    │  │   (LRS)   │  │
│  │   + RLS       │  │  + Sessions   │  │  + Evidence   │  │           │  │
│  └───────────────┘  └───────────────┘  └───────────────┘  └───────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Design Principles

### 1. Multi-Tenancy First
- Row-Level Security (RLS) at database level
- Tenant isolation in all queries
- Tenant-scoped configurations

### 2. EC-Agnostic Architecture
- Configuration-driven competency standards
- Pluggable assessment types
- Flexible evidence schemas

### 3. Compliance by Design
- Immutable audit trails
- Hash-verified evidence integrity
- Mexican standards alignment (DC-3, SIRCE, LFT)

### 4. Learner-Centric Experience
- Progressive disclosure
- Gamification integration
- Offline-capable (PWA)

---

## Module Architecture

### API Modules (`apps/api/src/modules/`)

```
modules/
├── auth/                 # Authentication & authorization
│   ├── strategies/       # JWT, local strategies
│   ├── guards/           # Auth guards
│   └── decorators/       # @CurrentUser, @Roles
├── users/                # User management
├── tenants/              # Multi-tenant management
├── courses/              # Course CRUD & management
├── ec-standards/         # Competency standard definitions
├── ec-training/          # Training enrollments & progress
├── ec-portfolio/         # Evidence portfolio management
├── ec-assessment/        # Assessments & evaluations
├── compliance/           # DC-3, SIRCE, LFT
│   ├── dc3/              # DC-3 generation
│   ├── sirce/            # SIRCE export
│   └── lft/              # LFT plan management
├── badges/               # Open Badges 3.0
├── xapi/                 # xAPI/cmi5 LRS
├── notifications/        # Email, SMS
└── integrations/         # External systems
    ├── janua/            # SSO & billing
    └── renec/            # RENEC standards
```

### Web Structure (`apps/web/app/`)

```
app/
├── (auth)/               # Authentication routes
│   ├── login/
│   └── registro/
├── (dashboard)/          # Authenticated routes
│   ├── dashboard/        # Main dashboard
│   ├── courses/          # Course management
│   ├── training/         # EC training
│   │   └── [standardId]/ # Standard-specific training
│   ├── compliance/       # DC-3, SIRCE
│   └── settings/         # User settings
├── (marketing)/          # Public marketing
│   └── page.tsx          # Landing page
├── (public)/             # Public pages
│   ├── explorar/         # Course catalog
│   └── verify/           # Certificate verification
└── demo/                 # Interactive demo
    ├── [role]/           # Role-specific views
    └── _components/      # Demo components
```

---

## Data Model (Simplified)

### Core Entities

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Tenant    │───────│    User     │───────│    Role     │
└─────────────┘       └─────────────┘       └─────────────┘
      │                     │
      │               ┌─────┴─────┐
      │               │           │
┌─────▼─────┐   ┌─────▼─────┐   ┌─▼───────────┐
│  Course   │   │Enrollment │   │  Portfolio  │
└─────┬─────┘   └─────┬─────┘   │  Document   │
      │               │         └─────────────┘
┌─────▼─────┐   ┌─────▼─────┐
│  Module   │   │ Progress  │
└─────┬─────┘   └───────────┘
      │
┌─────▼─────┐   ┌─────────────┐   ┌─────────────┐
│  Lesson   │   │ Assessment  │───│   DC3       │
└───────────┘   └─────────────┘   └─────────────┘
```

### Competency Mapping

```
┌─────────────────┐
│  EC Standard    │ (e.g., EC0217.01)
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌───▼───┐
│Element│ │Element│ (e.g., E1, E2, E3)
└───┬───┘ └───────┘
    │
┌───▼────────┐
│ Criterion  │ (36 criteria)
└────────────┘
    │
    ├── mapped to → Course/Lesson
    ├── evaluated by → Assessment
    └── evidenced in → Portfolio Document
```

---

## Authentication & Authorization

### Auth Flow

```
┌──────────┐      ┌───────────┐      ┌──────────┐
│  Client  │──────│   API     │──────│ Janua    │
│  (Web)   │      │ (NestJS)  │      │  (SSO)   │
└────┬─────┘      └─────┬─────┘      └────┬─────┘
     │                  │                 │
     │ 1. Login         │                 │
     ├─────────────────►│                 │
     │                  │ 2. Validate     │
     │                  ├────────────────►│
     │                  │◄────────────────┤
     │                  │ 3. JWT Token    │
     │◄─────────────────┤                 │
     │                  │                 │
     │ 4. API Request   │                 │
     │ + Bearer Token   │                 │
     ├─────────────────►│                 │
     │                  │ 5. Validate JWT │
     │                  │ 6. Check RLS    │
     │◄─────────────────┤                 │
     │ 7. Response      │                 │
```

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **Admin** | Full tenant management |
| **HR Manager** | User management, compliance, reports |
| **Instructor** | Course delivery, assessments |
| **Assessor** | Evidence evaluation, certification |
| **Trainee** | Learning, portfolio, credentials |

---

## Compliance Architecture

### DC-3 Generation Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Assessment  │────►│   DC3 Gen    │────►│    DC3       │
│  Completion  │     │   Service    │     │  Document    │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                     ┌──────▼───────┐
                     │  Validation  │
                     │  - Serial #  │
                     │  - Folio     │
                     │  - Signature │
                     └──────────────┘
```

### SIRCE Export

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   DC3 Data   │────►│  SIRCE Gen   │────►│  XML/CSV     │
│   + Users    │     │   Service    │     │   Export     │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## Evidence Integrity

### Content-Addressed Storage

```
Evidence Upload Flow:
┌────────────┐     ┌────────────────┐     ┌────────────┐
│   File     │────►│  SHA-256 Hash  │────►│   MinIO    │
│  Upload    │     │  Generation    │     │  Storage   │
└────────────┘     └───────┬────────┘     └────────────┘
                           │
                    ┌──────▼──────┐
                    │  Metadata   │
                    │  + Hash     │
                    │  + Chain    │
                    └─────────────┘
```

### Audit Trail

All evidence operations are logged with:
- Timestamp (UTC)
- Actor (user ID)
- Action (create, update, submit, approve)
- Hash (before/after)
- Tenant context

---

## Integration Points

### External Systems

| System | Integration Type | Purpose |
|--------|------------------|---------|
| Janua | OAuth 2.0 / SSO | Authentication, billing |
| RENEC | REST API | EC standard import |
| SIRCE | File Export | Government reporting |
| SMTP | SMTP | Email notifications |
| SMS | API | SMS notifications |

### Webhook Events

```
training.enrolled
training.completed
assessment.submitted
assessment.passed
dc3.generated
badge.issued
```

---

## Performance Considerations

### Caching Strategy

| Data | Cache | TTL |
|------|-------|-----|
| EC Standards | Redis | 24h |
| User Sessions | Redis | 1h |
| Course Catalog | Redis | 1h |
| Static Assets | CDN | 7d |

### Database Optimization

- Indexes on tenant_id, user_id, created_at
- Materialized views for analytics
- Connection pooling (PgBouncer)
- Query optimization for RLS

---

## Related Documentation

- [SOFTWARE_SPEC.md](./SOFTWARE_SPEC.md) - Full product specification
- [ALIGNMENT.md](./ALIGNMENT.md) - Standards alignment
- [MULTI_EC_ARCHITECTURE.md](../MULTI_EC_ARCHITECTURE.md) - Multi-EC design
- [docs/INDEX.md](../INDEX.md) - Documentation hub

---

*Last updated: November 2024*
