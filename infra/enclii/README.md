# Avala Enclii Infrastructure

Deployment configuration for Avala on Enclii PaaS.

## Overview

Avala deploys as two services:
- **avala-api** - NestJS backend (port 3000)
- **avala-web** - Next.js frontend (port 3000)

## Files

```
infra/enclii/
├── README.md              # This file
├── avala-api.yaml         # API service specification
├── avala-web.yaml         # Web service specification
└── secrets.template.yaml  # Secrets template (DO NOT commit actual values)
```

## Quick Start

### 1. Create the project in Enclii

```bash
enclii project create avala
```

### 2. Create secrets

```bash
# Production
kubectl create secret generic avala-secrets \
  --from-literal=database-url="postgres://user:pass@host:5432/avala?schema=public" \
  --from-literal=jwt-secret="$(openssl rand -base64 32)" \
  --from-literal=smtp-host="smtp.provider.com" \
  --from-literal=smtp-port="587" \
  --from-literal=smtp-user="apikey" \
  --from-literal=smtp-pass="your-smtp-password" \
  -n avala-production
```

### 3. Deploy services

```bash
# Create services from specs
enclii service create --file infra/enclii/avala-api.yaml
enclii service create --file infra/enclii/avala-web.yaml

# Deploy to production
enclii deploy --service avala-api --env production
enclii deploy --service avala-web --env production
```

### 4. Verify deployment

```bash
# Check status
enclii ps

# View logs
enclii logs avala-api -f
enclii logs avala-web -f

# Test health endpoints
curl https://api.avala.studio/health
curl https://avala.studio/api/health
```

## Health Endpoints

| Service | Endpoint | Purpose |
|---------|----------|---------|
| API | `/health` | Full health check (DB, memory) |
| API | `/health/live` | Liveness probe |
| API | `/health/ready` | Readiness probe |
| Web | `/api/health` | Web + API connectivity check |

## Environment Variables

### API (avala-api)

| Variable | Description | Source |
|----------|-------------|--------|
| `DATABASE_URL` | PostgreSQL connection string | Secret |
| `JWT_SECRET` | JWT signing key | Secret |
| `JWT_EXPIRES_IN` | Token expiration (default: 7d) | Config |
| `SMTP_HOST` | SMTP server host | Secret |
| `SMTP_PORT` | SMTP server port | Secret |
| `SMTP_USER` | SMTP username | Secret |
| `SMTP_PASS` | SMTP password | Secret |
| `SMTP_FROM` | Sender email address | Config |
| `NEXT_PUBLIC_APP_URL` | Frontend URL | Config |
| `NEXT_PUBLIC_API_URL` | API URL | Config |

### Web (avala-web)

| Variable | Description | Source |
|----------|-------------|--------|
| `NEXT_PUBLIC_API_URL` | API URL (build-time) | Build arg |
| `NEXT_PUBLIC_APP_URL` | App URL (build-time) | Build arg |

## Deployment Strategy

Both services use **canary deployments**:

1. **10% traffic** → 5 min pause → analyze metrics
2. **50% traffic** → 10 min pause → analyze metrics  
3. **100% traffic** → deployment complete

Auto-rollback triggers on:
- Error rate > 1%
- P99 latency > 500ms (API) / 300ms (Web)

## Domains

| Domain | Service | Notes |
|--------|---------|-------|
| `api.avala.studio` | avala-api | API endpoints |
| `avala.studio` | avala-web | Primary frontend |
| `www.avala.studio` | avala-web | Redirects to apex |

## Scaling

| Service | Min | Max | CPU Target | Memory Target |
|---------|-----|-----|------------|---------------|
| API | 2 | 10 | 70% | 80% |
| Web | 2 | 6 | 70% | 75% |

## Troubleshooting

### Check pod status
```bash
kubectl get pods -n avala-production
```

### View detailed logs
```bash
kubectl logs -f deployment/avala-api -n avala-production
```

### Run migrations manually
```bash
kubectl exec -it deployment/avala-api -n avala-production -- npx prisma migrate deploy
```

### Rollback deployment
```bash
enclii rollback --service avala-api --env production
```
