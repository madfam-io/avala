# AVALA Pricing & Conversion Funnel Design

> **Document Version:** 1.0  
> **Status:** Design Phase  
> **Last Updated:** 2025-11-28

---

## 1. Pricing Strategy

### 1.1 Pricing Model

**Model:** Per-seat subscription with tier-based feature access

**Billing Options:**
- Monthly (displayed price)
- Annual (20% discount, emphasized)

**Currency:** MXN (Mexican Peso) primary, USD secondary

### 1.2 Tier Structure

| Tier | Target Segment | Price Point | Key Differentiator |
|------|----------------|-------------|-------------------|
| **Starter** | SMB, pilot programs | Entry-level | Learn + Assess basics |
| **Profesional** | Mid-market, compliance-focused | Mid-range | Full compliance suite |
| **Enterprise** | Large orgs, ECE/OC | Custom | API, SSO, dedicated support |

---

## 2. Pricing Tiers Detail

### 2.1 Starter

```
Price: $2,499 MXN/mes (o $1,999/mes facturado anual)
       ~$150 USD/mes

Included:
├── Usuarios: Hasta 50 activos
├── Almacenamiento: 10 GB
└── Soporte: Email (48h respuesta)

Módulos:
├── ✓ Avala Learn
│   ├── Rutas de aprendizaje ilimitadas
│   ├── Contenido SCORM/xAPI
│   ├── Tracking de progreso
│   └── PWA móvil
├── ✓ Avala Assess
│   ├── Evaluaciones ilimitadas
│   ├── Rúbricas básicas
│   ├── Portafolio de evidencias
│   └── Calificación por criterio
├── ◐ Avala Comply (limitado)
│   ├── 5 EC activos máximo
│   ├── DC-3 manual (sin auto-gen)
│   └── Reportes básicos
├── ✗ Avala Badges
└── ✗ Avala Connect

Limitaciones:
• Sin generación automática de DC-3
• Sin export SIRCE
• Sin credenciales verificables
• Sin API access
• Sin SSO
```

### 2.2 Profesional ⭐ (Recommended)

```
Price: $6,999 MXN/mes (o $5,599/mes facturado anual)
       ~$400 USD/mes

Included:
├── Usuarios: Hasta 200 activos
├── Almacenamiento: 50 GB
└── Soporte: Email prioritario + Chat (24h respuesta)

Módulos:
├── ✓ Todo de Starter, más:
├── ✓ Avala Learn (completo)
│   ├── Mapeo a criterios EC
│   ├── Coverage meter
│   └── Analítica avanzada
├── ✓ Avala Assess (completo)
│   ├── Multi-evaluador
│   ├── Acuerdo inter-evaluador
│   └── Rúbricas personalizables
├── ✓ Avala Comply (completo)
│   ├── EC ilimitados
│   ├── DC-3 automático con folio
│   ├── Export SIRCE validado
│   ├── Plan LFT con snapshots
│   └── Audit trail completo
├── ✓ Avala Badges
│   ├── Credenciales OBv3 ilimitadas
│   ├── Verificación pública
│   └── Revocación
└── ◐ Avala Connect (parcial)
    ├── Webhooks
    ├── CSV import/export
    └── API de lectura

Nuevo vs Starter:
• ✓ DC-3 automático
• ✓ SIRCE export
• ✓ Credenciales verificables
• ✓ EC ilimitados
• ✓ API de lectura
```

### 2.3 Enterprise

```
Price: Personalizado (desde $15,000 MXN/mes)
       Contactar para cotización

Included:
├── Usuarios: Ilimitados
├── Almacenamiento: Ilimitado
└── Soporte: Dedicado + SLA

Módulos:
├── ✓ Todo de Profesional, más:
├── ✓ Avala Connect (completo)
│   ├── SSO (SAML, OIDC)
│   ├── SCIM provisioning
│   ├── API completa (lectura/escritura)
│   ├── Webhooks avanzados
│   └── Integraciones HRIS
└── ✓ Características Enterprise
    ├── Multi-tenant / multi-sede
    ├── Marca blanca (white-label)
    ├── SLA 99.9% garantizado
    ├── Ambiente dedicado (opcional)
    ├── Onboarding personalizado
    ├── Customer Success Manager
    └── Facturación flexible

Add-ons disponibles:
• ECE/OC Toolkit ($X,XXX/mes)
• Implementación premium
• Capacitación on-site
• Auditoría de cumplimiento
```

