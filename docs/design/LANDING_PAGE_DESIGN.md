# AVALA Landing Page Design Specification

> **Document Version:** 1.0  
> **Status:** Design Phase  
> **Last Updated:** 2025-11-28

---

## 1. Executive Summary

### 1.1 Objective
Create a conversion-optimized marketing landing page that:
- Communicates AVALA's value proposition clearly
- Converts visitors into trial signups and paying customers
- Establishes credibility in the Mexican corporate training market
- Differentiates from generic LMS solutions

### 1.2 Target Audience

| Segment | Role | Pain Points | Motivation |
|---------|------|-------------|------------|
| **Primary** | HR Directors, Training Managers | DC-3 compliance burden, manual tracking, audit risk | Automation, compliance peace of mind |
| **Secondary** | ECE/OC Administrators | Portfolio assembly, SII preparation | Streamlined certification workflow |
| **Tertiary** | CONOCER-aligned Training Centers | Student management, credential issuance | Professional platform, verifiable badges |

### 1.3 Key Differentiators
1. **EC/CONOCER Native** — Built from ground-up for Mexican competency standards
2. **Compliance Automation** — DC-3, SIRCE, LFT Plan generation
3. **Verifiable Credentials** — Open Badges 3.0 / W3C Verifiable Credentials
4. **Evidence Portfolio** — Auditable, hash-verified evidence management
5. **Multi-tenant SaaS** — Enterprise-ready from day one

---

## 2. Information Architecture

### 2.1 Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│  NAVIGATION BAR (sticky)                                    │
│  Logo | Producto | Soluciones | Precios | Recursos | Login  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  HERO SECTION                                               │
│  Headline + Subhead + Primary CTA + Secondary CTA           │
│  Hero Visual (Dashboard Preview / Credential Animation)     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TRUST BAR                                                  │
│  "Empresas que confían en AVALA" + Client Logos             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PROBLEM/SOLUTION                                           │
│  Pain points → AVALA solutions (with visuals)               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PRODUCT MODULES (Tabs or Cards)                            │
│  Avala Learn | Avala Assess | Avala Comply | Avala Badges   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  EC/CONOCER INTEGRATION HIGHLIGHT                           │
│  Search demo + Coverage meter + Standards browser           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FOR WHO (Audience Segments)                                │
│  Enterprises | ECE/OC | Training Centers                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SOCIAL PROOF                                               │
│  Testimonials + Stats + Case Study Snippets                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PRICING PREVIEW                                            │
│  3 Tiers + CTA to full pricing page                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FAQ ACCORDION                                              │
│  Common questions about compliance, integration, etc.       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FINAL CTA SECTION                                          │
│  Strong headline + Primary action                           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  FOOTER                                                     │
│  Links | Legal | Social | Contact                           │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Navigation Structure

```
Producto ─┬─ Avala Learn (LMS)
          ├─ Avala Assess (Evaluaciones)
          ├─ Avala Comply (DC-3/SIRCE)
          ├─ Avala Badges (Credenciales)
          └─ Avala Connect (Integraciones)

Soluciones ─┬─ Para Empresas
            ├─ Para ECE/OC
            ├─ Para Centros de Capacitación
            └─ Por Industria

Precios ─── Pricing Page

Recursos ─┬─ Blog
          ├─ Guías DC-3
          ├─ Estándares EC
          ├─ Webinars
          └─ API Docs

[Iniciar Sesión] [Prueba Gratis →]
```

---

## 3. Section-by-Section Design

### 3.1 Hero Section

**Layout:** Split (60% content / 40% visual) on desktop, stacked on mobile

**Content:**
```
Badge: "Plataforma #1 para Capacitación CONOCER"

Headline (H1):
"Capacitación que cumple.
Competencias que avalan."

Subheadline:
Diseña, imparte y certifica formación alineada a Estándares de 
Competencia. Genera DC-3 automáticamente. Emite credenciales verificables.

Primary CTA: [Iniciar Prueba Gratis] (filled, prominent)
Secondary CTA: [Ver Demo] (ghost/outline)

Small text: "Sin tarjeta de crédito • Setup en 5 minutos • Soporte incluido"
```

**Visual Options:**
1. Animated dashboard preview showing DC-3 generation
2. Floating credential/badge with verification animation
3. Abstract illustration of learning path → assessment → credential flow

