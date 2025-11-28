# AVALA Multi-EC Training Platform Architecture

## Overview

AVALA supports multiple **Estándares de Competencia (EC)** from CONOCER. EC0249 is the first implementation, but the architecture is designed to support any EC standard (EC0217, EC0366, etc.) with configuration-driven content.

## Core Principles

1. **Configuration over Code**: EC-specific content lives in database/JSON, not hardcoded
2. **Generic Engines**: Content, Assessment, Document, Simulation engines work with ANY EC
3. **Tenant-Scoped ECs**: Each tenant can enable different EC standards
4. **Version Control**: EC standards change over time; support versioning
5. **Reusable Components**: UI components are EC-agnostic

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    🎨 PRESENTATION LAYER                        │
│  React Components (EC-agnostic)                                 │
│  ├── VideoPlayer, QuizRenderer, DocumentEditor                  │
│  ├── ModuleNavigation, ProgressTracker, AchievementDisplay      │
│  └── Dashboard, Portfolio, Leaderboard                          │
├─────────────────────────────────────────────────────────────────┤
│                    ⚙️ APPLICATION LAYER                         │
│  NestJS Services (EC-aware via configuration)                   │
│  ├── ECConfigService      → Load EC metadata & structure        │
│  ├── ContentService       → Deliver lessons by EC               │
│  ├── AssessmentService    → Run assessments by EC               │
│  ├── DocumentService      → Manage templates by EC              │
│  ├── SimulationService    → Execute scenarios by EC             │
│  └── ProgressService      → Track progress per EC               │
├─────────────────────────────────────────────────────────────────┤
│                    📊 DOMAIN LAYER                              │
│  EC Domain Models                                               │
│  ├── ECStandard           → EC metadata, elements, criteria     │
│  ├── ECModule             → Training modules per EC             │
│  ├── ECLesson             → Lessons with content sections       │
│  ├── ECTemplate           → Document templates per element      │
│  ├── ECAssessment         → Questions & rubrics per EC          │
│  └── ECSimulation         → Practice scenarios per EC           │
├─────────────────────────────────────────────────────────────────┤
│                    🗄️ DATA LAYER                                │
│  PostgreSQL + Prisma                                            │
│  ├── ec_standards         → EC definitions                      │
│  ├── ec_modules           → Module structure                    │
│  ├── ec_lessons           → Lesson content (JSON)               │
│  ├── ec_templates         → Document templates (JSON)           │
│  ├── ec_assessments       → Questions & scoring                 │
│  └── ec_simulations       → Scenario definitions                │
└─────────────────────────────────────────────────────────────────┘
```

## EC Configuration Schema

### ECStandard (Root Entity)

```typescript
interface ECStandard {
  id: string;                    // UUID
  code: string;                  // "EC0249", "EC0217"
  version: string;               // "01", "02"
  title: string;                 // Spanish title
  titleEn?: string;              // English title
  description: string;           // Full description
  issuer: string;                // "CONOCER"
  sector: string;                // Sector classification
  level: number;                 // Competency level (1-5)
  
  // Status
  status: 'DRAFT' | 'PUBLISHED' | 'DEPRECATED';
  publishedAt?: Date;
  deprecatedAt?: Date;
  
  // Structure
  elements: ECElement[];         // Competency elements
  modules: ECModule[];           // Training modules
  
  // Metadata
  estimatedHours: number;        // Total training hours
  dc3Eligible: boolean;          // Generates DC-3
  certificationRequired: boolean;
}
```

### ECElement (Competency Element)

```typescript
interface ECElement {
  id: string;
  ecId: string;                  // Parent EC
  code: string;                  // "E0875", "E0876", "E0877"
  title: string;
  titleEn?: string;
  description: string;
  orderIndex: number;
  
  // Criteria breakdown
  performanceCriteria: ECCriterion[];   // Desempeño
  knowledgeCriteria: ECCriterion[];     // Conocimiento
  productCriteria: ECCriterion[];       // Producto
  
  // Requirements
  requiredDocuments: number;     // Docs needed for this element
  requiredAssessmentScore: number; // Min score (0-100)
}
```

### ECModule (Training Module)

```typescript
interface ECModule {
  id: string;
  ecId: string;
  code: string;                  // "module1", "fundamentals"
  title: string;
  titleEn?: string;
  description?: string;
  icon?: string;                 // Emoji or icon name
  orderIndex: number;
  