---

## 3. Feature Comparison Matrix

```
                           Starter    Profesional   Enterprise
───────────────────────────────────────────────────────────────
USUARIOS
  Usuarios activos          50          200         Ilimitado
  Roles personalizados      ✗           ✓           ✓
  SSO/SCIM                  ✗           ✗           ✓

AVALA LEARN
  Rutas de aprendizaje      ✓           ✓           ✓
  Contenido SCORM/xAPI      ✓           ✓           ✓
  Mapeo a criterios EC      Básico      Completo    Completo
  Coverage meter            ✗           ✓           ✓
  Analítica avanzada        ✗           ✓           ✓

AVALA ASSESS
  Evaluaciones              ✓           ✓           ✓
  Portafolio evidencias     ✓           ✓           ✓
  Multi-evaluador           ✗           ✓           ✓
  Acuerdo inter-evaluador   ✗           ✓           ✓
  Rúbricas personalizables  Limitado    ✓           ✓

AVALA COMPLY
  Estándares EC activos     5           Ilimitado   Ilimitado
  DC-3 manual               ✓           ✓           ✓
  DC-3 automático           ✗           ✓           ✓
  Export SIRCE              ✗           ✓           ✓
  Plan LFT                  ✗           ✓           ✓
  Audit trail               Básico      Completo    Completo

AVALA BADGES
  Credenciales OBv3         ✗           Ilimitado   Ilimitado
  Verificación pública      ✗           ✓           ✓
  Revocación                ✗           ✓           ✓
  Branding personalizado    ✗           ✗           ✓

AVALA CONNECT
  Webhooks                  ✗           ✓           ✓
  API lectura               ✗           ✓           ✓
  API escritura             ✗           ✗           ✓
  Integraciones HRIS        ✗           ✗           ✓

SOPORTE
  Email                     48h         24h         Prioritario
  Chat                      ✗           ✓           ✓
  Teléfono                  ✗           ✗           ✓
  CSM dedicado              ✗           ✗           ✓
  SLA garantizado           ✗           ✗           99.9%

ALMACENAMIENTO
  Incluido                  10 GB       50 GB       Ilimitado
  Adicional                 $99/10GB    $99/10GB    Incluido
```

---

## 4. Pricing Page Design

### 4.1 Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│  NAVIGATION (same as landing)                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  HERO                                                       │
│  "Precios simples, valor claro"                            │
│  "Elige el plan que impulse tu cumplimiento"               │
│                                                             │
│  [Toggle: Mensual | Anual (ahorra 20%)]                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PRICING CARDS (3 columns)                                  │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                    │
│  │ Starter │  │⭐ Prof. │  │Enterpris│                    │
│  │         │  │         │  │         │                    │
│  │ $2,499  │  │ $6,999  │  │ Custom  │                    │
│  │         │  │         │  │         │                    │
│  │ [Trial] │  │ [Trial] │  │[Contact]│                    │
│  └─────────┘  └─────────┘  └─────────┘                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FEATURE COMPARISON TABLE                                   │
│  (Expandable/collapsible by category)                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FAQ                                                        │
│  Billing, upgrades, trials, etc.                           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FINAL CTA                                                  │
│  "¿Necesitas ayuda para elegir?"                           │
│  [Hablar con Ventas]                                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  FOOTER                                                     │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Pricing Card Design

