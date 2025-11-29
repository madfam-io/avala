/**
 * Mexican Holiday Theme Configuration
 *
 * Defines the holidays and their associated color palettes for
 * automatic theme switching during important Mexican government
 * and cultural celebrations.
 */

export interface HolidayTheme {
  id: string;
  name: string;
  nameEs: string;
  /** Month (1-12) */
  month: number;
  /** Day of month (1-31), or null for dynamic dates */
  day: number | null;
  /** For dynamic holidays like Easter */
  dynamicDate?: (year: number) => Date;
  /** CSS color values in HSL format */
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    mutedForeground: string;
  };
  /** Optional decorative emoji for UI */
  emoji?: string;
  /** Description for accessibility */
  description: string;
}

/**
 * Mexican holidays with their themed color palettes
 * Organized chronologically through the year
 */
export const MEXICAN_HOLIDAYS: HolidayTheme[] = [
  // January 1 - New Year's Day
  {
    id: 'new-year',
    name: "New Year's Day",
    nameEs: 'Año Nuevo',
    month: 1,
    day: 1,
    colors: {
      primary: '45 93% 47%',      // Gold
      secondary: '0 0% 98%',       // White/Silver
      accent: '262 83% 58%',       // Purple
      background: '240 10% 4%',    // Deep midnight
      foreground: '0 0% 98%',
      muted: '240 4% 16%',
      mutedForeground: '240 5% 65%',
    },
    emoji: '🎆',
    description: 'Celebrating the new year with gold and festive colors',
  },

  // February 5 - Constitution Day
  {
    id: 'constitution-day',
    name: 'Constitution Day',
    nameEs: 'Día de la Constitución',
    month: 2,
    day: 5,
    colors: {
      primary: '142 71% 29%',      // Mexican green
      secondary: '0 0% 100%',       // White
      accent: '0 72% 51%',          // Mexican red
      background: '0 0% 100%',
      foreground: '142 71% 20%',
      muted: '142 20% 90%',
      mutedForeground: '142 30% 40%',
    },
    emoji: '📜',
    description: 'Honoring the Mexican Constitution with national colors',
  },

  // March 21 - Benito Juárez Birthday
  {
    id: 'benito-juarez',
    name: "Benito Juárez's Birthday",
    nameEs: 'Natalicio de Benito Juárez',
    month: 3,
    day: 21,
    colors: {
      primary: '220 70% 45%',      // Deep blue
      secondary: '45 90% 55%',     // Gold
      accent: '0 0% 20%',          // Dark gray
      background: '220 20% 97%',
      foreground: '220 70% 25%',
      muted: '220 15% 90%',
      mutedForeground: '220 20% 50%',
    },
    emoji: '⚖️',
    description: 'Commemorating Benito Juárez with dignified blue and gold',
  },

  // May 1 - Labor Day
  {
    id: 'labor-day',
    name: 'Labor Day',
    nameEs: 'Día del Trabajo',
    month: 5,
    day: 1,
    colors: {
      primary: '0 72% 51%',        // Red
      secondary: '45 100% 51%',    // Yellow
      accent: '0 0% 20%',          // Black
      background: '0 0% 98%',
      foreground: '0 72% 35%',
      muted: '0 30% 92%',
      mutedForeground: '0 40% 45%',
    },
    emoji: '✊',
    description: 'Celebrating workers with bold red and yellow',
  },

  // May 5 - Battle of Puebla
  {
    id: 'cinco-de-mayo',
    name: 'Cinco de Mayo',
    nameEs: 'Batalla de Puebla',
    month: 5,
    day: 5,
    colors: {
      primary: '142 71% 35%',      // Vibrant green
      secondary: '0 0% 100%',       // White
      accent: '0 72% 51%',          // Red
      background: '142 30% 97%',
      foreground: '142 71% 20%',
      muted: '142 25% 90%',
      mutedForeground: '142 35% 40%',
    },
    emoji: '🇲🇽',
    description: 'Celebrating Mexican victory with patriotic colors',
  },

  // September 16 - Independence Day
  {
    id: 'independence-day',
    name: 'Independence Day',
    nameEs: 'Día de la Independencia',
    month: 9,
    day: 16,
    colors: {
      primary: '142 76% 36%',      // Flag green
      secondary: '0 0% 100%',       // White
      accent: '0 84% 44%',          // Flag red
      background: '0 0% 100%',
      foreground: '142 76% 20%',
      muted: '142 30% 92%',
      mutedForeground: '142 40% 40%',
    },
    emoji: '🔔',
    description: 'Celebrating Mexican independence with flag colors',
  },

  // October 12 - Day of the Race / Indigenous Peoples Day
  {
    id: 'dia-de-la-raza',
    name: 'Day of the Race',
    nameEs: 'Día de la Raza',
    month: 10,
    day: 12,
    colors: {
      primary: '25 95% 45%',       // Terracotta/clay
      secondary: '45 80% 55%',     // Gold/amber
      accent: '180 50% 35%',       // Turquoise
      background: '30 30% 96%',
      foreground: '25 70% 25%',
      muted: '30 25% 88%',
      mutedForeground: '25 40% 45%',
    },
    emoji: '🌎',
    description: 'Honoring indigenous heritage with earth tones',
  },

  // November 1-2 - Day of the Dead
  {
    id: 'dia-de-muertos',
    name: 'Day of the Dead',
    nameEs: 'Día de Muertos',
    month: 11,
    day: 1, // Extends to Nov 2
    colors: {
      primary: '35 100% 50%',      // Marigold orange
      secondary: '300 70% 50%',    // Purple/magenta
      accent: '180 80% 40%',       // Turquoise
      background: '270 15% 10%',   // Dark purple-black
      foreground: '35 100% 90%',
      muted: '270 20% 20%',
      mutedForeground: '35 60% 70%',
    },
    emoji: '💀',
    description: 'Celebrating ancestors with marigold and traditional colors',
  },

  // November 20 - Revolution Day
  {
    id: 'revolution-day',
    name: 'Revolution Day',
    nameEs: 'Día de la Revolución',
    month: 11,
    day: 20,
    colors: {
      primary: '25 80% 35%',       // Sepia/brown
      secondary: '45 70% 50%',     // Khaki/tan
      accent: '0 60% 40%',         // Muted red
      background: '30 20% 95%',
      foreground: '25 60% 20%',
      muted: '30 15% 88%',
      mutedForeground: '25 35% 45%',
    },
    emoji: '🐎',
    description: 'Remembering the revolution with historic earth tones',
  },

  // December 12 - Virgin of Guadalupe
  {
    id: 'virgen-guadalupe',
    name: 'Our Lady of Guadalupe',
    nameEs: 'Día de la Virgen de Guadalupe',
    month: 12,
    day: 12,
    colors: {
      primary: '180 70% 35%',      // Teal/turquoise
      secondary: '45 85% 55%',     // Gold
      accent: '340 70% 50%',       // Rose
      background: '180 15% 97%',
      foreground: '180 70% 20%',
      muted: '180 20% 90%',
      mutedForeground: '180 35% 45%',
    },
    emoji: '🌹',
    description: 'Honoring the Virgin with turquoise and rose',
  },

  // December 24-25 - Christmas
  {
    id: 'christmas',
    name: 'Christmas',
    nameEs: 'Navidad',
    month: 12,
    day: 24, // Extends to Dec 25
    colors: {
      primary: '0 72% 45%',        // Christmas red
      secondary: '142 60% 35%',    // Christmas green
      accent: '45 90% 55%',        // Gold
      background: '142 15% 97%',
      foreground: '0 72% 25%',
      muted: '0 25% 92%',
      mutedForeground: '142 30% 40%',
    },
    emoji: '🎄',
    description: 'Celebrating Christmas with traditional red and green',
  },

  // December 31 - New Year's Eve
  {
    id: 'new-years-eve',
    name: "New Year's Eve",
    nameEs: 'Fin de Año',
    month: 12,
    day: 31,
    colors: {
      primary: '45 93% 47%',       // Gold
      secondary: '210 30% 30%',    // Midnight blue
      accent: '0 0% 90%',          // Silver
      background: '220 20% 10%',   // Dark blue
      foreground: '45 90% 90%',
      muted: '220 15% 20%',
      mutedForeground: '45 50% 70%',
    },
    emoji: '🥂',
    description: 'Ringing in the new year with gold and midnight blue',
  },
];