**Design Notes:**
- Gradient background (subtle blue to white)
- Hero image should feel modern, professional, Mexican context
- Mobile: Full-width stacked, CTA buttons full-width

---

### 3.2 Trust Bar

**Layout:** Single row of logos, auto-scrolling on mobile

**Content:**
```
"Empresas líderes confían en AVALA"

[Logo 1] [Logo 2] [Logo 3] [Logo 4] [Logo 5] [Logo 6]
```

**Design Notes:**
- Grayscale logos (color on hover)
- If no real clients yet: "Desarrollado para líderes de la industria"
- Can show partner logos, integration logos (CONOCER, STPS compatible)

---

### 3.3 Problem/Solution Section

**Layout:** Two-column comparison or animated before/after

**Content:**

| Sin AVALA | Con AVALA |
|-----------|-----------|
| ❌ DC-3 manual en Excel, errores frecuentes | ✅ Generación automática, cero errores |
| ❌ Evidencias dispersas, auditorías estresantes | ✅ Portafolio centralizado, hash verificable |
| ❌ Cumplimiento SIRCE a última hora | ✅ Exports listos, siempre al día |
| ❌ Certificados en papel, fáciles de falsificar | ✅ Credenciales digitales verificables |
| ❌ Sin visibilidad del progreso por competencia | ✅ Dashboard de cobertura por criterio EC |

**Visual:** Side-by-side mockups or animated transition

---

### 3.4 Product Modules Section

**Layout:** Tab interface or horizontal scroll cards

**Modules:**

#### Avala Learn
```
Icon: 📚 (or custom)
Title: "Avala Learn"
Subtitle: "Rutas de aprendizaje alineadas a EC"

Features:
• Mapeo automático a criterios de competencia
• Medidor de cobertura en tiempo real
• Tracking xAPI/cmi5 nativo
• PWA móvil con captura offline

Visual: Screenshot of learning path builder with coverage meter
```

#### Avala Assess
```
Icon: ✓ (checkmark in circle)
Title: "Avala Assess"
Subtitle: "Evaluación multi-método por criterio"

Features:
• Rúbricas personalizables por EC
• Observación, entrevista, quiz, portafolio
• Calificación por criterio de desempeño
• Acuerdo inter-evaluador automático

Visual: Screenshot of rubric/assessment interface
```

#### Avala Comply
```
Icon: 📋 (or shield)
Title: "Avala Comply"
Subtitle: "DC-3, SIRCE y Plan LFT automáticos"

Features:
• Generación de DC-3 con folio y firmas
• Export SIRCE validado
• Plan de Capacitación LFT inmutable
• Audit trail completo

Visual: DC-3 PDF preview with "Generado automáticamente" badge
```

#### Avala Badges
```
Icon: 🏆 (or badge icon)
Title: "Avala Badges"
Subtitle: "Credenciales verificables Open Badges 3.0"

Features:
• Alineación a Estándares de Competencia
• Verificación pública instantánea
• Revocación cuando sea necesario
• Compatible con LinkedIn y wallets

Visual: Animated badge with verification checkmark
```

---

### 3.5 EC/CONOCER Integration Highlight

**Layout:** Full-width feature section with interactive element

**Content:**
```
Section Title: "Nativo para CONOCER"
Subtitle: "Acceso a 1,477 Estándares de Competencia y 482 Entidades Certificadoras"

Interactive Element:
[Search bar: "Buscar estándar... ej: EC0217"]

Below search: Real-time results preview showing:
- EC Code
- Title
- Number of certifiers available
- Coverage meter

Stats Row:
[1,477 EC Standards] [482 ECEs] [581 Comités] [100% Actualizado]

CTA: [Explorar Estándares →]
```

**Visual:** 
- Embed or preview of `/explorar` functionality
- Animated coverage meter filling up
- Map of Mexico with ECE distribution (optional)

---

### 3.6 Audience Segments (For Who)

**Layout:** 3-column cards or tabbed content

#### Para Empresas
```
Icon: 🏢
Title: "Para Empresas"
Subtitle: "Cumplimiento laboral sin complicaciones"

Benefits:
• Automatiza DC-3 para todo tu personal
• Prepara auditorías STPS en minutos
• Dashboards de competencia por área
• Integración con tu HRIS

CTA: [Solución Empresarial →]
```

