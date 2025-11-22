# AVALA LMS - Competency Standards Data

This directory contains real-world competency standards data from CONOCER (Consejo Nacional de Normalización y Certificación de Competencias Laborales - Mexico).

## EC0217.01 - Training Instructor Standard

**Full Title**: Impartición de cursos de formación del capital humano de manera presencial grupal

**Translation**: Teaching training courses for human capital in face-to-face group settings

### Overview

EC0217.01 is the **most widely used competency standard in Mexico** for training and development professionals. It certifies individuals who deliver in-person group training sessions.

### Structure

The standard is organized hierarchically:

```
Competency Standard (EC0217.01)
├── Element 1: Prepare the session through training planning
│   ├── 7 Performance Criteria (Products)
│   └── 5 Knowledge Criteria
│
├── Element 2: Conduct the session using instructional and group techniques
│   ├── 10 Performance Criteria (Performance/Desempeño)
│   └── 4 Knowledge Criteria
│
└── Element 3: Evaluate learning before, during, and at the end of the course
    ├── 6 Performance Criteria (Performance and Products)
    └── 3 Knowledge Criteria
```

**Total**: 3 Elements, 36 Criteria (23 Performance + 12 Knowledge + 1 Attitude)

### Elements Breakdown

#### Element 1: Preparar la sesión (Prepare the session)
Focuses on planning and preparation:
- Course objectives (general and specific)
- Topic and subtopic selection
- Instructional techniques selection
- Group techniques selection
- Evaluation instruments

**Key Knowledge**:
- Learning domains (cognitive, affective, psychomotor)
- Taxonomy of learning objectives
- Instructional techniques
- Group techniques
- Evaluation instruments

#### Element 2: Conducir la sesión (Conduct the session)
Focuses on session delivery:
- Framing/Encuadre (opening)
- Building rapport
- Creating appropriate learning environment
- Applying instructional techniques
- Using didactic materials
- Verbal and non-verbal communication

**Key Knowledge**:
- Communication (verbal and non-verbal)
- Group management
- Didactic materials
- Framing components

#### Element 3: Evaluar el aprendizaje (Evaluate learning)
Focuses on assessment:
- Diagnostic evaluation (pre-course)
- Formative evaluation (during course)
- Summative evaluation (end of course)
- Providing effective feedback
- Recording results

**Key Knowledge**:
- Types of evaluation
- Characteristics of effective feedback
- Results registration

### Evidence Types

The standard uses three types of evidence:

1. **PRODUCT** (Producto): Tangible deliverables
   - Lesson plans
   - Evaluation instruments
   - Results records

2. **PERFORMANCE** (Desempeño): Observable actions
   - Conducting the session
   - Facilitating group activities
   - Providing feedback

3. **KNOWLEDGE** (Conocimiento): Theoretical understanding
   - Learning theories
   - Instructional design principles
   - Evaluation methodologies

### Criterion Types

- **PERFORMANCE**: What the person must do or produce
- **KNOWLEDGE**: What the person must know
- **ATTITUDE**: How the person must behave (not extensively used in this standard)

### Usage in AVALA LMS

This standard can be used to:

1. **Create Courses**: Align training courses to EC0217.01
2. **Map Competencies**: Link course modules/lessons to specific elements
3. **Generate Evidence**: Track learner progress against performance criteria
4. **Issue Certificates**: Generate DC-3 certificates referencing the standard
5. **Demonstrate Compliance**: Meet Mexican labor law requirements (Article 153-V)

### Seeding the Database

To populate your database with this standard:

```bash
# From the packages/db directory
pnpm db:seed:ec

# Or from the root of the monorepo
cd packages/db && pnpm db:seed:ec
```

The script is **idempotent** - safe to run multiple times without creating duplicates.

### Real-World Application

EC0217.01 is used by:
- Corporate training departments
- Professional training institutes
- Independent trainers and consultants
- Government training programs
- Educational institutions

Certification under this standard is recognized by:
- CONOCER (federal certification body)
- STPS (Secretaría del Trabajo y Previsión Social)
- Employers across Mexico
- International organizations operating in Mexico

### References

- **CONOCER**: https://conocer.gob.mx
- **Standard Registry**: EC0217.01 published August 2012
- **Legal Framework**: Ley Federal del Trabajo, Article 153-A through 153-V

### Note

This data is based on the official CONOCER standard EC0217.01. The descriptions are authentic and reflect the actual requirements for professional certification in Mexico.
