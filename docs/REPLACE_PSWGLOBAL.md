# AVALA vs. PSW Global — Plan de Reemplazo Total

> **Objetivo:** Explicar cómo **AVALA** reemplaza por completo la suite de **PSW Global** (Pyxoom, Testyt, Fydback, Analytix, Studyo, People Analytics/Nine‑Box y la integración de honestidad/ética) con un enfoque SaaS unificado, multi‑tenant y listo para cumplimiento en México e interoperabilidad internacional.

---

## 1) Resumen ejecutivo

**AVALA** es una plataforma *trainee‑first* que cubre **selección**, **evaluación 360°**, **clima/NOM‑035**, **LMS**, **analítica de talento**, **credenciales verificables** y **cumplimiento** (DC‑3/SIRCE/LFT), con mapeo nativo a **Estándares de Competencia (EC/CONOCER)**. Sustituye módulos aislados con un **hub integrado**: una sola identidad, un solo modelo de datos, un solo panel de control y reportes auditablemente consistentes.

**Ventajas clave vs. suite PSW (fragmentada):**

* **Unificación de datos** (persona, rol, criterio, evidencia) → menos fricción y mejores insights.
* **Continuidad post‑hire** (del shortlist a upskilling y certificación interna) → cierra el loop.
* **Compliance out‑of‑the‑box** (DC‑3/SIRCE/Plan LFT; trazabilidad xAPI/cmi5).
* **Credenciales portables** (Open Badges 3.0 / VC) + verificación pública.

---

## 2) Mapa de reemplazo por producto (PSW → AVALA)

| PSW (Producto)                  | Propósito (breve)                                                                                                           | AVALA (Módulo)                                         | Estado de cobertura                                                                                                                                                       |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pyxoom**                      | Selección y desarrollo con **psicometría, competencias, pruebas técnicas**, video‑entrevista, filtros, tracking por vacante | **Avala Assess** + **Avala Learn** + **Avala Connect** | **Paridad+** (bundles, proctor‑lite, reglas de corte, ranking, entrevista estructurada, WhatsApp/Email, ATS opcional; añade mapeo a EC y continuidad a capacitación/DC‑3) |
| **Testyt**                      | **Pruebas técnicas** por rol/área                                                                                           | **Avala Assess** (banco técnico + autoría)             | **Paridad+** (item bank versionado, preguntas abiertas con rúbrica, calificación por criterio, analítica de ítems)                                                        |
| **Fydback**                     | **360° de competencias** (multi‑rater)                                                                                      | **Avala Assess** (360°)                                | **Paridad+** (anonymato configurable, umbrales de rater, IDP automático, métricas de acuerdo inter‑evaluador)                                                             |
| **Analytix**                    | **Clima laboral / NOM‑035** y encuestas internas                                                                            | **Avala Comply** (NOM‑035/Clima + planes de acción)    | **Paridad+** (plantillas NOM‑035, scoring y alertas, action plans con evidencia y due dates; tablero de cumplimiento)                                                     |
| **Studyo**                      | **LMS** para cursos/rutas                                                                                                   | **Avala Learn**                                        | **Paridad+** (paths por rol, asistencia, cmi5/xAPI; SCORM ingest v2; cobertura por **criterio EC**)                                                                       |
| **People Analytics / Nine‑Box** | **Mapa 9‑box**, sucesión                                                                                                    | **Analytics**                                          | **Paridad+** (9‑box dinámico, cohortes, % readiness vs EC, vínculos a rutas de upskilling)                                                                                |
| **Amitai (Honestidad/Ética)**   | Pruebas de integridad                                                                                                       | **Marketplace/Integración** en **Avala Assess**        | **Paridad (integración)** con retención mínima de PII y reportes integrados                                                                                               |

---

## 3) Flujos equivalentes (y mejorados)

### 3.1 Selección (Pyxoom → AVALA)

1. **Perfil/Job** con competencias/EC → 2) **Bundle** (psicometría+técnicas+entrevista) → 3) Invitación (Email/SMS/WhatsApp) → 4) **Proctor‑lite** (foto/flags) → 5) **Ranking** y **shortlist** → 6) Reporte integrado.
   **Mejora:** mapeo a **EC** para transición automática a ruta de capacitación; eventos xAPI/cmi5 para trazabilidad.

### 3.2 360° (Fydback → AVALA)

Definir modelo de competencias → participantes y rater roles → encuestas anónimas → reporte radar/gaps → **IDP** y aprendizaje recomendado.

### 3.3 Clima/NOM‑035 (Analytix → AVALA)

Plantilla RG I/II/III y clima → aplicación segura → scorecards por centro → **planes de acción** con responsables/evidencia → seguimiento y cierres.

### 3.4 LMS (Studyo → AVALA)

Cursos→módulos→lecciones **mapeadas a criterios EC**; rutas por rol; asistencia y evaluaciones; **OB 3.0/VC** al completar.

### 3.5 Analítica (People Analytics → AVALA)

9‑box; readiness vs EC; tiempo‑a‑competencia; embudos de selección; cumplimiento DC‑3/SIRCE; acuerdos de evaluadores.

---

## 4) Migración de datos (sin fricción)

**Objetivo:** preservar histórico útil y re‑operar procesos en AVALA en ≤ 30 días.