  // Mapping to elements (many-to-many)
  elementIds: string[];          // Which elements this covers
  
  // Content
  lessons: ECLesson[];
  assessmentId?: string;         // Optional module assessment
  
  // Requirements
  estimatedMinutes: number;
  isRequired: boolean;
  prerequisiteModuleIds?: string[];
}
```

### ECLesson (Lesson Content)

```typescript
interface ECLesson {
  id: string;
  moduleId: string;
  code: string;
  title: string;
  titleEn?: string;
  orderIndex: number;
  
  // Content structure (JSON)
  sections: LessonSection[];
  
  // Media
  videoId?: string;              // YouTube ID
  videoDuration?: number;        // Seconds
  
  // Requirements
  estimatedMinutes: number;
  isRequired: boolean;
}

interface LessonSection {
  id: string;
  type: 'text' | 'video' | 'interactive' | 'activity' | 'quiz';
  title?: string;
  content?: string;              // Markdown/HTML
  media?: {
    type: 'video' | 'image' | 'audio';
    url: string;
    caption?: string;
  };
  activity?: {
    type: 'reflection' | 'exercise' | 'discussion';
    prompt: string;
    guidance?: string;
  };
}
```

### ECTemplate (Document Template)

```typescript
interface ECTemplate {
  id: string;
  ecId: string;
  elementId: string;             // Which element this supports
  
  code: string;                  // "problem_description"
  title: string;
  titleEn?: string;
  description?: string;
  
  // Classification
  category: 'REQUIRED' | 'OPTIONAL' | 'SUPPLEMENTARY';
  orderIndex: number;
  
  // Video support
  supportVideoId?: string;
  supportVideoTitle?: string;
  
  // Structure (JSON)
  sections: TemplateSection[];
  
  // Evaluation
  evaluationCriteria: string[];  // What evaluators look for
}

interface TemplateSection {
  id: string;
  title: string;
  titleEn?: string;
  type: 'textarea' | 'structured' | 'matrix' | 'checklist';
  required: boolean;
  guidance?: string;             // Help text
  
  // Validation
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  
  // For structured sections
  subsections?: TemplateSubsection[];
  
  // For matrix sections
  columns?: string[];
  rows?: string[];
}
```

### ECAssessment (Quiz/Assessment)

```typescript
interface ECAssessment {
  id: string;
  ecId: string;
  moduleId?: string;             // Module-specific or EC-wide
  elementId?: string;            // Element-specific
  
  code: string;
  title: string;
  titleEn?: string;
  
  // Configuration
  category: 'KNOWLEDGE_TEST' | 'COMPETENCY_ASSESSMENT' | 'PRACTICE_QUIZ' | 'DIAGNOSTIC' | 'FINAL_EXAM';
  timeLimit?: number;            // Seconds
  passingScore: number;          // 0-100
  allowedAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResults: boolean;
  
  // Questions
  questions: ECQuestion[];
}

interface ECQuestion {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY' | 'MATCHING';
  questionText: string;
  questionTextEn?: string;
  explanation?: string;
  points: number;
  
  // Type-specific data
  options?: string[];            // For multiple choice
  correctAnswer?: number | boolean | string;
  matchingPairs?: { left: string; right: string }[];
  keywords?: string[];           // For short answer validation
  rubric?: { criterion: string; maxPoints: number }[];
}
```

### ECSimulation (Practice Scenario)

```typescript
interface ECSimulation {
  id: string;
  ecId: string;
  elementId?: string;
  
  code: string;
  title: string;
  titleEn?: string;
  description: string;
  
  type: 'INTERVIEW' | 'PRESENTATION' | 'ROLE_PLAY' | 'CASE_STUDY';
  
  // Scenario definition (JSON)
  scenario: SimulationScenario;
  
  // Evaluation
  rubric: SimulationRubric[];
}

interface SimulationScenario {
  context: string;               // Background/setup
  objectives: string[];          // What to achieve
  
  // For interview type
  clientProfile?: {
    name: string;
    role: string;
    personality: string;
    concerns: string[];
  };
  
  // For presentation type
  audience?: {
    type: string;
    expectations: string[];
  };
  
  stages: ScenarioStage[];
}
```

## Database Schema Extensions

Add to `schema.prisma`:

```prisma
// ============================================
// EC STANDARD CONFIGURATION (Multi-EC Support)
// ============================================

