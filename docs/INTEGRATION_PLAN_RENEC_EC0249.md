# Integration Plan: RENEC-Harvester & EC0249 → Avala

> **Purpose**: Extract valuable components from `renec-harvester` and `ec0249` repos to enhance Avala's capabilities for EC/CONOCER competency training and certification.

---

## Executive Summary

| Source Repo | Key Value | Integration Priority |
|-------------|-----------|---------------------|
| **renec-harvester** | Live EC data harvesting, RENEC API, certifier/center database | 🔴 HIGH |
| **ec0249** | Educational platform engines, assessment system, document templates, simulations | 🟡 MEDIUM-HIGH |

---

## 1. RENEC-Harvester Integration (HIGH PRIORITY)

### 1.1 EC Data Harvesting Pipeline

**What it provides:**
- Automated scraping of CONOCER's RENEC platform for live EC data
- Normalized database of all Estándares de Competencia (EC codes, titles, versions, vigencia)
- ECE/OC (Entidades Certificadoras) directory with contact info, accreditations
- Centro de Evaluación (CE) directory with locations, EC offerings
- Relationship mapping: ECE↔EC, Centro↔EC, EC↔Sector

**Integration into Avala:**

```
apps/backend/src/modules/ec-sync/
├── ec-sync.module.ts
├── ec-sync.service.ts          # Orchestrates sync from RENEC data
├── ec-importer.service.ts      # Imports EC structure into Avala schema
├── ece-directory.service.ts    # ECE/OC directory lookups
└── scheduled/
    └── ec-refresh.job.ts       # Weekly refresh job
```

**Database additions:**
```prisma
model ECECertifier {
  id            String   @id @default(uuid())
  tenantId      String?  @map("tenant_id") @db.Uuid  // null = global directory
  certId        String   @unique @map("cert_id")     // From RENEC
  type          ECEType  // ECE or OC
  legalName     String   @map("legal_name")
  siglas        String?
  status        String
  state         String?
  stateInegi    String?  @map("state_inegi")
  phone         String?
  email         String?
  website       String?
  sourceUrl     String   @map("source_url")
  firstSeen     DateTime @map("first_seen")
  lastSeen      DateTime @map("last_seen")
  
  accreditations ECEAccreditation[]
  
  @@map("ece_certifiers")
}

model ECEAccreditation {
  id          String @id @default(uuid())
  certifierId String @map("certifier_id")
  ecCode      String @map("ec_code")
  since       DateTime?
  
  certifier   ECECertifier @relation(fields: [certifierId], references: [id])
  
  @@unique([certifierId, ecCode])
  @@map("ece_accreditations")
}

model EvaluationCenter {
  id          String @id @default(uuid())
  centerId    String @unique @map("center_id")
  name        String
  certifierId String? @map("certifier_id")
  state       String?
  stateInegi  String? @map("state_inegi")
  city        String?
  address     String?
  phone       String?
  email       String?
  sourceUrl   String @map("source_url")
  
  offerings   CenterECOffering[]
  
  @@map("evaluation_centers")
}
```

**API Endpoints:**
```
GET /v1/ec/search              # Search ECs (from local cache)
GET /v1/ec/{code}              # Get EC with full structure
GET /v1/ece/search             # Search ECE/OC certifiers
GET /v1/ece/{id}               # Get certifier details
GET /v1/ece/{id}/estandares    # Get certifier's accredited ECs
GET /v1/centers/search         # Search evaluation centers
GET /v1/centers/nearby         # Geolocation-based search
POST /v1/ec/sync               # Admin: trigger RENEC sync
```

**Cron Jobs:**
- **Weekly full sync**: Sundays 3am MX time
- **Daily probe**: Check for new/updated ECs

