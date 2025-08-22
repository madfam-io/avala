# AVALA – Alignment with Mexican & International Standards, and HR Requirements

> **Product:** AVALA — *Alineamiento y Verificación de Aprendizajes y Logros Acreditables*
>
> **Purpose of this brief:** Demonstrate how AVALA’s SOFTWARE\_SPEC aligns with Mexican labor/skills regulations and recognized international standards—while meeting practical HR/business needs for auditability, mobility, and ROI.

---

## 1) Executive Summary

AVALA operationalizes **competency-based training** and **evidence-backed verification**. It natively supports Mexico’s training compliance (LFT/DC‑3/SIRCE) and **Estándares de Competencia (EC/CONOCER)** mapping, while adopting global best practices for learning services (ISO 29993), educational organizations (ISO 21001), quality (ISO 9001 – competence), OH\&S (ISO 45001 – competence), human capital reporting (ISO 30414), data protection (LFPDPPP/GDPR), interoperability (xAPI/cmi5), and portable credentials (Open Badges 3.0 / Verifiable Credentials).

**Outcome for stakeholders**

* **Aprendices:** rutas de aprendizaje alineadas a estándares con evidencias que “viajan” (credenciales verificables).
* **Empresas/HR:** DC‑3 automatizado, planes de capacitación (LFT), SIRCE-ready, métricas de efectividad y ROI.
* **Auditores/Reguladores:** trazabilidad de competencias, portafolios auditables, reportes exportables.

---

## 2) Alignment with Mexican Frameworks (Core)

### 2.1 Ley Federal del Trabajo (LFT) — Capacitación y Adiestramiento

* **Plan y Programa**: AVALA Comply modela el Plan de Capacitación por año/B.U./centro y conserva evidencia (asistencia, contenidos, resultados).
* **Constancias**: Generación y registro de **DC‑3** por persona/curso, con folio/serial y flujo de firmas.
* **Reportabilidad**: Export **SIRCE** (listas de constancias) por periodo/centro, conforme a plantillas oficiales.

**Spec → LFT mapping**

* *Plan LFT* (objeto `LFTPlan`, snapshots inmutables) → demuestra existencia/actualización de planes.
* *DC‑3 API* + serial registry → constancias emitidas y trazables.
* *SIRCE exports* → archivo listo para carga en el sistema STPS.

### 2.2 Estándares de Competencia (EC/CONOCER)

* **EC Mapper**: Importa estructura (elementos → criterios; desempeño/conocimiento/producto) y permite **mapear** lecciones y evaluaciones por criterio.
* **Portafolio de evidencias**: artefactos por criterio con hash, firmas y rúbricas.
* **Dictamen package** (flag ECE/OC): compila evidencia para procesos de acreditación oficial (operados por ECE/OC en SII).

**Beneficio**: del entrenamiento interno a la **pre‑certificación**; el término “acreditables” enmarca la aspiración sin asumir autoridad.

### 2.3 NOM‑035 (psicosocial) — soporte en el ecosistema

* AVALA puede alojar contenidos/planes de sensibilización y evidenciar **formación** y **difusión** exigidas; integra encuestas/seguimiento si el cliente lo requiere. (La certificación NOM‑035 no es objeto del DC‑3; se registra cumplimiento de capacitación interna y comunicación.)

---

## 3) Alignment with International Standards (Learning, Quality, Safety, HCM)

### 3.1 Learning Services & Educational Organizations

* **ISO 29993 (servicios de aprendizaje fuera de la educación formal):** diseño centrado en resultados, información al cliente/aprendiz, evaluación y medición de la eficacia. AVALA cumple mediante: authoring alineado a resultados/criterios, acuerdos claros de servicio (rutas, horas, modalidades), y **medición de efectividad** (readiness vs. EC, time‑to‑competency).
* **ISO 21001 (EOMS):** sistema de gestión para organizaciones educativas; foco en necesidades del aprendiz y otros interesados, diseño de experiencias, evaluación y mejora. AVALA habilita la **gestión por procesos** (plan‑do‑check‑act) con auditorías, reportes, retroalimentación y controles de cambios.

### 3.2 Quality & OH\&S Competence

* **ISO 9001:2015 – 7.2 Competencia:** determinar competencias, cerrar brechas, **retener evidencia**. AVALA cubre matrices de competencia, formación aplicada, evaluación por criterio y **registros** (DC‑3, portafolios, asistencia) para auditoría.
* **ISO 45001:2018 – 7.2 Competencia (SST):** determinar competencias críticas para seguridad, formación, y evidencia de eficacia. AVALA gestiona rutas/controles para roles de riesgo, verificación de competencia y caducidades de entrenamiento.

### 3.3 Human Capital Reporting & Analytics

