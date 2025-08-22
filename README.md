# AVALA

> **Alineamiento y Verificación de Aprendizajes y Logros Acreditables**
>
> Trainee‑first, multi‑tenant Learning & Competency Cloud aligned to EC/CONOCER, DC‑3/SIRCE (MX), and verifiable credentials.

<div align="center">

**Status:** pre‑alpha • **Monorepo:** backend + web + infra • **License:** © Innovaciones MADFAM S.A.S. de C.V. — All rights reserved

</div>

---

## 1) What is AVALA?

AVALA is a SaaS platform to **design, deliver, evidence, and verify applied learning** mapped to Mexico’s **Estándares de Competencia (EC/CONOCER)** and international best practices. It automates **DC‑3** issuance, prepares **SIRCE/LFT** reporting, and issues **Open Badges 3.0 / Verifiable Credentials**.

**Core modules**

* **Avala Learn** — paths, lessons, attendance, cmi5/xAPI tracking.
* **Avala Assess** — multi‑method evaluations, criterion‑level scoring, **Portfolio of Evidence**.
* **Avala Comply** — **DC‑3**, **SIRCE** exports, **LFT** plan snapshots.
* **Avala Badges** — Open Badges 3.0 / VC issuance & verification.
* **Avala Connect** — SSO/SCIM, HRIS & email/SMS integrations.

👉 See **[SOFTWARE\_SPEC.md](./SOFTWARE_SPEC.md)** for the detailed product spec.
👉 See **Standards & HR Alignment Brief** in `./docs/standards-hr-alignment.md`.

---

## 2) Quickstart (TL;DR)

### Prerequisites

* **Node.js** ≥ 20, **pnpm** ≥ 9 (or npm/yarn)
* **Docker** & **Docker Compose**
* **Make** (optional), **OpenSSL** for local keypair generation

### 2.1 Local setup

```bash
# 1) Clone
git clone https://your.git.server/madfam/avala.git && cd avala

# 2) Environment
cp .env.example .env
# (Optional) Generate keys for OB v3 / JWT
openssl genpkey -algorithm ed25519 -out ./keys/issuer.key
openssl pkey -in ./keys/issuer.key -pubout -out ./keys/issuer.pub

# 3) Infra (Postgres, Redis, MinIO, Mailhog)
docker compose up -d

# 4) Install & build
pnpm i
pnpm build

# 5) DB migrate & seed (creates admin@avala.local / changeme)
pnpm backend prisma migrate deploy
pnpm backend seed

# 6) Run all services (dev)
pnpm dev
```

**Default URLs**

* Web: `http://localhost:3000`
* API: `http://localhost:4000`
* LRS: `http://localhost:4000/xapi`
* Mailhog UI: `http://localhost:8025`
* MinIO Console: `http://localhost:9001`

Login: `admin@avala.local` • Password: `changeme` (rotate immediately)

---

## 3) Repository Layout

```
avala/
├─ apps/
│  ├─ web/                 # Next.js PWA (Avala Learn/Comply UI)
│  └─ backend/             # API (NestJS/Go), LRS endpoints, jobs
├─ packages/
│  ├─ ui/                  # Shared UI components
│  ├─ core/                # Domain models, validators, constants
│  └─ sdk/                 # TypeScript SDK for API & xAPI helpers
├─ infra/
│  ├─ docker/              # Compose, service images, init scripts
│  ├─ terraform/           # (Optional) Cloud IaC
│  └─ k8s/                 # (Optional) Helm manifests
├─ docs/
│  ├─ SOFTWARE_SPEC.md
│  └─ standards-hr-alignment.md
└─ .github/                # CI/CD, issue templates
```

---

## 4) Configuration

### 4.1 Environment variables (`.env`)

```bash
# Core
NODE_ENV=development
PORT=4000
WEB_URL=http://localhost:3000
API_URL=http://localhost:4000

# Database
DATABASE_URL=postgresql://avala:avala@localhost:5432/avala

# Cache/Queue
REDIS_URL=redis://localhost:6379

# Object storage (MinIO or S3)
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=avala-evidence
S3_ACCESS_KEY=avala
S3_SECRET_KEY=avala
S3_USE_PATH_STYLE=true

# Auth/SSO
JWT_SECRET=replace-me
OIDC_ISSUER=
OIDC_CLIENT_ID=
OIDC_CLIENT_SECRET=

# Email
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="Avala <no-reply@avala.local>"

# Open Badges / VC
OB_ISSUER_DID=did:web:localhost
OB_ISSUER_KID=did:web:localhost#keys-1
OB_PRIVATE_KEY_PATH=./keys/issuer.key
OB_PUBLIC_KEY_PATH=./keys/issuer.pub

# LRS (xAPI/cmi5)
LRS_BASIC_USER=lrs
LRS_BASIC_PASS=lrs
```