```
┌────────────────────────────────┐
│  STARTER                       │
│  ───────                       │
│  Para equipos que inician      │
│                                │
│  $2,499                        │
│  MXN/mes                       │
│  ────────────                  │
│  Facturado mensualmente        │
│  o $1,999/mes anual            │
│                                │
│  [Iniciar prueba gratis]       │  ← Ghost button
│                                │
│  ─────────────────────────     │
│  ✓ Hasta 50 usuarios           │
│  ✓ Avala Learn completo        │
│  ✓ Avala Assess completo       │
│  ✓ 5 estándares EC             │
│  ✓ Portafolio de evidencias    │
│  ✓ Soporte email               │
│                                │
│  ✗ DC-3 automático             │  ← Grayed out
│  ✗ Export SIRCE                │
│  ✗ Credenciales verificables   │
└────────────────────────────────┘

┌────────────────────────────────┐
│  ⭐ PROFESIONAL                │  ← Highlighted border
│  ─────────────                 │
│  El más popular                │  ← Badge
│                                │
│  $6,999                        │
│  MXN/mes                       │
│  ────────────                  │
│  Facturado mensualmente        │
│  o $5,599/mes anual (ahorra 20%)│
│                                │
│  [Iniciar prueba gratis]       │  ← Filled primary button
│                                │
│  ─────────────────────────     │
│  Todo de Starter, más:         │
│  ✓ Hasta 200 usuarios          │
│  ✓ DC-3 automático con folio   │
│  ✓ Export SIRCE validado       │
│  ✓ Plan LFT con snapshots      │
│  ✓ Credenciales OBv3           │
│  ✓ API de lectura              │
│  ✓ Soporte prioritario         │
└────────────────────────────────┘

┌────────────────────────────────┐
│  ENTERPRISE                    │
│  ──────────                    │
│  Para grandes organizaciones   │
│                                │
│  Personalizado                 │
│  ────────────                  │
│  Contacta para cotización      │
│                                │
│  [Contactar ventas]            │  ← Secondary button
│                                │
│  ─────────────────────────     │
│  Todo de Profesional, más:     │
│  ✓ Usuarios ilimitados         │
│  ✓ SSO/SCIM                    │
│  ✓ API completa                │
│  ✓ Multi-sede                  │
│  ✓ Marca blanca                │
│  ✓ SLA 99.9%                   │
│  ✓ CSM dedicado                │
└────────────────────────────────┘
```

---

## 5. Conversion Funnel

### 5.1 Funnel Stages

```
┌─────────────────────────────────────────────────────────────┐
│  AWARENESS                                                  │
│  Landing page visit, blog, ads, referral                   │
│  Goal: Understand value proposition                         │
└─────────────────────┬───────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  INTEREST                                                   │
│  Explore features, pricing, case studies                   │
│  Goal: Evaluate fit for their needs                         │
└─────────────────────┬───────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  CONSIDERATION                                              │
│  Start trial, request demo, talk to sales                  │
│  Goal: Experience the product                               │
└─────────────────────┬───────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  CONVERSION                                                 │
│  Subscribe to paid plan                                     │
│  Goal: Become paying customer                               │
└─────────────────────┬───────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  RETENTION                                                  │
│  Onboarding, success, expansion                            │
│  Goal: Long-term value, upsell                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Conversion Paths

```
Path A: Self-Service Trial
────────────────────────────
Landing → Pricing → [Start Trial] → Signup Form → 
Email Verify → Onboarding → Trial (14 days) → 
Upgrade Prompt → Payment → Active Customer

Path B: Sales-Assisted
────────────────────────────
Landing → Pricing → [Contact Sales] → Demo Request Form →
Sales Call → Custom Proposal → Contract → 
Implementation → Active Customer

