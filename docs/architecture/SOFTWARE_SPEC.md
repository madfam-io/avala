# SOFTWARE\_SPEC.md

> **Producto:** **AVALA** — *Alineamiento y Verificación de Aprendizajes y Logros Acreditables*
> **One-liner:** Plataforma SaaS, multi-tenant y *trainee-first* para diseñar, impartir, evidenciar y **verificar aprendizajes aplicados** alineados a **Estándares de Competencia (EC/CONOCER)**; genera **DC-3**, prepara **SIRCE/LFT**, y emite **credenciales verificables** (Open Badges 3.0 / VC).
> **Audiencia primaria:** MADFAM (dogfooding) → industria LATAM y aliados de capacitación.

---

## 0) Alcance, Objetivos y No-objetivos

**Objetivos (MVP):**

* Autoría y entrega de formación mapeada a **Estándares de Competencia** con cobertura por **criterio**.
* Evaluación multi-método y **Portafolio de Evidencias** por aprendiz; trazabilidad auditable.
* Generación de **DC-3** (firmas y folio/serial) y **exportables SIRCE**; conservación de **Plan de Capacitación** (LFT).
* Emisión de **Open Badges 3.0 (VC)** con alineación a EC y enlaces a evidencias.
* Operación **multi-tenant** con SSO/RBAC, auditoría y analítica base (*readiness* vs EC).

**No-objetivos (MVP):**

* Emisión oficial de certificaciones **EC** (requiere **ECE/OC** + operación SII). Proveemos **pre-evaluación** y *dictamen package*.
* Autoría SCORM completa (ingesta/seguimiento en v2; **xAPI/cmi5** desde día 1).
* Ser un HRIS integral; nos integramos (SCIM/CSV).

---

## 1) Marca y Mensaje

* **Nombre:** **AVALA**
* **Econym:** *Alineamiento y Verificación de Aprendizajes y Logros Acreditables*.
* **Tagline corto:** *Aprendizajes aplicados, verificados.*
* **Arquitectura de módulos:**

  * **Avala Learn** (LMS / Paths)
  * **Avala Assess** (Evaluaciones & Portafolio)
  * **Avala Comply** (DC-3 / SIRCE / LFT)
  * **Avala Badges** (Credenciales OBv3/VC)
  * **Avala Connect** (Integraciones, SSO/SCIM, HRIS)

---

## 2) Personas & Roles (RBAC)

* **Org Owner / Admin:** configuración, facturación, integraciones.
* **Compliance Officer:** DC-3, SIRCE, Plan LFT, auditorías.
* **ACE/ECE-OC Admin (flag):** flujos acreditados, dictamen.
* **Assessor/Evaluator:** califica por criterio, firma evidencias.
* **Instructor/Coach:** sesiones, tareas, feedback.
* **Supervisor:** inscripciones, observaciones en sitio.
* **Trainee/Aprendiz:** completa rutas, sube evidencias, recibe credenciales.

**Permisos base:** `admin:*`, `compliance:*`, `assessor:rw`, `instructor:rw`, `supervisor:rw`, `trainee:r|w(self)`; *Row Level Security* por tenant/B.U./sitio.

---

## 3) Módulos y Requisitos Funcionales

### 3.1 **EC-Aligned Authoring** (Avala Learn)

* Buscar/seleccionar **EC** (por código/título) e **importar estructura** (elementos → criterios).
* Mapear lecciones/tareas/evaluaciones a **criterios** (desempeño/conocimiento/producto).
* **Coverage Meter**: % criterios cubiertos + *gaps*.
* **Plantillas de evidencia** por EC (rúbricas, listas de cotejo, guías de entrevista).
* *Version pinning* de EC por cohorte.

**Criterios de aceptación:**

* Autor cubre ≥90% de criterios objetivo; reporte de cobertura exacto y exportable.

---

### 3.2 **Delivery & Paths** (Avala Learn)

* Rutas de aprendizaje (prerrequisitos, fechas, recordatorios, asistencia).
* PWA móvil; **captura offline** de evidencia → *background upload*.
* Emisión de eventos **xAPI/cmi5** (launch, progress, completion).

**Criterios:**

* 100% de lanzamientos generan declaraciones válidas; asistencia consultable por curso y periodo.

---

### 3.3 **Assessment & Portafolio** (Avala Assess)

* Métodos: *quiz*, observación, entrevista estructurada, *task check-off*, archivo/video/URL.
* Calificación **por criterio** (escala configurable) + rúbricas; multi-evaluador.
* **Portafolio de Evidencias** con **hash** por artefacto, firma del evaluador y sello temporal.
* Métrica de acuerdo inter-evaluador (κ o %).

**Criterios:**

* Export del portafolio incluye rúbricas, artefactos (refs), firmas y hash registry.

---