**Files to extract from renec-harvester:**
- `src/drivers/ec_driver.py` → Port to TypeScript
- `src/drivers/certificadores_driver.py` → Port to TypeScript
- `src/drivers/centros_driver.py` → Port to TypeScript
- `src/parse/normalizer.py` → Port state normalization logic
- `assets/states_inegi.csv` → Import as reference data
- `src/qa/validator.py` → Port EC code validation regex

### 1.2 ECE/OC Toolkit Enhancement

**Current Avala state:** Has `ECE_OC_ADMIN` role flag but limited functionality

**Enhancement from renec-harvester:**
- Pre-populate ECE/OC selection from live directory
- Auto-suggest evaluation centers by location and EC
- Validate ECE accreditation status before dictamen submission

---

## 2. EC0249 Integration (MEDIUM-HIGH PRIORITY)

### 2.1 Assessment Engine

**What it provides:**
- Multi-type question system (multiple choice, true/false, short answer, essay, matching)
- Rubric-based evaluation with criterion-level scoring
- Weighted and competency-based scoring algorithms
- Real-time validation and feedback

**Integration into Avala:**

```
packages/assessment-engine/
├── src/
│   ├── index.ts
│   ├── types.ts
│   ├── engines/
│   │   ├── scoring.engine.ts       # From ec0249 ScoringEngine
│   │   ├── question.engine.ts      # Question type handlers
│   │   └── rubric.engine.ts        # Rubric evaluation
│   ├── validators/
│   │   └── response.validator.ts
│   └── adapters/
│       └── xapi.adapter.ts         # Emit xAPI statements
└── package.json
```

**Key code to port:**
- `src/js/engines/AssessmentEngine.js` → TypeScript
- `src/js/assessment/QuestionTypes.js` → TypeScript question handlers
- `src/js/assessment/ScoringEngine.js` → TypeScript with algorithm variants

### 2.2 Document Template Engine

**What it provides:**
- 15 EC0249-specific document templates
- Section-based document structure with validation
- Real-time completion tracking
- Export to PDF/HTML

**Integration into Avala:**

Avala already needs document templates for portfolios. EC0249's approach is directly applicable:

```
packages/document-engine/
├── src/
│   ├── index.ts
│   ├── types.ts
│   ├── templates/
│   │   ├── template.registry.ts    # Template definitions
│   │   ├── ec0249/                  # EC0249 specific templates
│   │   │   ├── interview-guide.ts
│   │   │   ├── diagnostic-report.ts
│   │   │   └── ...
│   │   └── generic/                 # Generic templates
│   │       ├── portfolio-summary.ts
│   │       └── evidence-log.ts
│   ├── validation/
│   │   └── document.validator.ts
│   └── export/
│       ├── html.exporter.ts
│       └── pdf.exporter.ts
└── package.json
```

**Templates to adapt:**
| EC0249 Template | Avala Equivalent |
|-----------------|------------------|
| Guía de Entrevista | Assessment: Structured Interview |
| Registro de Información | Portfolio: Evidence Record |
| Análisis de Causas | Portfolio: Root Cause Analysis |
| Matriz de Problemas | Portfolio: Problem Matrix |
| Reporte de Diagnóstico | Portfolio: Diagnostic Report |
| Plan de Recolección | Assessment: Data Collection Plan |

### 2.3 Simulation Engine

**What it provides:**
- Interview simulations with virtual clients
- Presentation practice scenarios
- Real-time performance evaluation against EC criteria
- Feedback and recommendations

**Integration into Avala:**

This is valuable for **Avala Assess** as a practice/preparation mode:

```
apps/web/app/(dashboard)/practice/
├── page.tsx                        # Practice mode landing
├── simulations/
│   ├── page.tsx                    # Simulation selection
│   ├── [simulationId]/
│   │   ├── page.tsx               # Active simulation
│   │   └── results/page.tsx       # Results & feedback
│   └── components/
│       ├── VirtualClient.tsx
│       ├── ResponseInput.tsx
│       └── CriteriaTracker.tsx
```