model ECStandard {
  id            String   @id @default(uuid()) @db.Uuid
  
  // Identification
  code          String   @unique // "EC0249", "EC0217"
  version       String   @default("01")
  title         String
  titleEn       String?  @map("title_en")
  description   String   @db.Text
  descriptionEn String?  @map("description_en") @db.Text
  
  // Classification
  issuer        String   @default("CONOCER")
  sector        String?
  level         Int      @default(3) // 1-5
  
  // Status
  status        ECStandardStatus @default(DRAFT)
  publishedAt   DateTime? @map("published_at")
  deprecatedAt  DateTime? @map("deprecated_at")
  
  // Metadata
  estimatedHours Int     @default(40) @map("estimated_hours")
  dc3Eligible   Boolean  @default(true) @map("dc3_eligible")
  thumbnailUrl  String?  @map("thumbnail_url")
  
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  // Relations
  elements      ECElement[]
  modules       ECModule[]
  templates     ECTemplate[]
  assessments   ECAssessment[]
  simulations   ECSimulation[]
  enrollments   ECEnrollment[]
  
  @@map("ec_standards")
  @@index([code])
  @@index([status])
}

enum ECStandardStatus {
  DRAFT
  PUBLISHED
  DEPRECATED
}

model ECElement {
  id            String   @id @default(uuid()) @db.Uuid
  ecId          String   @map("ec_id") @db.Uuid
  
  code          String   // "E0875"
  title         String
  titleEn       String?  @map("title_en")
  description   String   @db.Text
  orderIndex    Int      @default(0) @map("order_index")
  
  // Requirements
  requiredDocuments Int  @default(0) @map("required_documents")
  requiredScore Int      @default(70) @map("required_score")
  
  // Criteria (JSON arrays)
  performanceCriteria Json @default("[]") @map("performance_criteria")
  knowledgeCriteria   Json @default("[]") @map("knowledge_criteria")
  productCriteria     Json @default("[]") @map("product_criteria")
  
  createdAt     DateTime @default(now()) @map("created_at")
  
  // Relations
  ec            ECStandard @relation(fields: [ecId], references: [id], onDelete: Cascade)
  templates     ECTemplate[]
  moduleElements ECModuleElement[]
  
  @@unique([ecId, code])
  @@map("ec_elements")
  @@index([ecId])
}

model ECModule {
  id            String   @id @default(uuid()) @db.Uuid
  ecId          String   @map("ec_id") @db.Uuid
  
  code          String   // "module1", "fundamentals"
  title         String
  titleEn       String?  @map("title_en")
  description   String?  @db.Text
  icon          String?  // Emoji or icon
  orderIndex    Int      @default(0) @map("order_index")
  
  // Requirements
  estimatedMinutes Int   @default(60) @map("estimated_minutes")
  isRequired    Boolean  @default(true) @map("is_required")
  
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  // Relations
  ec            ECStandard @relation(fields: [ecId], references: [id], onDelete: Cascade)
  lessons       ECLesson[]
  assessments   ECAssessment[]
  elements      ECModuleElement[]
  progress      ECModuleProgress[]
  
  @@unique([ecId, code])
  @@map("ec_modules")
  @@index([ecId])
}

// Many-to-many: Module <-> Element
model ECModuleElement {
  id            String   @id @default(uuid()) @db.Uuid
  moduleId      String   @map("module_id") @db.Uuid
  elementId     String   @map("element_id") @db.Uuid
  
  module        ECModule @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  element       ECElement @relation(fields: [elementId], references: [id], onDelete: Cascade)
  
  @@unique([moduleId, elementId])
  @@map("ec_module_elements")
}

model ECLesson {
  id            String   @id @default(uuid()) @db.Uuid
  moduleId      String   @map("module_id") @db.Uuid
  
  code          String
  title         String
  titleEn       String?  @map("title_en")
  orderIndex    Int      @default(0) @map("order_index")
  
  // Content (JSON)
  sections      Json     @default("[]")
  
  // Media
  videoId       String?  @map("video_id") // YouTube
  videoDuration Int?     @map("video_duration") // Seconds
  
  // Requirements
  estimatedMinutes Int   @default(15) @map("estimated_minutes")
  isRequired    Boolean  @default(true) @map("is_required")
  
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  // Relations
  module        ECModule @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  progress      ECLessonProgress[]
  
  @@unique([moduleId, code])
  @@map("ec_lessons")
  @@index([moduleId])
}