### 3.4 **Compliance** (Avala Comply)

* **DC-3**: campos oficiales, PDF, **serial/folio**, flujo de firmas (empleador/ACE + trabajador).
* **Plan LFT**: año, B.U., programa, eventos, asistentes; *snapshots* inmutables.
* **SIRCE**: export por periodo/centro de trabajo (validación de esquema).

**Criterios:**

* DC-3 válido y trazable; SIRCE export pasa validación interna; Plan LFT bloqueable (*lock*).

---

### 3.5 **ECE/OC Toolkit** (feature flag)

* Registro de candidato (CURP/RFC/PII), agenda, asignación de evaluador.
* **Dictamen package** (portafolio + rúbricas + firmas) para **SII** (carga manual por ECE/OC).

**Criterios:**

* Paquete completo con checklist; permisos por rol.

---

### 3.6 **Credenciales** (Avala Badges)

* Emisión **Open Badges 3.0 / VC**: issuer DID, logro, alineación EC, evidencia.
* Endpoint público de verificación; **revocación** (StatusList).

**Criterios:**

* Verificación pública correcta; revocación reflejada ≤5 min.

---

### 3.7 **Analítica & Reportes**

* **Readiness vs EC** (por criterio/cohorte/sitio), **time-to-competency**, **acuerdo evaluadores**, **DC-3** emitidos/por vencer, **cobertura SIRCE**.
* Exports CSV/JSON; reportes programados por email.

**Criterios:**

* KPIs cuadran con *event store*; exports idempotentes.

---

## 4) Modelo de Datos (alto nivel)

```
Tenant(id, name, plan, settings_json, created_at)
User(id, tenant_id, email, role, status, sso_subject, created_at)

Standard(id, issuer, code, title, version, locale, structure_json, created_at)         -- EC
Element(id, standard_id, index, title, description)
Criterion(id, element_id, type ENUM[desempeño, conocimiento, producto], code, text, weight)

Course(id, tenant_id, title, description, ec_codes[], version, status, owner_id)
Module(id, course_id, title, order)
Lesson(id, module_id, title, content_ref, duration_min, criteria[])                     -- map a Criterion[]

Path(id, tenant_id, title, description)
PathItem(id, path_id, course_id, order, required)

Assessment(id, tenant_id, course_id, method ENUM[quiz, observation, interview, task], policy_json)
Rubric(id, assessment_id, criterion_id, scale_min, scale_max, descriptors_json)

Enrollment(id, path_id, trainee_id, supervisor_id, status, started_at, due_at)
Attempt(id, assessment_id, trainee_id, assessor_id, started_at, finished_at, score_json) -- por criterio
Artifact(id, trainee_id, assessment_id, type ENUM[file, video, url, note, observation], ref, hash, signer_id, ts)
Portfolio(id, trainee_id, status, summary_json)

Attendance(id, lesson_id, trainee_id, date, status, minutes)

DC3(id, trainee_id, course_id, employer_id, signer_ids[], issued_at, serial, pdf_ref, status)
LFTPlan(id, tenant_id, year, bu, program_json, created_at, locked_at)
SIRCEExport(id, tenant_id, period, file_ref, status, created_at)

Credential(id, trainee_id, type ENUM[obv3], payload_json, status ENUM[active, revoked], issued_at)

Event(id, tenant_id, subject_type, subject_id, verb, data_json, ts)                     -- xAPI/cmi5 mirror
AuditLog(id, tenant_id, actor_id, action, target, diff_json, ts)
```

**Notas:**

* Evidencias en *object storage* con **hash SHA-256**; *signed URLs*.
* `structure_json` conserva *snapshot* de EC para **version pinning**.

---

## 5) API Pública (representativa)

### 5.1 Auth & Tenant

```
POST /v1/auth/login
POST /v1/auth/refresh
GET  /v1/tenants/self
```

### 5.2 Estándares (EC)

```
GET  /v1/ec/search?q=EC0217
GET  /v1/ec/{code}                 -- elementos & criterios
POST /v1/ec/cache                  -- admin-only (refresh del caché local)
```

### 5.3 Autoría

```
POST  /v1/courses
PATCH /v1/courses/{id}
POST  /v1/courses/{id}/modules
POST  /v1/modules/{id}/lessons
POST  /v1/lessons/{id}/criteria    -- mapea lesson→criterios
GET   /v1/courses/{id}/coverage    -- % cobertura por EC
```

### 5.4 Delivery & Assessment

```
POST /v1/paths
POST /v1/paths/{id}/enrollments
POST /v1/assessments
POST /v1/assessments/{id}/attempts
PATCH /v1/attempts/{id}/scores     -- calificaciones por criterio
POST /v1/artifacts                 -- subida de evidencia (archivo/url + hash)
GET  /v1/trainees/{id}/portfolio
```