**Key code to port:**
- `src/js/engines/SimulationEngine.js` → TypeScript
- `src/js/simulations/EvaluationEngine.js` → Criterion tracking
- `src/js/simulations/PresentationScenarios.js` → Scenario definitions

### 2.4 Content Engine Patterns

**What it provides:**
- Modular content rendering (sections, media, interactive elements)
- Progress tracking per content piece
- i18n-ready content structure

**Integration into Avala:**

Adopt the renderer pattern for **Avala Learn**:

```
apps/web/components/content/
├── renderers/
│   ├── SectionRenderer.tsx
│   ├── MediaRenderer.tsx
│   ├── InteractiveRenderer.tsx
│   └── ActivityRenderer.tsx
├── ContentPlayer.tsx              # Main content orchestrator
└── ProgressTracker.tsx
```

### 2.5 Architecture Patterns

**ServiceContainer/DI Pattern:**
EC0249's ServiceContainer is well-designed. Avala uses NestJS which has built-in DI, but the frontend could benefit:

```typescript
// packages/ui/src/providers/ServiceProvider.tsx
export const ServiceContext = createContext<ServiceContainer>(null);

export function ServiceProvider({ children }: { children: React.ReactNode }) {
  const container = useMemo(() => new ServiceContainer(), []);
  
  useEffect(() => {
    container.register('i18n', I18nService);
    container.register('storage', StorageService);
    container.register('progress', ProgressService);
  }, []);
  
  return (
    <ServiceContext.Provider value={container}>
      {children}
    </ServiceContext.Provider>
  );
}
```

**EventBus Pattern:**
Already have this in Avala via backend events, but frontend could use it:

```typescript
// packages/ui/src/lib/event-bus.ts
export class EventBus {
  private subscribers = new Map<string, Set<Function>>();
  
  subscribe(event: string, handler: Function, options?: { priority?: number }) { ... }
  publish(event: string, data?: unknown) { ... }
  unsubscribe(event: string, handler: Function) { ... }
}
```

---

## 3. Implementation Phases

### Phase 1: RENEC Data Layer (Weeks 1-2)
**Priority: 🔴 CRITICAL**

1. **Week 1:**
   - Create `packages/renec-client` with TypeScript ports of drivers
   - Add RENEC data models to Prisma schema
   - Implement EC import service

2. **Week 2:**
   - Build ECE/OC directory API endpoints
   - Create admin UI for EC browsing and sync
   - Set up cron jobs for automated refresh

**Deliverables:**
- [ ] `packages/renec-client` package
- [ ] Database migrations for ECE/Center tables
- [ ] `/v1/ec/*` and `/v1/ece/*` API endpoints
- [ ] Admin panel: EC browser, sync controls

### Phase 2: Assessment Engine Enhancement (Weeks 3-4)
**Priority: 🟡 HIGH**

1. **Week 3:**
   - Port EC0249 question types to `packages/assessment-engine`
   - Implement rubric-based scoring
   - Add weighted/competency scoring algorithms

2. **Week 4:**
   - Integrate with existing Avala Assessment module
   - Build assessment creation UI with question type selection
   - xAPI statement emission for assessment events

**Deliverables:**
- [ ] `packages/assessment-engine` package
- [ ] Enhanced assessment creation in web app
- [ ] Question type components (MCQ, essay, matching, etc.)
- [ ] Scoring configuration UI

### Phase 3: Document Templates (Weeks 5-6)
**Priority: 🟡 MEDIUM-HIGH**

1. **Week 5:**
   - Create `packages/document-engine` with template system
   - Port relevant EC0249 templates
   - Build document editor component

2. **Week 6:**
   - Integrate with Portfolio module
   - Add validation rules per template
   - PDF/HTML export functionality

**Deliverables:**
- [ ] `packages/document-engine` package
- [ ] Template library (5+ generic, EC0249-specific)
- [ ] Document editor in Portfolio UI
- [ ] Export functionality

