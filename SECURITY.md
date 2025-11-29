# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in AVALA, please report it responsibly:

1. **DO NOT** create a public GitHub issue
2. Email security@madfam.io with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes

We will acknowledge receipt within 48 hours and provide a detailed response within 7 days.

## Security Measures

### Authentication & Authorization

- **Janua SSO Integration**: Primary authentication via Janua identity provider
- **Role-Based Access**: Learner, Instructor, Admin, Certifier roles
- **Organization Boundaries**: Multi-tenant data isolation
- **Session Management**: Secure HTTP-only cookies with rotation

### Data Protection

- **Transport Security**: TLS 1.3 enforced for all connections
- **Database Encryption**: PostgreSQL with encryption at rest
- **Row-Level Security**: Supabase RLS policies enforce data boundaries
- **Evidence Storage**: SHA-256 content-addressed storage for integrity
- **PII Encryption**: Personal data encrypted with tenant-specific keys

### Credential Security

- **Open Badges 3.0**: Cryptographically signed badges
- **Verifiable Credentials**: W3C VC standard compliance
- **Certificate Integrity**: Digital signatures on all issued certificates
- **Revocation Support**: Credential revocation lists maintained

### Learning Record Security

- **xAPI/cmi5 Compliance**: Standards-compliant learning record store
- **Statement Validation**: All xAPI statements validated before storage
- **Actor Verification**: Learner identity verification on statements
- **Data Minimization**: Only necessary learning data collected

### API Security

- **Rate Limiting**: Per-user and per-endpoint rate limits
- **Input Validation**: Zod schema validation on all inputs
- **SQL Injection Prevention**: Parameterized queries via Prisma
- **CORS Configuration**: Strict origin allowlisting

## Compliance

### Mexican Education Standards
- **CONOCER Alignment**: Secure handling of competency certifications
- **DC-3 Compliance**: Proper format and data protection for training records
- **SIRCE Integration**: Secure data export to government systems

### Data Privacy
- **Mexico's LFPDPPP**: Full compliance with Mexican data protection law
- **GDPR**: EU data protection compliance for international users
- **Consent Management**: Explicit consent for data processing
- **Data Residency**: Mexico data residency by default

### Audit Trail
```
- All certification actions logged immutably
- Learner progress tracking with timestamps
- Evidence submission chain of custody
- Instructor/certifier action history
```

## Infrastructure Security

- **Container Security**: Non-root containers, minimal base images
- **Database Security**: Supabase with built-in security features
- **Secret Management**: Environment-based secrets, never in code
- **Dependency Scanning**: Automated vulnerability detection

## Incident Response

1. **Detection**: Automated monitoring for anomalies
2. **Containment**: Immediate credential suspension if breach suspected
3. **Investigation**: Forensic analysis within 24 hours
4. **Notification**: Affected learners and organizations notified within 48 hours
5. **Remediation**: Full incident report and corrective actions

## Credential Verification

AVALA provides public verification endpoints:
- Badge verification via URL
- Certificate validation API
- Revocation status checking

All verification requests are logged for audit purposes.

## Security Headers

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## Contact

Security Team: security@madfam.io

---

## Related Documentation

- [README](./README.md) - Project overview
- [CONTRIBUTING](./CONTRIBUTING.md) - Development guidelines
- [Architecture Overview](./docs/architecture/OVERVIEW.md) - System architecture
- [Documentation Hub](./docs/INDEX.md) - All documentation
