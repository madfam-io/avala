# Interactive Demo System

> Multi-role demo experience showcasing AVALA's capabilities for different user personas.

---

## Overview

The AVALA demo system provides an interactive, role-based exploration of the platform without requiring authentication. It demonstrates key features from four different user perspectives:

| Role | Path | Primary Focus |
|------|------|---------------|
| **HR Manager** | `/demo/hr` | Compliance management, DC-3 tracking, team oversight |
| **Instructor** | `/demo/instructor` | Course delivery, assessments, student progress |
| **Trainee** | `/demo/trainee` | Learning experience, credentials, gamification |
| **Executive** | `/demo/executive` | ROI analytics, compliance metrics, strategic reports |

---

## Architecture

### Directory Structure

```
apps/web/app/demo/
├── page.tsx                    # Role selector entry point
├── _data/
│   ├── demo-seed.ts            # Shared demo data
│   └── demo-roles.ts           # Role configuration (server-safe)
├── _components/
│   ├── index.ts                # Barrel exports
│   ├── role-switcher.tsx       # Role switching UI
│   ├── demo-header.tsx         # Demo chrome/header
│   ├── contextual-cta.tsx      # Conversion CTAs
│   └── guided-tour.tsx         # Onboarding overlay
└── [role]/
    ├── layout.tsx              # Role-specific layout
    ├── page.tsx                # Role router
    └── _dashboards/
        ├── hr-dashboard.tsx
        ├── instructor-dashboard.tsx
        ├── trainee-dashboard.tsx
        └── executive-dashboard.tsx
```

### Design Principles

1. **Single Demo, Multiple Views** - One shared data set viewed from different perspectives
2. **Real-time Role Switching** - Seamless navigation between personas
3. **Guided Onboarding** - Tour overlay introducing key features per role
4. **Contextual CTAs** - Conversion prompts tailored to each persona's needs
5. **Mexican Compliance Focus** - Showcasing DC-3, SIRCE, LFT features

---

## Demo Data Model

### Shared Tenant
```typescript
DEMO_TENANT = {
  name: "Manufacturas del Norte",
  industry: "Manufactura Automotriz",
  employeeCount: 450,
  // Mexican RFC for authenticity
}
```

### Demo Users (8 total)
- 1 HR Manager
- 2 Instructors
- 4 Trainees (various progress states)
- 1 Executive

### Demo Courses (4 EC-aligned)
1. EC0217.01 - Impartición de cursos de formación
2. EC0301 - Diseño de cursos de capacitación
3. EC0366 - Desarrollo de liderazgo
4. EC0249 - Evaluación de competencias

### Demo Records
- Enrollments with various completion states
- DC-3 certificates (valid, pending, expired)
- Open Badge 3.0 credentials
- Assessment results with scores
- Analytics with realistic metrics

---

## Role Experiences

### HR Manager (`/demo/hr`)

**Tabs:** Overview | Compliance | DC-3 | Team

**Key Features Showcased:**
- Compliance dashboard with real-time metrics
- DC-3 generation and tracking
- Department-level progress breakdown
- LFT plan progress tracking
- SIRCE export functionality

**Metrics Displayed:**
- Overall compliance rate (%)
- DC-3 certificates generated
- Active enrollments
- Department breakdowns

### Instructor (`/demo/instructor`)

**Tabs:** My Courses | Assessments | Students

**Key Features Showcased:**
- Course management interface
- Pending assessment queue
- Student progress tracking
- Criterion-level evaluation
- Feedback tools

**Metrics Displayed:**
- Active courses count
- Pending evaluations (with badge)
- Average completion rate
- Student performance distribution

### Trainee (`/demo/trainee`)

**Tabs:** My Learning | Credentials | Achievements

**Key Features Showcased:**
- Learning path progress
- Course enrollment status
- Open Badge 3.0 credentials
- DC-3 certificate access
- Gamification system (XP, levels, achievements)
- Streak tracking

**Gamification Elements:**
- XP bar with level progression
- Daily streak counter
- Achievement grid (locked/unlocked)
- Competency radar chart

### Executive (`/demo/executive`)

**Tabs:** Overview | Compliance | Investment | Reports

**Key Features Showcased:**
- ROI metrics and calculations
- Budget execution tracking
- Department compliance comparison
- Monthly DC-3 trends
- Downloadable strategic reports

**Metrics Displayed:**
- Compliance rate
- Trained collaborators count
- Cost per trainee
- ROI percentage
- Budget utilization

---

## Components

### RoleSwitcher
```tsx
<RoleSwitcher currentRole="hr" compact={true} />
```
- Dropdown mode (compact) or button row (expanded)
- Shows current role with visual indicator
- Navigation preserves sub-routes where applicable

### DemoHeader
```tsx
<DemoHeader currentRole="hr" />
```
- Sticky header with demo banner
- Tenant context display
- Role switcher integration
- Exit demo / Sign up CTAs

### GuidedTour
```tsx
<GuidedTour role="hr" onComplete={() => {}} />
```
- Role-specific tour steps
- Progress indicators
- LocalStorage persistence (shows once per role)
- Skip/restart functionality

### ContextualCTA
```tsx
<ContextualCTA role="hr" />
```
- Role-specific value propositions
- Feature lists per persona
- Plan badge indicators
- Dismissible with state

---

## User Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Marketing Site                        │
│                  "Ver demo" button                       │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   /demo (Role Selector)                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │   HR    │ │Instructor│ │ Trainee │ │Executive│       │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘       │
└───────┼──────────┼──────────┼──────────┼───────────────┘
        │          │          │          │
        ▼          ▼          ▼          ▼
┌─────────────────────────────────────────────────────────┐
│              /demo/[role] (Dashboard)                    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Guided Tour Overlay                 │    │
│  │         (first visit per role)                   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Role-Specific Dashboard             │    │
│  │           (tabs, metrics, features)              │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Contextual CTA                      │    │
│  │         (conversion prompt)                      │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────┐                 │
│  │    Role Switcher (always visible)  │                 │
│  └────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────┘
```

---

## Conversion Strategy

### Per-Role CTAs

| Role | Primary Value Proposition | Target Plan |
|------|---------------------------|-------------|
| HR | "Automatiza tu cumplimiento STPS" | Professional |
| Instructor | "Herramientas de instructor avanzadas" | Team |
| Trainee | "Tu portafolio de competencias" | Included |
| Executive | "Inteligencia de capacitación" | Enterprise |

### Exit Points
- "Iniciar prueba gratis" - Primary CTA throughout
- "Hablar con ventas" - Enterprise inquiries
- Role-specific feature deep-links

---

## Implementation Notes

### Static Generation
The demo uses `generateStaticParams` for SSG:
```typescript
export function generateStaticParams() {
  return DEMO_ROLE_IDS.map((role) => ({ role }));
}
```

### Server/Client Separation
- `demo-roles.ts` - Server-safe (no React components)
- `role-switcher.tsx` - Client component with icons

### LocalStorage Keys
- `avala-demo-tour-hr` - HR tour completion
- `avala-demo-tour-instructor` - Instructor tour completion
- `avala-demo-tour-trainee` - Trainee tour completion
- `avala-demo-tour-executive` - Executive tour completion

---

## Related Documentation

- [Landing Page Design](./design/LANDING_PAGE_DESIGN.md)
- [Pricing & Conversion](./design/PRICING_AND_CONVERSION.md)
- [SOFTWARE_SPEC.md](./architecture/SOFTWARE_SPEC.md) - Full product specification

---

*Last updated: November 2024*
