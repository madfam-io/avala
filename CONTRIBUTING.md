# Contributing to AVALA

Thank you for your interest in contributing to AVALA! This document provides guidelines for contributing to the project.

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm 9+
- Docker and Docker Compose
- Supabase CLI (optional)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/madfam/avala.git
cd avala

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Start development services
docker-compose up -d

# Run database migrations
pnpm db:push

# Start development server
pnpm dev
```

## Branch Strategy

We use a trunk-based development model:

- `main` - Production-ready code
- `feat/` - New features (e.g., `feat/open-badges-3`)
- `fix/` - Bug fixes
- `chore/` - Maintenance tasks
- `docs/` - Documentation updates

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Scopes:** `web`, `api`, `lrs`, `badges`, `dc3`, `sirce`, `ec`

## Pull Request Process

1. Create a branch from `main`
2. Make changes with clear commits
3. Write/update tests
4. Update documentation if needed
5. Open a PR with clear description
6. Request review and address feedback

### PR Checklist

- [ ] Tests pass (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Type checking passes (`pnpm typecheck`)
- [ ] Demo mode still works correctly
- [ ] Standards compliance maintained
- [ ] CHANGELOG.md updated for significant changes

## Code Standards

### TypeScript

- Strict mode enabled
- Explicit return types
- Use Zod for validation
- Bilingual string handling (ES/EN)

### Database

- Use Supabase/Prisma for operations
- Implement Row-Level Security (RLS) policies
- Document all data models

## Standards Compliance

AVALA integrates with Mexican education standards. When making changes:

### EC (Estándares de Competencia)

- Maintain CONOCER alignment
- Document competency mappings
- Version EC content properly

### DC-3

- Follow DC-3 format requirements
- Validate serial number generation
- Test SIRCE export compatibility

### Open Badges 3.0

- Comply with Open Badges specification
- Use proper JSON-LD contexts
- Implement verification endpoints

### xAPI/cmi5

- Follow xAPI statement structure
- Validate actor/verb/object
- Store in compliant LRS

## Evidence Handling

When working with learner evidence:

1. **Integrity** - Use SHA-256 for content addressing
2. **Chain of custody** - Log all evidence operations
3. **Privacy** - Follow consent requirements
4. **Retention** - Respect data retention policies

## Localization

AVALA is Spanish-first with English support:

- Primary language: Spanish (es-MX)
- Secondary: English (en-US)
- All user-facing strings must be translatable
- Use i18n library consistently

## Demo Mode

AVALA includes a demo mode. When making changes:

- Ensure demo mode continues to function
- Update mock data if new features added
- Test full demo flow before PR

## Security Guidelines

Education data requires careful handling:

- Follow PII protection guidelines
- Implement proper access controls
- Encrypt sensitive data
- Log audit events
- Report vulnerabilities to security@madfam.io

## Getting Help

- **Issues**: Open a GitHub issue
- **Discussions**: Use GitHub Discussions

## License

By contributing, you agree that your contributions will be licensed under the AGPL-3.0 license.