#### Para ECE/OC
```
Icon: ✓ (certification mark)
Title: "Para Entidades Certificadoras"
Subtitle: "Gestiona candidatos y dictámenes"

Benefits:
• Registro y seguimiento de candidatos
• Portafolio de evidencias listo para SII
• Asignación de evaluadores
• Reportes de productividad

CTA: [Solución ECE/OC →]
```

#### Para Centros de Capacitación
```
Icon: 🎓
Title: "Para Centros de Capacitación"
Subtitle: "Profesionaliza tu oferta formativa"

Benefits:
• Cursos alineados a estándares oficiales
• Credenciales verificables para egresados
• Gestión multi-sede
• Marca blanca disponible

CTA: [Solución CCAP →]
```

---

### 3.7 Social Proof / Testimonials

**Layout:** Carousel or grid of testimonial cards

**Content Structure:**
```
"Quote text highlighting specific benefit..."

— Name Surname
  Role, Company Name
  [Company Logo]
```

**Stats Bar:**
```
[+10,000 Certificaciones] [99.5% Uptime] [<5min DC-3] [4.9★ Satisfacción]
```

**If no testimonials yet:** Use placeholder structure with:
- Industry-relevant quotes about compliance pain points
- "Próximamente: Casos de éxito"

---

### 3.8 Pricing Preview

**Layout:** 3-tier horizontal cards

```
┌─────────────────┬─────────────────┬─────────────────┐
│    STARTER      │   PROFESIONAL   │   ENTERPRISE    │
│                 │   ⭐ Popular    │                 │
├─────────────────┼─────────────────┼─────────────────┤
│  $X,XXX MXN/mes │  $X,XXX MXN/mes │   Personalizado │
│  hasta 50 users │  hasta 200 users│   usuarios ilim │
├─────────────────┼─────────────────┼─────────────────┤
│ ✓ Avala Learn   │ ✓ Todo Starter  │ ✓ Todo Prof.    │
│ ✓ Avala Assess  │ ✓ Avala Comply  │ ✓ SSO/SCIM      │
│ ✓ 5 EC activos  │ ✓ DC-3 ilimit.  │ ✓ API completa  │
│ ✓ Soporte email │ ✓ SIRCE export  │ ✓ SLA 99.9%     │
│                 │ ✓ Badges ilimit.│ ✓ Soporte ded.  │
├─────────────────┼─────────────────┼─────────────────┤
│ [Iniciar Trial] │ [Iniciar Trial] │ [Contactar]     │
└─────────────────┴─────────────────┴─────────────────┘
```

**CTA:** [Ver todos los planes y características →]

---

### 3.9 FAQ Section

**Layout:** Accordion component

**Questions:**
1. ¿AVALA genera DC-3 oficiales válidos ante la STPS?
2. ¿Cómo se integra con los Estándares de Competencia de CONOCER?
3. ¿Puedo migrar mis cursos existentes?
4. ¿Las credenciales son verificables por terceros?
5. ¿Ofrecen implementación y capacitación?
6. ¿Cómo funciona la prueba gratuita?
7. ¿Es seguro para datos de empleados?
8. ¿Se integra con mi sistema de nómina/HRIS?

---

### 3.10 Final CTA Section

**Layout:** Full-width, high-contrast background

**Content:**
```
Headline: "Comienza a avalar competencias hoy"

Subheadline: 
"Únete a las empresas que ya automatizan su cumplimiento 
de capacitación con AVALA."

[Iniciar Prueba Gratis de 14 Días]

Small text: "Sin tarjeta • Cancela cuando quieras • Soporte incluido"
```

---

### 3.11 Footer

**Layout:** 4-column + bottom bar

```
┌────────────────┬────────────────┬────────────────┬────────────────┐
│   PRODUCTO     │   SOLUCIONES   │   RECURSOS     │   EMPRESA      │
├────────────────┼────────────────┼────────────────┼────────────────┤
│ Avala Learn    │ Para Empresas  │ Blog           │ Nosotros       │
│ Avala Assess   │ Para ECE/OC    │ Guías DC-3     │ Contacto       │
│ Avala Comply   │ Para CCAP      │ API Docs       │ Carreras       │
│ Avala Badges   │ Por Industria  │ Status         │ Prensa         │
│ Avala Connect  │                │ Changelog      │                │
│ Precios        │                │                │                │
└────────────────┴────────────────┴────────────────┴────────────────┘

[AVALA Logo]                                    [LinkedIn] [Twitter]

─────────────────────────────────────────────────────────────────────
© 2025 Innovaciones MADFAM S.A.S. de C.V.  |  Privacidad  |  Términos
```