Path C: Product-Led (Explorar)
────────────────────────────
Landing → Explorar EC → Search Standards → 
[Ver en Plataforma] → Signup → Trial → Upgrade
```

### 5.3 Trial Signup Flow

**Step 1: Initial Form (Minimal)**
```
┌────────────────────────────────────────┐
│  Inicia tu prueba gratis de 14 días   │
│  ─────────────────────────────────     │
│                                        │
│  Email de trabajo                      │
│  [________________________]            │
│                                        │
│  [Continuar con email]                 │
│                                        │
│  ─── o continúa con ───                │
│                                        │
│  [G] Continuar con Google              │
│  [M] Continuar con Microsoft           │
│                                        │
│  Al continuar, aceptas los Términos    │
│  y Política de Privacidad              │
└────────────────────────────────────────┘
```

**Step 2: Account Setup**
```
┌────────────────────────────────────────┐
│  Configura tu cuenta                   │
│  ─────────────────────────────────     │
│                                        │
│  Nombre completo                       │
│  [________________________]            │
│                                        │
│  Nombre de tu organización             │
│  [________________________]            │
│                                        │
│  Contraseña                            │
│  [________________________]            │
│  Mínimo 8 caracteres                   │
│                                        │
│  [Crear cuenta]                        │
└────────────────────────────────────────┘
```

**Step 3: Quick Onboarding (Optional)**
```
┌────────────────────────────────────────┐
│  ¡Bienvenido a AVALA!                  │
│  ─────────────────────────────────     │
│                                        │
│  ¿Cuál es tu principal objetivo?       │
│                                        │
│  ○ Cumplir con DC-3 y SIRCE            │
│  ○ Alinear formación a EC/CONOCER      │
│  ○ Emitir credenciales verificables    │
│  ○ Todo lo anterior                    │
│                                        │
│  ¿Cuántos empleados capacitas al año?  │
│                                        │
│  ○ Menos de 50                         │
│  ○ 50-200                              │
│  ○ 200-500                             │
│  ○ Más de 500                          │
│                                        │
│  [Comenzar →]  [Saltar por ahora]      │
└────────────────────────────────────────┘
```

**Step 4: Dashboard with Guided Tour**
```
┌────────────────────────────────────────────────────────────┐
│  🎉 ¡Tu espacio está listo!                                │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Primeros pasos recomendados:                        │ │
│  │                                                      │ │
│  │  1. [Explorar Estándares EC] ← Start here           │ │
│  │  2. [Crear tu primer curso]                          │ │
│  │  3. [Invitar a tu equipo]                            │ │
│  │  4. [Configurar DC-3]                                │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Trial: 14 días restantes  [Upgrade ahora →]              │
└────────────────────────────────────────────────────────────┘
```

---

## 6. Demo Request Flow

**Form Fields:**
```
┌────────────────────────────────────────┐
│  Solicita una demostración             │
│  ─────────────────────────────────     │
│                                        │
│  Nombre *                              │
│  [________________________]            │
│                                        │
│  Email de trabajo *                    │
│  [________________________]            │
│                                        │
│  Teléfono                              │
│  [________________________]            │
│                                        │
│  Nombre de la empresa *                │
│  [________________________]            │
│                                        │
│  Número de empleados *                 │
│  [Seleccionar ▼]                       │
│    1-50 | 51-200 | 201-500 | 500+     │
│                                        │
│  ¿Qué te interesa más? *               │
│  [Seleccionar ▼]                       │
│    DC-3/Cumplimiento                   │
│    Formación por competencias          │
│    Credenciales verificables           │
│    Solución ECE/OC                     │
│    Evaluación general                  │
│                                        │
│  Comentarios adicionales               │
│  [________________________]            │
│  [________________________]            │
│                                        │
│  [Solicitar demostración]              │
│                                        │
│  Te contactaremos en menos de 24h      │
└────────────────────────────────────────┘
```

**Confirmation:**
```
┌────────────────────────────────────────┐
│  ✓ ¡Solicitud recibida!                │
│                                        │
│  Un especialista te contactará en      │
│  las próximas 24 horas hábiles.        │
│                                        │
│  Mientras tanto:                       │
│  • [Explora los Estándares EC]         │
│  • [Lee nuestras guías de DC-3]        │
│  • [Inicia una prueba gratis]          │
│                                        │
│  [Volver al inicio]                    │
└────────────────────────────────────────┘
```

---

## 7. Upgrade Flow (In-App)

### 7.1 Trial Expiration Prompts

**Day 7 (Soft Reminder):**
```
┌─────────────────────────────────────────────────────────────┐
│  ⏳ Te quedan 7 días de prueba                              │
│                                                             │
│  Estás aprovechando AVALA:                                  │
│  • 12 evaluaciones completadas                              │
│  • 3 cursos creados                                         │
│  • 45 certificados generados                                │
│                                                             │
│  [Upgrade ahora] [Recordar después]                         │
└─────────────────────────────────────────────────────────────┘
```

**Day 12 (Urgent):**
```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ Tu prueba termina en 2 días                            │
│                                                             │
│  Para no perder tu progreso:                                │
│  • 12 evaluaciones                                          │
│  • 3 cursos                                                 │
│  • 45 certificados                                          │
│                                                             │
│  [Upgrade a Profesional - $6,999/mes]                       │
│                                                             │
│  ¿Necesitas más tiempo? [Contactar soporte]                 │
└─────────────────────────────────────────────────────────────┘
```

**Day 14 (Expired):**
```
┌─────────────────────────────────────────────────────────────┐
│  🔒 Tu prueba ha terminado                                  │
│                                                             │
│  Tu información está segura. Activa un plan                │
│  para continuar donde lo dejaste.                           │
│                                                             │
│  [Ver planes] [Exportar mis datos]                          │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Checkout Flow