model ECTemplate {
  id            String   @id @default(uuid()) @db.Uuid
  ecId          String   @map("ec_id") @db.Uuid
  elementId     String   @map("element_id") @db.Uuid
  
  code          String   // "problem_description"
  title         String
  titleEn       String?  @map("title_en")
  description   String?  @db.Text
  
  category      DocumentCategory @default(REQUIRED)
  orderIndex    Int      @default(0) @map("order_index")
  
  // Video support
  supportVideoId    String? @map("support_video_id")
  supportVideoTitle String? @map("support_video_title")
  
  // Structure (JSON)
  sections      Json     @default("[]")
  
  // Evaluation
  evaluationCriteria Json @default("[]") @map("evaluation_criteria")
  
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  // Relations
  ec            ECStandard @relation(fields: [ecId], references: [id], onDelete: Cascade)
  element       ECElement @relation(fields: [elementId], references: [id], onDelete: Cascade)
  documents     ECDocument[]
  
  @@unique([ecId, code])
  @@map("ec_templates")
  @@index([ecId])
  @@index([elementId])
}

model ECAssessment {
  id            String   @id @default(uuid()) @db.Uuid
  ecId          String   @map("ec_id") @db.Uuid
  moduleId      String?  @map("module_id") @db.Uuid
  
  code          String
  title         String
  titleEn       String?  @map("title_en")
  
  category      QuizCategory @default(KNOWLEDGE_TEST)
  timeLimit     Int?     @map("time_limit") // Seconds
  passingScore  Int      @default(70) @map("passing_score")
  allowedAttempts Int    @default(3) @map("allowed_attempts")
  shuffleQuestions Boolean @default(true) @map("shuffle_questions")
  shuffleOptions Boolean @default(true) @map("shuffle_options")
  showResults   Boolean  @default(true) @map("show_results")
  
  // Questions (JSON)
  questions     Json     @default("[]")
  
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  // Relations
  ec            ECStandard @relation(fields: [ecId], references: [id], onDelete: Cascade)
  module        ECModule? @relation(fields: [moduleId], references: [id], onDelete: SetNull)
  attempts      ECAssessmentAttempt[]
  
  @@unique([ecId, code])
  @@map("ec_assessments")
  @@index([ecId])
  @@index([moduleId])
}

model ECSimulation {
  id            String   @id @default(uuid()) @db.Uuid
  ecId          String   @map("ec_id") @db.Uuid
  
  code          String
  title         String
  titleEn       String?  @map("title_en")
  description   String   @db.Text
  
  type          SimulationType
  
  // Scenario & rubric (JSON)
  scenario      Json     @default("{}")
  rubric        Json     @default("[]")
  
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  // Relations
  ec            ECStandard @relation(fields: [ecId], references: [id], onDelete: Cascade)
  attempts      ECSimulationAttempt[]
  
  @@unique([ecId, code])
  @@map("ec_simulations")
  @@index([ecId])
}

enum SimulationType {
  INTERVIEW
  PRESENTATION
  ROLE_PLAY
  CASE_STUDY
}

// ============================================
// EC ENROLLMENT & PROGRESS
// ============================================

model ECEnrollment {
  id            String   @id @default(uuid()) @db.Uuid
  userId        String   @map("user_id") @db.Uuid
  ecId          String   @map("ec_id") @db.Uuid
  tenantId      String   @map("tenant_id") @db.Uuid
  
  status        ECEnrollmentStatus @default(IN_PROGRESS)
  
  enrolledAt    DateTime @default(now()) @map("enrolled_at")
  completedAt   DateTime? @map("completed_at")
  
  // Progress summary (cached)
  overallProgress Float  @default(0) @map("overall_progress") // 0-100
  
  // Relations
  ec            ECStandard @relation(fields: [ecId], references: [id], onDelete: Cascade)
  moduleProgress ECModuleProgress[]
  lessonProgress ECLessonProgress[]
  documents     ECDocument[]
  assessmentAttempts ECAssessmentAttempt[]
  simulationAttempts ECSimulationAttempt[]
  
  @@unique([userId, ecId])
  @@map("ec_enrollments")
  @@index([userId])
  @@index([ecId])
  @@index([tenantId])
}

enum ECEnrollmentStatus {
  IN_PROGRESS
  COMPLETED
  CERTIFIED
  EXPIRED
}

