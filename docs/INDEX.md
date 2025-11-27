# Avala Documentation

> *Standards-compliant certification and credentialing platform*

## Quick Navigation

| Document | Description |
|----------|-------------|
| [README](../README.md) | Project overview and quick start |
| [CHANGELOG](../CHANGELOG.md) | Version history and changes |
| [CONTRIBUTING](../CONTRIBUTING.md) | Development guidelines |
| [SECURITY](../SECURITY.md) | Security policies |

## Architecture

| Document | Description |
|----------|-------------|
| [Architecture](architecture/) | System design documentation |

## Setup & Configuration

| Document | Description |
|----------|-------------|
| [Setup Guide](setup/) | Installation and configuration |

## Migration

| Document | Description |
|----------|-------------|
| [PSWGlobal Replacement](REPLACE_PSWGLOBAL.md) | Migration from legacy system |

## Core Features

### Certification Management
- **Certificate Issuance** - Digital certificate generation
- **Credential Verification** - QR code and API verification
- **Revocation Support** - Certificate lifecycle management

### Standards Compliance
| Standard | Description |
|----------|-------------|
| **EC3** | European Construction Certification |
| **DC-3** | Mexican Labor Competency (SEP/CONOCER) |
| **Open Badges 3.0** | IMS Global digital credentials |
| **xAPI** | Learning experience tracking |
| **CLR** | Comprehensive Learner Record |

### Evidence Management
- **Document Storage** - Secure evidence repository
- **Hash Verification** - Tamper-proof evidence integrity
- **Audit Trail** - Complete verification history

### Localization
- **Multi-language** - Spanish, English, Portuguese
- **Regional Compliance** - Mexico, EU, US standards
- **Currency Support** - Regional pricing

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Node.js, PostgreSQL
- **PDF Generation**: Custom certificate templates
- **Verification**: QR codes, blockchain anchoring (optional)

## MADFAM Ecosystem Integration

| App | Integration |
|-----|-------------|
| [Fortuna](../../fortuna) | Proposal certifications |
| [Forgesight](../../forgesight) | Team certifications |
| [Dhanam](../../dhanam) | Certification revenue tracking |

## API Overview

### Certificate API
```
POST /api/certificates      # Issue certificate
GET  /api/certificates/:id  # Get certificate
POST /api/verify            # Verify certificate
```

### Evidence API
```
POST /api/evidence          # Upload evidence
GET  /api/evidence/:id      # Get evidence
```

## Development

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- pnpm 8+

### Quick Start
```bash
pnpm install
pnpm dev
```

---

*Last updated: November 2025*