> See `infra/docker/.env.example` for container‑specific overrides.

### 4.2 Secrets

Use your secret manager (Doppler, 1Password, Vault, SSM) for prod. Never commit real keys.

---

## 5) Running Services

### Dev

```bash
pnpm dev            # web + backend with watch
pnpm web dev        # UI only
pnpm backend start:dev
```

### Build & run

```bash
pnpm build
pnpm start          # starts backend (API + LRS) & serves web
```

### Docker

```bash
docker compose up -d --build
```

---

## 6) Data & Migrations

* ORM: Prisma (if Node/Nest) or GORM/Ent (if Go).
* Apply migrations on boot; use **Git‑versioned** migration files.
* Seed scripts create: default tenant, admin user, base roles, demo EC import.

```bash
pnpm backend prisma migrate dev
pnpm backend seed
```

---

## 7) Key Domains (quick reference)

* **Standard / Element / Criterion** — EC structure (snapshot & version pinning).
* **Course / Lesson / Path** — authored content mapped to criteria.
* **Assessment / Attempt / Rubric** — multi‑method evaluation per criterion.
* **Artifact / Portfolio** — evidence with hash, signer, timestamp.
* **DC3 / LFTPlan / SIRCEExport** — compliance objects (MX).
* **Credential (OBv3/VC)** — verifiable credential payload & status.

See **SOFTWARE\_SPEC.md** §4 for the full data model.

---

## 8) API (glance)

* REST/JSON, OAuth2/OIDC; SCIM 2.0 (enterprise).
* Representative endpoints:

  * `GET /v1/ec/search?q=EC0217`
  * `POST /v1/courses`, `GET /v1/courses/{id}/coverage`
  * `POST /v1/assessments/{id}/attempts`, `POST /v1/artifacts`
  * `POST /v1/dc3`, `POST /v1/sirce/exports`
  * `POST /v1/credentials/obv3`, `GET /v1/credentials/verify/{id}`
  * `POST /v1/xapi/statements`, `POST /v1/cmi5/launch`

The **`packages/sdk`** provides typed clients & helpers.

---

## 9) Security, Privacy, Compliance

* **Tenancy & RLS**: per‑tenant row‑level security; org/site scoping.
* **Evidence integrity**: content‑addressed storage (SHA‑256), signed URLs.
* **Auditability**: immutable audit log; DC‑3 serial registry; SIRCE validators.
* **PII**: minimization, consent capture, retention policies (defaults: evidence 24m; DC‑3 & plans 5y).
* **Residency**: MX default; EU option (enterprise).

> Legal note: EC **certification** is issued only by **ECE/OC** via SII. AVALA prepares evidence and dictamen packages; it does **not** issue EC certificates unless accredited.

---

## 10) Testing & Quality

* **Unit**: validators, coverage calculator, DC‑3 schema, OBv3 signing/verify.
* **Integration**: enrollment→assessment→artifact→portfolio; DC‑3→SIRCE pipeline.
* **E2E**: Playwright/Cypress flows for trainee, assessor, compliance.
* **CI**: lint → test → build → scan → package; preview envs per PR.

Scripts:

```bash
pnpm test
pnpm lint
pnpm e2e
```

---

## 11) Observability

* Structured logs (pino/winston), request IDs, correlation IDs.
* Metrics (Prometheus/OpenTelemetry), health & readiness probes.
* Traces (OTel) for API & LRS.

---

## 12) Internationalization

* Primary **ES**, secondary **EN**; i18n keys in `packages/ui` & `apps/web`.
* Localized DC‑3 templates (ES‑MX); credentials/OB metadata bilingual where applicable.

---

## 13) Roadmap (public excerpt)

* v0.1: EC mapping, portfolios, DC‑3, SIRCE, basic analytics.
* v0.2: LRS (xAPI/cmi5), Open Badges 3.0 issuer/verify.
* v0.3: SCORM ingest (read‑only), ECE/OC toolkit, SCIM.

👉 Full roadmap lives in **SOFTWARE\_SPEC.md §13**.

---

## 14) Contributing

Internal contributors only (closed source). Use conventional commits. Open a PR with:

* Scope: `web`, `backend`, `sdk`, `infra`, `docs`
* Checklist: tests updated, migrations included, docs touched.

Issue templates and PR checklists live in `.github/`.

---

## 15) Security Policy

Report vulnerabilities to **[security@madfam.com](mailto:security@madfam.com)** (PGP key in `/SECURITY.md`). We commit to triage within 72h.

---

## 16) Acknowledgments

* Built by Innovaciones MADFAM S.A.S. de C.V. with love for trainees, assessors, and ops teams.

---

## 17) Legal

© Innovaciones MADFAM S.A.S. de C.V. All rights reserved.
“AVALA” is used as a trademark. DC‑3/SIRCE/LFT/CONOCER references are for interoperability; all rights belong to their respective holders.