* **Pyxoom/Testyt** → Candidatos, vacantes, resultados agregados, bancos técnicos (si exportables).
* **Fydback** → Modelos de competencias, catálogos de ítems, ciclos y reportes (PDF/CSV).
* **Analytix** → Proyectos de clima/NOM‑035 y scorecards; acciones históricas.
* **Studyo** → Cursos/módulos/lecciones (export SCORM/paquetes o re‑import HTML/Media).
* **People Analytics** → Matrices 9‑box/CSV; se recalcula sobre el modelo unificado.

**Estrategia:**

* Importadores CSV/JSON + *adapters* específicos; **hash** de artefactos para integridad;
* Re‑cálculo de KPIs (readiness, tiempos, 9‑box) con el evento base;
* *Freeze* de sistemas legados en lectura 30–60 días (según contrato) mientras se estabiliza AVALA.

---

## 5) Paridad funcional (detalle por módulo AVALA)

### AVALA Assess

* **Psicometría** (propia/terceros), **técnicas** (item bank), **entrevista estructurada** (video/asincrónica), **360°**, **proctor‑lite** (foto/flags), **reglas de corte** y ponderaciones, reportes y fairness checks básicos.

### AVALA Learn

* **Paths** por rol, lecciones mapeadas a **criterios EC**, asistencia, evaluaciones, **xAPI/cmi5**, **SCORM ingest** (v2), **OB 3.0/VC**.

### AVALA Comply

* **DC‑3** (folios/firmas), **SIRCE** (export), **Plan LFT** (snapshots); **NOM‑035** con **planes de acción**.

### Analytics

* **9‑box**, **readiness vs EC**, **time‑to‑competency**, embudos de selección, cobertura DC‑3, acuerdos evaluadores.

### Connect (Integraciones)

* **SSO/OIDC/SCIM**, ATS (Greenhouse/Lever/Workable o landing propia), WhatsApp Business, Email/SMS, e‑sign.

---

## 6) Trazabilidad y cumplimiento (MX + internacional)

* **LFT/STPS**: Plan anual, asistencia, **DC‑3/SIRCE**.
* **EC/CONOCER**: mapeo por **criterio** y *dictamen package* (cuando el cliente opera como ECE/OC).
* **NOM‑035**: RG I/II/III, scorecards, **acciones** y evidencias.
* **ISO 9001/45001/21001/29993**: evidencia de competencia y eficacia;
* **xAPI/cmi5**: trazas estándar; **Open Badges 3.0**: credenciales portables.

---

## 7) Roadmap de reemplazo (12–16 semanas)

1. **Semana 1–2:** *Discovery* y conectores de export (Pyxoom/Testyt/Fydback/Analytix/Studyo).
2. **Semana 3–4:** Importadores + *data mapping*; librería de perfiles/competencias; bundles por rol.
3. **Semana 5–6:** Piloto **selección** (2 vacantes) + **NOM‑035** (1 sitio).
4. **Semana 7–8:** Piloto **360°** + **LMS** (2 cursos críticos); ajuste de cortes y rúbricas.
5. **Semana 9–10:** Encendido **DC‑3/SIRCE**; credenciales OB 3.0; tablero de cumplimiento.
6. **Semana 11–12:** Piloto 9‑box + BI; hardening (SSO/SCIM, retención/PII).
7. **Semana 13–16:** *Cutover* por oleadas; legado en lectura; revisión post‑implantación.

---

## 8) KPIs de éxito (post‑reemplazo)

* **Selección:** tiempo‑a‑shortlist −25% o más; ≥85% tasa de finalización de evaluaciones; satisfacción del *hiring manager* ≥4/5.
* **360°:** ≥80% tasa de participación; ≥0.8 acuerdo inter‑evaluador; ≥70% con **IDP** generado.
* **NOM‑035/Clima:** ≥80% respuesta; 100% planes con dueño y fecha; cierre de acciones ≥75% en 90 días.
* **LMS:** ≥85% completitud en rutas críticas; tiempo‑a‑competencia −30%.
* **Compliance:** 0 hallazgos en auditoría DC‑3/SIRCE; trazas xAPI completas; credenciales verificables públicas.

---

## 9) Riesgos y mitigaciones

* **Export limitado desde PSW** → *Adapters* por *scrape*/PDF→JSON, captura de histórico mínimo viable, re‑evaluación muestral.
* **Propiedad intelectual de ítems** → acuerdos de uso o **autoría propia** acelerada con *item factory* y revisión psicométrica.
* **Cambio cultural** → playbooks por rol, guías rápidas, *office hours* UAT.
* **Regulatorio** → validadores internos para DC‑3/SIRCE/NOM‑035; auditorías de datos y consentimiento.

---

## 10) Entregables

* **Plan de migración** firmado + *runbooks*.
* **Catálogo** de competencias/perfiles por industria.
* **Bundles** por rol (psicometría+técnicas+entrevista).
* **Plantillas** NOM‑035 y clima con acciones.
* **Dashboards** de selección, 360°, NOM‑035, LMS y cumplimiento.
* **Reportes ejecutivos** (PDF/CSV) y **credenciales OB 3.0**.

---

## 11) Nota legal

AVALA **no** emite certificaciones EC oficiales; prepara evidencias y paquetes de dictamen para entidades **ECE/OC** que operan en SII. La emisión de **DC‑3** se realiza por el empleador o ACE conforme a LFT/STPS.
