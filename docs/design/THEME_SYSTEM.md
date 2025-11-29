# AVALA Theme System Design

## Overview

Multi-mode theme system with:
1. **Light/Dark/Auto modes** - Standard theme switching with system preference detection
2. **Mexican Holiday Themes** - Automatic festive themes during important Mexican holidays

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ThemeProvider                            │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ next-themes │  │ HolidayTheme │  │ ThemeContext      │  │
│  │ (base mode) │  │ (overlay)    │  │ (combined state)  │  │
│  └─────────────┘  └──────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
     ┌──────────┐    ┌──────────┐    ┌──────────┐
     │  Light   │    │   Dark   │    │   Auto   │
     └──────────┘    └──────────┘    └──────────┘
            │               │               │
            └───────────────┼───────────────┘
                            ▼
                  ┌─────────────────┐
                  │ Holiday Overlay │
                  │ (when active)   │
                  └─────────────────┘
```

## Mexican Holidays Calendar

| Date | Holiday | Theme Name | Color Palette |
|------|---------|------------|---------------|
| Jan 1 | Año Nuevo | `new-year` | Gold, White, Champagne |
| Feb 5 | Día de la Constitución | `constitucion` | Green, White, Red (tricolor) |
| Feb 24 | Día de la Bandera | `bandera` | Green, White, Red + Gold eagle |
| Mar 21 | Natalicio de Benito Juárez | `juarez` | Deep Blue, Gold, White |
| May 1 | Día del Trabajo | `trabajo` | Red, Orange, Yellow |
| May 5 | Batalla de Puebla | `cinco-mayo` | Vibrant Puebla colors |
| Sep 16 | Día de la Independencia | `independencia` | Green, White, Red + Gold |
| Oct 12 | Día de la Raza | `raza` | Earth tones, Indigenous colors |
| Nov 1-2 | Día de Muertos | `muertos` | Orange, Purple, Yellow, Black |
| Nov 20 | Revolución Mexicana | `revolucion` | Sepia, Khaki, Red |
| Dec 12 | Día de la Virgen | `guadalupe` | Rose, Gold, Turquoise |
| Dec 25 | Navidad | `navidad` | Red, Green, Gold, White |

## Theme Modes

### 1. Light Mode (default)
Standard light theme with blue primary colors.

### 2. Dark Mode
Inverted colors optimized for low-light viewing.

### 3. Auto Mode
- Follows system preference (`prefers-color-scheme`)
- Detects Mexican holidays and applies festive overlay
- User can disable holiday themes while keeping auto light/dark

## Data Structures

### Holiday Configuration
```typescript
// lib/themes/holidays.ts
interface MexicanHoliday {
  id: string;
  name: string;
  nameEs: string;
  date: { month: number; day: number };
  duration: number; // days active (default 1)
  theme: HolidayTheme;
}

interface HolidayTheme {
  id: string;
  colors: {
    primary: string;      // HSL values
    secondary: string;
    accent: string;
    background?: string;  // Optional override
    foreground?: string;
  };
  decorations?: {
    pattern?: string;     // CSS pattern or SVG
    icon?: string;        // Decorative icon
  };
}
```

### Theme State
```typescript
// lib/themes/types.ts
type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  holidayTheme: string | null;
  holidayEnabled: boolean;
}
```

## Component Structure

```
lib/themes/
├── index.ts              # Public exports
├── types.ts              # Type definitions
├── holidays.ts           # Mexican holidays config
├── holiday-themes.ts     # Holiday color palettes
├── use-theme.ts          # Theme hook
└── use-holiday.ts        # Holiday detection hook

components/theme/
├── index.ts
├── theme-provider.tsx    # Main provider component
├── theme-toggle.tsx      # Light/Dark/Auto toggle
├── holiday-banner.tsx    # Optional festive banner
└── theme-customizer.tsx  # Full theme settings panel
```

## CSS Variable System

### Base Variables (globals.css)
Already implemented with HSL values.

### Holiday Overlay Pattern
```css
/* Holiday theme applied via data attribute */
[data-holiday="independencia"] {
  --primary: 145 63% 32%;        /* Green */
  --accent: 0 72% 51%;           /* Red */
  --ring: 43 96% 56%;            /* Gold */
}

[data-holiday="muertos"] {
  --primary: 24 95% 53%;         /* Orange */
  --accent: 270 50% 40%;         /* Purple */
  --secondary: 45 93% 58%;       /* Marigold */
}
```

## Implementation Steps

### Phase 1: Core Theme System
1. Install `next-themes` package
2. Create ThemeProvider wrapper
3. Update layout.tsx with provider
4. Create theme toggle component
5. Add theme to settings page

### Phase 2: Holiday System
1. Create holidays configuration
2. Implement holiday detection hook
3. Create holiday CSS variables
4. Add holiday banner component
5. Integrate with ThemeProvider

### Phase 3: Polish
1. Add smooth transitions between themes
2. Create holiday-specific decorations
3. Add user preference persistence
4. Implement holiday preview in settings

## User Preferences Storage

```typescript
// Stored in localStorage + cookie for SSR
interface ThemePreferences {
  mode: ThemeMode;
  holidayThemesEnabled: boolean;
  // Future: custom accent colors
}
```

## API Endpoints (Optional)

For tenant-level theme customization:
```
GET  /api/tenant/theme     - Get tenant theme settings
PUT  /api/tenant/theme     - Update tenant theme
GET  /api/holidays/current - Get active holiday (if any)
```

## Accessibility Considerations

- All themes must maintain WCAG 2.1 AA contrast ratios
- Theme transitions should respect `prefers-reduced-motion`
- Holiday decorations should not interfere with content readability
- Screen reader announcements for theme changes

## Testing Strategy

- Visual regression tests for each theme
- Contrast ratio validation
- Date-based holiday detection tests
- SSR hydration tests for theme persistence