### Phase 4: Practice Simulations (Weeks 7-8)
**Priority: 🟢 MEDIUM**

1. **Week 7:**
   - Port SimulationEngine to TypeScript
   - Create simulation scenario definitions
   - Build VirtualClient component

2. **Week 8:**
   - Integrate with Avala Assess as "Practice Mode"
   - Add criterion tracking UI
   - Results and recommendations display

**Deliverables:**
- [ ] Practice mode in Avala Assess
- [ ] 3+ simulation scenarios
- [ ] Performance feedback system

---

## 4. Technical Decisions

### 4.1 Code Porting Strategy

| Source | Target | Approach |
|--------|--------|----------|
| Python (renec-harvester) | TypeScript | Full rewrite using patterns, not line-by-line |
| Vanilla JS (ec0249) | TypeScript/React | Port logic, rebuild UI with existing Avala components |

### 4.2 Package Structure

```
avala/
├── packages/
│   ├── renec-client/          # NEW: RENEC data access
│   ├── assessment-engine/     # NEW: Enhanced assessment logic
│   ├── document-engine/       # NEW: Template-based documents
│   ├── db/                    # Existing: Prisma schema (extend)
│   ├── ui/                    # Existing: Shared components
│   └── core/                  # Existing: Domain models
```

### 4.3 Data Flow

```
RENEC (external)
     ↓
renec-client (harvester)
     ↓
PostgreSQL (EC cache, ECE directory)
     ↓
Avala Backend API
     ↓
Avala Web (Course authoring, ECE toolkit)
```

---

## 5. Files to Extract

### From renec-harvester:
```
src/drivers/ec_driver.py           → packages/renec-client/src/drivers/ec.driver.ts
src/drivers/certificadores_driver.py → packages/renec-client/src/drivers/ece.driver.ts
src/drivers/centros_driver.py      → packages/renec-client/src/drivers/centers.driver.ts
src/parse/normalizer.py            → packages/renec-client/src/utils/normalizer.ts
src/qa/validator.py                → packages/renec-client/src/utils/validator.ts
assets/states_inegi.csv            → packages/renec-client/src/data/states-inegi.json
config/config.yaml (structure)     → packages/renec-client/src/config.ts
```

### From ec0249:
```
src/js/engines/AssessmentEngine.js  → packages/assessment-engine/src/engines/assessment.engine.ts
src/js/engines/DocumentEngine.js    → packages/document-engine/src/engines/document.engine.ts
src/js/engines/SimulationEngine.js  → apps/web/lib/simulation/engine.ts
src/js/assessment/QuestionTypes.js  → packages/assessment-engine/src/question-types/
src/js/assessment/ScoringEngine.js  → packages/assessment-engine/src/scoring/
src/js/core/EventBus.js             → packages/ui/src/lib/event-bus.ts
src/js/core/ServiceContainer.js     → packages/ui/src/providers/service-container.ts
```

---

## 6. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| RENEC site structure changes | HIGH | Version selectors, monitoring, fallback to cached data |
| EC0249 code quality/testing | MEDIUM | Thorough review before porting, add tests |
| Integration complexity | MEDIUM | Incremental rollout, feature flags |
| Performance (EC sync) | LOW | Background jobs, caching, incremental updates |

---

## 7. Success Metrics

| Metric | Target |
|--------|--------|
| EC coverage in Avala | 100% of active CONOCER ECs |
| ECE directory completeness | 95%+ match with RENEC |
| Assessment question types | 5+ types supported |
| Document templates | 10+ templates available |
| Simulation scenarios | 3+ scenarios for EC0249 |

---

## 8. Next Steps

1. **Immediate**: Review this plan with stakeholders
2. **This week**: Begin Phase 1 (RENEC data layer)
3. **Ongoing**: Track progress in GitHub Projects

---

*Created: November 2025*
*Last Updated: November 2025*