model ECModuleProgress {
  id            String   @id @default(uuid()) @db.Uuid
  enrollmentId  String   @map("enrollment_id") @db.Uuid
  moduleId      String   @map("module_id") @db.Uuid
  
  progress      Float    @default(0) // 0-100
  status        ProgressStatus @default(NOT_STARTED)
  
  startedAt     DateTime? @map("started_at")
  completedAt   DateTime? @map("completed_at")
  
  // Relations
  enrollment    ECEnrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  module        ECModule @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  
  @@unique([enrollmentId, moduleId])
  @@map("ec_module_progress")
  @@index([enrollmentId])
}

model ECLessonProgress {
  id            String   @id @default(uuid()) @db.Uuid
  enrollmentId  String   @map("enrollment_id") @db.Uuid
  lessonId      String   @map("lesson_id") @db.Uuid
  
  status        ProgressStatus @default(NOT_STARTED)
  videoProgress Float    @default(0) @map("video_progress") // 0-100
  
  startedAt     DateTime? @map("started_at")
  completedAt   DateTime? @map("completed_at")
  
  // Relations
  enrollment    ECEnrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  lesson        ECLesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  
  @@unique([enrollmentId, lessonId])
  @@map("ec_lesson_progress")
  @@index([enrollmentId])
}

model ECDocument {
  id            String   @id @default(uuid()) @db.Uuid
  enrollmentId  String   @map("enrollment_id") @db.Uuid
  templateId    String   @map("template_id") @db.Uuid
  
  status        DocumentStatus @default(DRAFT)
  title         String?
  
  // Content (JSON)
  content       Json     @default("{}")
  
  // Validation
  validationScore Float? @map("validation_score") // 0-100
  validationErrors Json  @default("[]") @map("validation_errors")
  isComplete    Boolean  @default(false) @map("is_complete")
  
  // Versioning
  version       Int      @default(1)
  
  // Export
  pdfPath       String?  @map("pdf_path")
  exportedAt    DateTime? @map("exported_at")
  
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  submittedAt   DateTime? @map("submitted_at")
  
  // Relations
  enrollment    ECEnrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  template      ECTemplate @relation(fields: [templateId], references: [id])
  
  @@map("ec_documents")
  @@index([enrollmentId])
  @@index([templateId])
}

model ECAssessmentAttempt {
  id            String   @id @default(uuid()) @db.Uuid
  enrollmentId  String   @map("enrollment_id") @db.Uuid
  assessmentId  String   @map("assessment_id") @db.Uuid
  
  status        QuizAttemptStatus @default(IN_PROGRESS)
  
  startedAt     DateTime @default(now()) @map("started_at")
  completedAt   DateTime? @map("completed_at")
  timeSpent     Int?     @map("time_spent") // Seconds
  
  // Results
  score         Float?   // 0-100
  passed        Boolean?
  
  // Detailed results (JSON)
  responses     Json     @default("[]")
  
  // Relations
  enrollment    ECEnrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  assessment    ECAssessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  
  @@map("ec_assessment_attempts")
  @@index([enrollmentId])
  @@index([assessmentId])
}

model ECSimulationAttempt {
  id            String   @id @default(uuid()) @db.Uuid
  enrollmentId  String   @map("enrollment_id") @db.Uuid
  simulationId  String   @map("simulation_id") @db.Uuid
  
  status        SimulationAttemptStatus @default(IN_PROGRESS)
  
  startedAt     DateTime @default(now()) @map("started_at")
  completedAt   DateTime? @map("completed_at")
  
  // Results
  score         Float?   // 0-100
  passed        Boolean?
  
  // Detailed results (JSON)
  responses     Json     @default("[]")
  feedback      Json     @default("{}")
  
  // Relations
  enrollment    ECEnrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  simulation    ECSimulation @relation(fields: [simulationId], references: [id], onDelete: Cascade)
  
  @@map("ec_simulation_attempts")
  @@index([enrollmentId])
  @@index([simulationId])
}