/**
 * Get the current active holiday if today falls within a holiday period
 * Holidays are active for their specific day, with some exceptions
 * that span multiple days (Day of the Dead: Nov 1-2, Christmas: Dec 24-25)
 */
export function getActiveHoliday(date: Date = new Date()): HolidayTheme | null {
  const month = date.getMonth() + 1; // JS months are 0-indexed
  const day = date.getDate();

  for (const holiday of MEXICAN_HOLIDAYS) {
    if (holiday.month === month) {
      // Handle multi-day holidays
      if (holiday.id === 'dia-de-muertos' && (day === 1 || day === 2)) {
        return holiday;
      }
      if (holiday.id === 'christmas' && (day === 24 || day === 25)) {
        return holiday;
      }
      // Standard single-day holidays
      if (holiday.day === day) {
        return holiday;
      }
    }
  }

  return null;
}

/**
 * Get the next upcoming holiday from a given date
 */
export function getNextHoliday(date: Date = new Date()): HolidayTheme {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Find next holiday chronologically
  for (const holiday of MEXICAN_HOLIDAYS) {
    if (holiday.month > month || (holiday.month === month && holiday.day && holiday.day > day)) {
      return holiday;
    }
  }

  // If no holiday found this year, return first holiday of next year
  return MEXICAN_HOLIDAYS[0];
}

/**
 * Check if a date falls within the holiday's active period
 */
export function isHolidayActive(holiday: HolidayTheme, date: Date = new Date()): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (holiday.month !== month) return false;

  // Multi-day holidays
  if (holiday.id === 'dia-de-muertos') {
    return day === 1 || day === 2;
  }
  if (holiday.id === 'christmas') {
    return day === 24 || day === 25;
  }

  return holiday.day === day;
}

/**
 * Get all holidays for a specific month
 */
export function getHolidaysInMonth(month: number): HolidayTheme[] {
  return MEXICAN_HOLIDAYS.filter(h => h.month === month);
}