### 5.5 Compliance

```
POST /v1/dc3                       -- genera constancia y PDF
GET  /v1/dc3/{id}
GET  /v1/lft/plan/{year}
POST /v1/sirce/exports             -- crea export por periodo
GET  /v1/sirce/exports/{id}
```

### 5.6 Credenciales

```
POST /v1/credentials/obv3
POST /v1/credentials/revoke
GET  /v1/credentials/verify/{id}   -- verificación pública
```

### 5.7 Interoperabilidad

```
POST /v1/xapi/statements           -- LRS endpoint
POST /v1/cmi5/launch               -- entrega token de lanzamiento
```

**Convenciones:** REST/JSON, OAuth2/OIDC, SCIM 2.0 (Enterprise), *idempotency keys* para creación.

---

## 6) Flujos Clave (Happy Paths)

**W1 — Construir formación alineada a EC**

1. Admin selecciona EC e importa estructura.
2. Autor crea curso→módulos→lecciones; mapea a criterios.
3. Coverage Meter muestra % y *gaps*.
4. Publica curso y lo agrega a una ruta.

**W2 — Entrenar y evaluar**

1. Supervisor inscribe; aprendiz completa lecciones y tareas.
2. Evaluador observa/valora con rúbrica por criterio; aprendiz sube evidencias.
3. Portafolio consolida artefactos con hash y firmas.

**W3 — DC-3 & cumplimiento**

1. Sistema valida reglas (asistencia, calificación).
2. Genera **DC-3** PDF; registra serial/firmas.
3. Actualiza **export SIRCE** y Plan LFT.

**W4 — ECE/OC (flag)**

1. Alta de candidato; asignación; agenda.
2. Compila **dictamen package**.
3. Export de datos para SII (carga por entidad acreditada).

**W5 — Credenciales**

1. Emite **OBv3/VC** con mapeo a EC y enlaces de evidencia.
2. Verificación pública; revocación cuando aplique.

---

## 7) Requisitos No Funcionales

* **Seguridad:** TLS ≥1.2; cifrado en reposo; RLS por tenant; *signed URLs*; *least privilege*; **audit log** completo.
* **Privacidad:** minimización PII; consentimiento; retención configurable (por defecto: artefactos 24 meses; DC-3/Plan 5 años).
* **Disponibilidad:** 99.5% (MVP) / 99.9% (Enterprise); RPO ≤1h, RTO ≤4h.
* **Performance:** P95 lectura estándar ≤300ms; cargas de evidencia *streaming/resumable*.
* **Accesibilidad:** WCAG 2.1 AA (trainee & assessor).
* **I18N:** ES base; EN listo; formatos locales.
* **Observabilidad:** trazas, métricas, logs estructurados; alertas SLO.

---

## 8) Arquitectura

**Frontend:** React/Next.js (PWA), React Query, *resumable uploads*, caché offline.
**Backend:** Monolito modular (NestJS/Go) con *bounded contexts* (Authoring, Delivery, Assessment, Compliance, Credentials, LRS).
**Datos:** PostgreSQL (+RLS), S3-compatible storage, Redis (colas/sesiones).
**Eventos:** Bus → *event store* → warehouse (BI).
**Interoperabilidad:** **xAPI/cmi5** nativo; **SCORM ingesta** (read-only) v2.
**Integraciones:** SSO (Entra/Google), SCIM, Email/SMS, e-signature, HRIS (CSV/iPaaS).

**Extracción a servicios (post-PMF):**

* LRS/Assessment • Compliance (DC-3/SIRCE) • Credentials • Reporting/OLAP.

---

## 9) Contratos de Datos (muestras)

### 9.1 DC-3 (JSON)

```json
{
  "dc3_id": "uuid",
  "tenant_id": "uuid",
  "trainee": { "id": "uuid", "name": "string", "curp": "string", "rfc": "string", "job_title": "string" },
  "employer": { "id": "uuid", "business_name": "string", "rfc": "string", "address": "string", "work_center": "string" },
  "training": {
    "course_id": "uuid",
    "course_title": "string",
    "hours": 20,
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD",
    "modality": "presencial|mixta|en_linea",
    "ec_codes": ["EC0217.01"]
  },
  "signers": [
    {"role": "empleador|ACE", "name": "string", "position": "string", "signed_at": "ISO8601"},
    {"role": "trabajador", "name": "string", "signed_at": "ISO8601"}
  ],
  "serial": "DC3-2025-000123",
  "pdf_ref": "s3://.../dc3-...pdf",
  "status": "issued|revoked",
  "created_at": "ISO8601"
}
```

### 9.2 Cobertura EC (JSON)