* **ISO 30414 (HCM reporting):** indicadores de formación (horas, coste, cobertura), movilidad y desempeño. AVALA Analytics produce KPIs y exportables para reporteo interno/externo.

### 3.4 Interoperability & Credentials

* **xAPI/cmi5**: trazabilidad de aprendizaje en cualquier contexto, con LRS integrado y lanzamientos estandarizados.
* **Open Badges 3.0 / Verifiable Credentials:** emisión/verificación de credenciales con alineación a EC y enlaces a evidencia; apto para wallets/verificación pública.

### 3.5 Data Protection & Security (global readiness)

* **México (LFPDPPP)**: principios de licitud, finalidad, proporcionalidad, consentimiento, información y responsabilidad. AVALA implementa **minimización de datos**, avisos de privacidad por tenant, control de acceso por rol y **retención configurable**.
* **UE/UK (GDPR/UK‑GDPR)**: bases legales (contrato/interés legítimo/consentimiento), derechos ARCO/DSAR, seguridad y **accountability** (logs, ROPA, DPIA según aplique). AVALA soporta export/eliminación por solicitud, auditoría y segregación por tenant.
* **Controles**: cifrado en tránsito/reposo, auditorías, RPO/RTO definidos, opción de residencia MX/EU (Enterprise).

---

## 4) AVALA Modules → Standards & HR Needs (Traceability Map)

| AVALA Module                             | Mexican Alignment                                            | International Alignment                      | HR/Business Value                                                        |
| ---------------------------------------- | ------------------------------------------------------------ | -------------------------------------------- | ------------------------------------------------------------------------ |
| **Avala Learn** (Paths/LMS)              | Plan LFT, asistencia y horas por curso                       | ISO 29993 (servicios), ISO 21001 (EOMS)      | Trazabilidad de formación, cumplimiento de planes, preparación al puesto |
| **Avala Assess** (Evaluación/Portafolio) | EC/CONOCER por criterio; evidencia firmada                   | ISO 9001/45001 7.2 (competencia y registros) | Demuestra competencia, reduce riesgo operativo, soporta auditorías       |
| **Avala Comply** (DC‑3/SIRCE/LFT)        | **DC‑3** generado y registrado; **SIRCE** export; plan anual | Soporte a auditorías ISO/cliente             | Cierre del ciclo de cumplimiento; inspecciones sin fricción              |
| **Avala Badges** (Credenciales)          | Reconocimiento interno/sectorial                             | **Open Badges 3.0 / VC**                     | Portabilidad del talento; marca empleadora; movilidad                    |
| **Avala Connect** (SSO/SCIM, HRIS)       | Integraciones para SIRCE/DC‑3/plantillas                     | xAPI/cmi5, SCIM                              | Menor carga administrativa; datos consistentes                           |
| **Analytics** (KPIs)                     | Cobertura, constancias, vencimientos                         | ISO 30414 (HCM métricas)                     | ROI de capacitación, decisiones basadas en datos                         |

---

## 5) HR/Business Requirements Coverage

* **Competency matrices** por rol y centro; **gap‑closing** con planes y fechas objetivo.
* **Records de formación** (asistencia, horas, intentos, resultados) listos para auditoría.
* **Renovaciones y vencimientos** (seguridad, calidad, normativas sectoriales) con alertas.
* **Integración HRIS/IDP** (SCIM/CSV): alta/baja/roles sincronizados, reducción de doble captura.
* **ROI & eficacia**: time‑to‑competency, tasa de aprobación, correlación con KPIs operativos.
* **Movilidad y marca**: credenciales verificables; perfiles exportables (interno/externo).

---

## 6) Jurisdiction & Scope Notes

* **DC‑3/SIRCE/LFT** aplican en México; fuera de MX se usan plantillas equivalentes (certificados internos, matrices de competencia, registros ISO 9001/45001).
* **EC/CONOCER**: la certificación oficial solo la emiten **ECE/OC** vía SII; AVALA prepara **evidencias y dictamen** (cuando el cliente sea ECE/OC o tenga convenio).

---

## 7) Implementation Checklist (Compliance‑ready)

1. **Tenant setup legal**: Avisos de privacidad, bases legales, retención por país.
2. **EC cache**: estándares iniciales por industria; version pinning.
3. **Plan LFT**: cargar programa anual; definir centros de trabajo y grupos objetivo.
4. **Plantillas DC‑3**: validar campos, firmas y numeración (serie única por tenant).
5. **SIRCE export**: parametrizar plantillas por periodo y establecimiento.
6. **Competency rules**: definir criterios de aprobación y evidencias obligatorias por rol.
7. **Risk roles**: rutas y renovaciones para funciones críticas (seguridad/calidad).
8. **xAPI/cmi5**: activar LRS; verificar trazas de lanzamiento y finalización.
9. **OB 3.0/VC**: configurar issuer DID, políticas de rev