---

## 4. Visual Design System

### 4.1 Color Palette

```
Primary Blue:      hsl(221, 83%, 53%)  → #3B82F6  (CTA, links, accents)
Primary Dark:      hsl(222, 84%, 5%)   → #0A0F1A  (Text, dark sections)
Secondary:         hsl(210, 40%, 96%)  → #F1F5F9  (Backgrounds, cards)
Accent Green:      hsl(142, 76%, 36%)  → #16A34A  (Success, verify, badges)
Accent Amber:      hsl(38, 92%, 50%)   → #F59E0B  (Warnings, highlights)
White:             #FFFFFF
Muted:             hsl(215, 16%, 47%)  → #64748B  (Secondary text)
```

### 4.2 Typography

```
Font Family: Inter (already configured)

Hero H1:      4rem (64px) / 700 / -0.02em / 1.1 line-height
Section H2:   2.5rem (40px) / 600 / -0.01em / 1.2
Card H3:      1.5rem (24px) / 600 / 0 / 1.3
Body Large:   1.125rem (18px) / 400 / 0 / 1.6
Body:         1rem (16px) / 400 / 0 / 1.6
Small:        0.875rem (14px) / 400 / 0 / 1.5
Caption:      0.75rem (12px) / 500 / 0.05em / 1.4

Mobile scaling: 0.85x for H1, H2
```

### 4.3 Spacing Scale

```
4px  → xs
8px  → sm
16px → md (base)
24px → lg
32px → xl
48px → 2xl
64px → 3xl
96px → 4xl (section padding)
```

### 4.4 Component Specifications

#### Buttons

```
Primary (filled):
  bg: primary-blue
  text: white
  padding: 12px 24px
  radius: 8px
  font: 16px/600
  hover: darken 10%
  shadow: 0 1px 2px rgba(0,0,0,0.05)

Secondary (outline):
  bg: transparent
  border: 1px solid primary-blue
  text: primary-blue
  hover: bg primary-blue/10

Ghost:
  bg: transparent
  text: primary-blue
  hover: bg primary-blue/5
```

#### Cards

```
bg: white
border: 1px solid border-color
radius: 12px
padding: 24px
shadow: 0 1px 3px rgba(0,0,0,0.1)
hover: shadow 0 4px 12px rgba(0,0,0,0.1), translateY(-2px)
```

#### Section Containers

```
max-width: 1280px
padding-x: 24px (mobile), 48px (tablet), 64px (desktop)
padding-y: 64px (mobile), 96px (desktop)
```

---

## 5. Responsive Breakpoints

```
Mobile:      < 640px   (sm)
Tablet:      640-1024px (md-lg)
Desktop:     > 1024px   (xl)
Wide:        > 1280px   (2xl)
```

### Key Responsive Changes

| Section | Mobile | Desktop |
|---------|--------|---------|
| Hero | Stacked, full-width CTAs | Split 60/40 |
| Trust Bar | Scroll, 3 visible | All visible |
| Modules | Vertical stack | Horizontal tabs |
| Pricing | Vertical cards | Horizontal row |
| Footer | 2-column accordion | 4-column grid |

---

## 6. Animations & Micro-interactions

### 6.1 Page Load
- Fade-in sections on scroll (IntersectionObserver)
- Stagger animation for card grids (100ms delay each)
- Hero elements: slide-up + fade (300ms)

### 6.2 Interactive Elements
- Button hover: scale(1.02), shadow increase
- Card hover: translateY(-4px), shadow increase
- Link hover: underline animation left-to-right
- Tab switch: fade + slide transition

### 6.3 Special Animations
- Coverage meter: animate from 0 to value on scroll-into-view
- Badge verification: checkmark draw animation
- Stats counter: count-up animation on scroll
- Trust bar logos: subtle continuous scroll on mobile

---

## 7. SEO & Performance