**Step 1: Plan Confirmation**
```
┌────────────────────────────────────────────────────────────┐
│  Confirma tu plan                                          │
│  ───────────────────────────────────────────────────────   │
│                                                            │
│  Plan: Profesional                                         │
│  Usuarios: Hasta 200                                       │
│                                                            │
│  ○ Mensual: $6,999 MXN/mes                                │
│  ● Anual: $5,599 MXN/mes (ahorra $16,800/año)             │
│                                                            │
│  ───────────────────────────────────────────────────────   │
│  Subtotal anual:           $67,188 MXN                     │
│  IVA (16%):                $10,750 MXN                     │
│  ───────────────────────────────────────────────────────   │
│  Total:                    $77,938 MXN                     │
│                                                            │
│  [Continuar al pago]                                       │
└────────────────────────────────────────────────────────────┘
```

**Step 2: Payment**
```
┌────────────────────────────────────────────────────────────┐
│  Información de pago                                       │
│  ───────────────────────────────────────────────────────   │
│                                                            │
│  [Stripe Elements - Card Input]                            │
│                                                            │
│  Datos de facturación                                      │
│                                                            │
│  RFC *                                                     │
│  [________________________]                                │
│                                                            │
│  Razón social *                                            │
│  [________________________]                                │
│                                                            │
│  Dirección fiscal                                          │
│  [________________________]                                │
│                                                            │
│  [Completar compra - $77,938 MXN]                         │
│                                                            │
│  🔒 Pago seguro con Stripe                                 │
│  Cancela cuando quieras. Sin compromisos.                  │
└────────────────────────────────────────────────────────────┘
```

---

## 8. Email Sequences

### 8.1 Trial Onboarding Sequence

```
Day 0: Bienvenida
├── Subject: "¡Bienvenido a AVALA! Tu cuenta está lista"
├── Content: Login link, quick start guide, support contact
└── CTA: "Explorar tu dashboard"

Day 2: Feature Highlight
├── Subject: "¿Ya exploraste los Estándares de Competencia?"
├── Content: How to search/browse EC, coverage meter intro
└── CTA: "Buscar tu primer EC"

Day 5: Success Story
├── Subject: "Cómo [Empresa X] automatizó sus DC-3 con AVALA"
├── Content: Case study, specific results
└── CTA: "Configurar DC-3 automático"

Day 7: Mid-Trial Check-in
├── Subject: "¿Cómo va tu experiencia con AVALA?"
├── Content: Usage summary, offer help, mention trial remaining
└── CTA: "Agendar llamada de soporte"

Day 10: Urgency + Value
├── Subject: "4 días para terminar tu prueba - no pierdas tu progreso"
├── Content: What they've accomplished, what they'd lose
└── CTA: "Upgrade ahora"

Day 13: Final Push
├── Subject: "Mañana termina tu prueba de AVALA"
├── Content: Last chance, special offer (optional)
└── CTA: "Activar plan"

Day 14: Expiration
├── Subject: "Tu prueba de AVALA ha terminado"
├── Content: Data is safe, easy to reactivate
└── CTA: "Reactivar cuenta"
```