```json
{
  "course_id": "uuid",
  "ec_code": "EC0217.01",
  "criteria_total": 42,
  "criteria_covered": 40,
  "coverage_pct": 95.2,
  "gaps": [{"criterion_id": "c-35", "text": "..." }],
  "scanned_at": "ISO8601"
}
```

---

## 10) Eventos mínimos (xAPI/cmi5)

`launched`, `initialized`, `progressed`, `completed`, `passed/failed`,
`satisfied-criterion`, `artifact-uploaded`, `assessed`.

Contexto: `tenant`, `path`, `course`, `ec_code`, `criterion_id`.

---

## 11) KPIs

* **Readiness vs EC:** % criterios satisfechos (por aprendiz/cohorte/sitio).
* **Time-to-Competency:** inicio→certificación interna (p50/p90).
* **Acuerdo evaluadores:** κ o % por criterio.
* **Compliance:** DC-3 emitidos/pendientes/vencimientos; cobertura SIRCE; asistencia.
* **Engagement:** % completado de lecciones, *overdues*, respuesta a recordatorios.

---

## 12) Seguridad, Privacidad y Legal

* **Autoridad:** solo **ECE/OC** emiten certificación **EC** oficial; AVALA **prepara** y **verifica** evidencias.
* **PII & Evidencias:** cifrado, acceso por rol y sitio; *hashing* y *timestamps*; *redaction* bajo solicitud.
* **Residencia de datos:** MX por defecto; opción UE (Enterprise).
* **Auditoría:** *audit log* inmutable; registro de seriales DC-3; validadores SIRCE.

---

## 13) Plan de Entrega (90–120 días)

* **Fase 0 (Sem 1–4):** Tenant/RBAC, caché EC, autoría, coverage meter, portafolios.
* **Fase 1 (Sem 5–8):** DC-3, Plan LFT, asistencia, SIRCE export, analítica v1.
* **Fase 2 (Sem 9–12):** LRS + cmi5/xAPI, OBv3 issuer + verificación pública, acuerdo evaluadores.
* **Fase 3 (Sem 13–16):** SCORM ingesta, toolkit ECE/OC, *enterprise hardening* (SCIM, DPA).

---

## 14) Riesgos & Mitigaciones

* **Sin API pública de EC/CONOCER:** caché RENEC + edición admin; *version pinning*.
* **Variabilidad de evaluadores:** calibración, doble evaluación, métricas de acuerdo con alertas.
* **Auditorías exigentes:** seriales DC-3, logs inmutables, validadores automáticos.
* **Privacidad en evidencias:** PII mínima, vistas enmascaradas, retención/redacción.

---

## 15) Test Plan (muestra)

**Unit:**

* Cálculo de cobertura EC; validador DC-3; hashing de artefactos.

**Integración:**

* W2 E2E: inscripción → intento → artefacto → export de portafolio.
* DC-3 → SIRCE: generar, exportar y re-importar para validar idempotencia.

**E2E Aceptación:**

* Curso alineado a EC → finalización → evaluación por criterio → DC-3 emitido → OBv3 verificable → dashboards actualizados.

---

## 16) Configuración & DevOps (resumen)

* **ENV críticos:** `DB_URL`, `S3_BUCKET`, `JWT_SECRET`, `OIDC_CLIENT/*`, `ENCRYPTION_KEY`, `LRS_ENDPOINT`, `MAIL_PROVIDER/*`.
* **Pipelines:** *lint/test/build*, *db migrations*, *smoke tests* por entorno.
* **Backups:** DB (15m), objetos (diario); DR runbook.
* **Infra mínima:** 2× app nodes, 1× DB HA, 1× Redis, 1× object storage, CDN para estáticos.

---

## 17) Glosario

* **EC/CONOCER:** Estándares de Competencia (México).
* **DC-3:** Constancia de habilidades laborales.
* **SIRCE/LFT:** Reportes de capacitación (STPS) / Ley Federal del Trabajo.
* **ECE/OC/SII:** Entidad de Certificación y Evaluación / Organismo Certificador / Sistema Informático de CONOCER.
* **xAPI/cmi5:** Estándares de *e-learning* para seguimiento.
* **Open Badges 3.0 / VC:** Credenciales verificables (W3C).

---

## 18) Preguntas Abiertas

* Proveedor de firma para DC-3 (nativo vs externo; e.firma para ciertos flujos).
* Lista priorizada de EC para *dogfooding* (p.ej., EC0217.01, EC0301).
* Política de residencia por tenant (MX default, EU opcional).
* Umbrales mínimos de evaluadores/anonymato en evaluaciones 360-like (si se usan).

---

## 19) Bitácora de Cambios

* `v0.1.0` — Especificación inicial **AVALA** (este documento).

---

**Owner:** Producto/Ingeniería — **AVALA**
**Estado:** *Draft* — listo para descomponer en *epics*/*user stories* (Sprint 1).