### 7.1 Meta Tags
```html
<title>AVALA | Plataforma de Capacitación CONOCER | DC-3 Automático</title>
<meta name="description" content="Diseña, imparte y certifica formación alineada a Estándares de Competencia. Genera DC-3, SIRCE y credenciales verificables. Prueba gratis.">
<meta name="keywords" content="DC-3, CONOCER, capacitación, estándares de competencia, SIRCE, LMS México, credenciales verificables">
```

### 7.2 Open Graph
```html
<meta property="og:title" content="AVALA - Capacitación que cumple">
<meta property="og:description" content="Automatiza DC-3, SIRCE y certificaciones CONOCER">
<meta property="og:image" content="/og-image.png">
<meta property="og:type" content="website">
```

### 7.3 Performance Targets
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1
- Lighthouse Score: > 90

### 7.4 Technical Requirements
- Next.js App Router with SSG for landing
- Image optimization with next/image
- Font optimization with next/font
- Critical CSS inlining
- Lazy load below-fold sections

---

## 8. Conversion Tracking

### 8.1 Key Events
```javascript
// Track in analytics
'hero_cta_click'         // Primary CTA clicked
'demo_request'           // Demo button clicked
'pricing_view'           // Scrolled to pricing
'signup_start'           // Trial form opened
'signup_complete'        // Trial registration done
'faq_expand'             // FAQ item opened
'feature_tab_switch'     // Module tab changed
```

### 8.2 A/B Test Candidates
1. Hero headline variations
2. CTA button text ("Prueba Gratis" vs "Empezar Ahora")
3. Pricing display (monthly vs annual default)
4. Social proof placement

---

## 9. Implementation Phases

### Phase 1: Core Landing (MVP)
- [ ] Navigation component
- [ ] Hero section
- [ ] Problem/Solution section
- [ ] Product modules (static)
- [ ] Final CTA
- [ ] Footer

### Phase 2: Credibility
- [ ] Trust bar
- [ ] Testimonials section
- [ ] FAQ accordion
- [ ] Pricing preview

### Phase 3: Interactive
- [ ] EC search integration
- [ ] Animated coverage meter
- [ ] Stats counter animations
- [ ] Scroll animations

### Phase 4: Conversion
- [ ] Trial signup flow
- [ ] Demo request form
- [ ] Analytics integration
- [ ] A/B testing setup

---

## 10. File Structure

```
apps/web/
├── app/
│   ├── (marketing)/           # Marketing route group
│   │   ├── layout.tsx         # Marketing layout (no dashboard nav)
│   │   ├── page.tsx           # Landing page (/)
│   │   ├── precios/
│   │   │   └── page.tsx       # Pricing page
│   │   ├── producto/
│   │   │   ├── learn/page.tsx
│   │   │   ├── assess/page.tsx
│   │   │   ├── comply/page.tsx
│   │   │   └── badges/page.tsx
│   │   └── soluciones/
│   │       ├── empresas/page.tsx
│   │       ├── ece/page.tsx
│   │       └── ccap/page.tsx
│   └── ...
├── components/
│   ├── marketing/
│   │   ├── hero.tsx
│   │   ├── trust-bar.tsx
│   │   ├── problem-solution.tsx
│   │   ├── product-modules.tsx
│   │   ├── ec-highlight.tsx
│   │   ├── audience-segments.tsx
│   │   ├── testimonials.tsx
│   │   ├── pricing-preview.tsx
│   │   ├── faq.tsx
│   │   ├── final-cta.tsx
│   │   ├── marketing-nav.tsx
│   │   └── marketing-footer.tsx
│   └── ...
└── ...
```

---

## 11. Content Requirements

### 11.1 Copy Needed
- [ ] Hero headline/subhead (A/B variants)
- [ ] Product module descriptions (4)
- [ ] Audience segment copy (3)
- [ ] FAQ answers (8)
- [ ] Testimonial quotes (3-5)
- [ ] Legal pages (Privacy, Terms)

### 11.2 Assets Needed
- [ ] AVALA logo (SVG, dark/light variants)
- [ ] Product screenshots (4 modules)
- [ ] Hero illustration or dashboard preview
- [ ] Client logos (if available)
- [ ] Team photos (optional)
- [ ] Open Graph image (1200x630)

---

*Document prepared for AVALA Marketing Landing Page*
*Next step: Review with stakeholders, then proceed to implementation*