### 8.2 Post-Purchase Sequence

```
Day 0: Welcome + Confirmation
├── Subject: "¡Gracias por elegir AVALA! Tu plan está activo"
└── Content: Receipt, next steps, support channels

Day 3: Onboarding Checklist
├── Subject: "3 pasos para aprovechar AVALA al máximo"
└── Content: Invite team, configure DC-3, create first course

Day 7: Feature Deep-Dive
├── Subject: "Descubre el poder de Avala Comply"
└── Content: DC-3 automation tutorial, SIRCE export guide

Day 14: Check-in + Feedback
├── Subject: "¿Cómo te está yendo con AVALA?"
└── Content: NPS survey, offer call with CSM

Day 30: Success Milestone
├── Subject: "🎉 Tu primer mes con AVALA - Resumen"
└── Content: Usage stats, achievements, tips for next month
```

---

## 9. Conversion Metrics & Goals

### 9.1 Funnel Metrics

| Stage | Metric | Target |
|-------|--------|--------|
| Awareness | Landing page visits | Track |
| Interest | Pricing page views | 30% of visitors |
| Consideration | Trial starts | 10% of pricing views |
| Activation | Complete onboarding | 60% of trials |
| Conversion | Trial → Paid | 20% of activated trials |
| Retention | Month 3 retention | 85% |

### 9.2 Key Conversion Events

```javascript
// Analytics events to track
{
  // Awareness
  'page_view': { page: 'landing' },
  'page_view': { page: 'pricing' },
  
  // Interest
  'feature_click': { feature: 'learn|assess|comply|badges' },
  'ec_search': { query: '...' },
  'demo_video_play': {},
  
  // Consideration
  'trial_start_click': { plan: 'starter|profesional' },
  'demo_request_click': {},
  
  // Trial Signup
  'signup_start': { method: 'email|google|microsoft' },
  'signup_complete': {},
  'onboarding_step': { step: 1|2|3 },
  'onboarding_complete': {},
  
  // Activation
  'first_course_created': {},
  'first_assessment_completed': {},
  'first_dc3_generated': {},
  'team_member_invited': {},
  
  // Conversion
  'upgrade_click': { from: 'trial', to: 'profesional' },
  'checkout_start': { plan: '...', billing: 'monthly|annual' },
  'checkout_complete': { plan: '...', value: 'XXX' },
  
  // Retention
  'feature_used': { feature: '...' },
  'login': {},
}
```

---

## 10. A/B Testing Roadmap

### 10.1 Priority Tests

1. **Pricing Display**
   - A: Monthly price prominent
   - B: Annual price prominent with savings badge
   - Metric: Annual vs Monthly ratio

2. **Trial CTA Text**
   - A: "Iniciar prueba gratis"
   - B: "Probar gratis 14 días"
   - C: "Empezar ahora - Es gratis"
   - Metric: Click-through rate

3. **Hero Headline**
   - A: "Capacitación que cumple. Competencias que avalan."
   - B: "DC-3 automático. Cumplimiento garantizado."
   - C: "Tu formación, verificada. Tus empleados, certificados."
   - Metric: Scroll depth, trial starts

4. **Pricing Tiers Order**
   - A: Starter | Professional | Enterprise
   - B: Professional | Starter | Enterprise (lead with popular)
   - Metric: Plan selection distribution

---

*Document prepared for AVALA Pricing & Conversion Design*
*Next step: Finalize copy, then proceed to implementation*