enum SimulationAttemptStatus {
  IN_PROGRESS
  COMPLETED
  ABANDONED
}
```

## API Structure

### ECConfig Module

```
/api/ec
├── GET    /                           # List all ECs
├── GET    /:ecCode                    # Get EC by code
├── GET    /:ecCode/elements           # Get elements
├── GET    /:ecCode/modules            # Get modules structure
├── GET    /:ecCode/modules/:moduleCode/lessons  # Get lessons
├── GET    /:ecCode/templates          # Get templates
├── GET    /:ecCode/assessments        # Get assessments
├── GET    /:ecCode/simulations        # Get simulations
```

### ECProgress Module

```
/api/ec-progress
├── GET    /me                         # Get user's EC enrollments
├── POST   /:ecCode/enroll             # Enroll in an EC
├── GET    /:ecCode/progress           # Get progress for EC
├── PATCH  /:ecCode/modules/:moduleId  # Update module progress
├── PATCH  /:ecCode/lessons/:lessonId  # Update lesson progress
├── GET    /:ecCode/portfolio          # Get portfolio status
```

### ECDocuments Module

```
/api/ec-documents
├── GET    /                           # List user's documents
├── POST   /                           # Create new document
├── GET    /:id                        # Get document
├── PATCH  /:id                        # Update document
├── POST   /:id/submit                 # Submit for review
├── GET    /:id/export/pdf             # Export as PDF
```

### ECAssessments Module

```
/api/ec-assessments
├── GET    /:assessmentId              # Get assessment info
├── POST   /:assessmentId/start        # Start attempt
├── PATCH  /:assessmentId/attempts/:attemptId  # Submit answers
├── GET    /:assessmentId/attempts/:attemptId/results  # Get results
```

## Frontend Component Strategy

### Reusable Components (EC-Agnostic)

```
components/
├── ec/
│   ├── ECDashboard.tsx           # Main EC training dashboard
│   ├── ECModuleList.tsx          # Module navigation
│   ├── ECLessonViewer.tsx        # Lesson content renderer
│   ├── ECVideoPlayer.tsx         # YouTube video player
│   ├── ECProgressBar.tsx         # Progress indicators
│   └── ECBreadcrumbs.tsx         # Navigation breadcrumbs
├── documents/
│   ├── DocumentEditor.tsx        # Generic document editor
│   ├── DocumentSection.tsx       # Section renderer
│   ├── DocumentPreview.tsx       # Preview mode
│   └── DocumentExport.tsx        # PDF export
├── assessments/
│   ├── QuizRunner.tsx            # Quiz execution
│   ├── QuestionRenderer.tsx      # Question display
│   ├── QuizResults.tsx           # Results display
│   └── AssessmentHistory.tsx     # Past attempts
├── simulations/
│   ├── SimulationRunner.tsx      # Simulation executor
│   ├── InterviewSimulation.tsx   # Interview type
│   ├── PresentationSimulation.tsx # Presentation type
│   └── SimulationFeedback.tsx    # Results/feedback
└── gamification/
    ├── AchievementBadge.tsx      # Achievement display
    ├── ProgressStreak.tsx        # Streak indicator
    ├── Leaderboard.tsx           # Rankings
    └── PointsDisplay.tsx         # Points counter
```

### Page Structure

```
pages/
├── ec/
│   ├── [ecCode]/
│   │   ├── index.tsx             # EC Dashboard
│   │   ├── modules/
│   │   │   ├── index.tsx         # Module list
│   │   │   └── [moduleCode]/
│   │   │       ├── index.tsx     # Module overview
│   │   │       └── [lessonCode].tsx  # Lesson viewer
│   │   ├── portfolio/
│   │   │   ├── index.tsx         # Portfolio dashboard
│   │   │   └── [documentId].tsx  # Document editor
│   │   ├── assessments/
│   │   │   ├── index.tsx         # Assessment list
│   │   │   └── [assessmentId].tsx  # Take assessment
│   │   └── simulations/
│   │       ├── index.tsx         # Simulation list
│   │       └── [simulationId].tsx  # Run simulation
│   └── index.tsx                 # EC catalog/selection
```

## Adding a New EC Standard

1. **Create EC metadata** in database or seed file
2. **Define elements** with criteria
3. **Create modules** with lesson structure
4. **Add templates** for document portfolio
5. **Write assessments** with questions
6. **Configure simulations** (if applicable)
7. **Add translations** for i18n

No code changes required - all content is configuration-driven!

## Migration from ec0249 Repo

1. **Extract templates** → `ec_templates` table
2. **Extract questions** → `ec_assessments` table  
3. **Extract scenarios** → `ec_simulations` table
4. **Extract module structure** → `ec_modules` + `ec_lessons`
5. **Port components** → React components (reusable)
6. **Port services** → NestJS services (EC-aware)
