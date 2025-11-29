'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { getActiveHoliday, type HolidayTheme } from './holidays';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  /** Current theme mode (light/dark/system) */
  mode: ThemeMode;
  /** Set the theme mode */
  setMode: (mode: ThemeMode) => void;
  /** Currently active holiday theme, if any */
  activeHoliday: HolidayTheme | null;
  /** Whether holiday themes are enabled */
  holidayThemesEnabled: boolean;
  /** Toggle holiday themes on/off */
  setHolidayThemesEnabled: (enabled: boolean) => void;
  /** Resolved theme (actual light/dark, not system) */
  resolvedTheme: 'light' | 'dark' | undefined;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const HOLIDAY_THEMES_KEY = 'avala-holiday-themes-enabled';

interface ThemeProviderProps {
  children: ReactNode;
  /** Default theme mode */
  defaultMode?: ThemeMode;
  /** Storage key for theme preference */
  storageKey?: string;
}

/**
 * Theme Provider Component
 *
 * Wraps next-themes with holiday theme detection and management.
 * Automatically applies holiday-themed CSS variables when enabled.
 */
export function ThemeProvider({
  children,
  defaultMode = 'system',
  storageKey = 'avala-theme',
}: ThemeProviderProps) {
  const [activeHoliday, setActiveHoliday] = useState<HolidayTheme | null>(null);
  const [holidayThemesEnabled, setHolidayThemesEnabledState] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Check for active holiday on mount and date changes
  useEffect(() => {
    setMounted(true);

    // Load holiday preference from localStorage
    const stored = localStorage.getItem(HOLIDAY_THEMES_KEY);
    if (stored !== null) {
      setHolidayThemesEnabledState(stored === 'true');
    }

    // Check for active holiday
    const checkHoliday = () => {
      const holiday = getActiveHoliday();
      setActiveHoliday(holiday);
    };

    checkHoliday();

    // Check at midnight for date changes
    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() -
      now.getTime();

    const midnightTimeout = setTimeout(() => {
      checkHoliday();
      // Then check every 24 hours
      const dailyInterval = setInterval(checkHoliday, 24 * 60 * 60 * 1000);
      return () => clearInterval(dailyInterval);
    }, msUntilMidnight);

    return () => clearTimeout(midnightTimeout);
  }, []);

  // Apply holiday CSS variables when holiday is active
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    if (activeHoliday && holidayThemesEnabled) {
      // Apply holiday colors as CSS variables
      const { colors } = activeHoliday;
      root.style.setProperty('--holiday-primary', colors.primary);
      root.style.setProperty('--holiday-secondary', colors.secondary);
      root.style.setProperty('--holiday-accent', colors.accent);
      root.setAttribute('data-holiday', activeHoliday.id);
      root.classList.add('holiday-theme');
    } else {
      // Remove holiday variables
      root.style.removeProperty('--holiday-primary');
      root.style.removeProperty('--holiday-secondary');
      root.style.removeProperty('--holiday-accent');
      root.removeAttribute('data-holiday');
      root.classList.remove('holiday-theme');
    }
  }, [activeHoliday, holidayThemesEnabled, mounted]);

  const setHolidayThemesEnabled = useCallback((enabled: boolean) => {
    setHolidayThemesEnabledState(enabled);
    localStorage.setItem(HOLIDAY_THEMES_KEY, String(enabled));
  }, []);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultMode}
      storageKey={storageKey}
      enableSystem
      disableTransitionOnChange={false}
    >
      <ThemeContextInner
        activeHoliday={activeHoliday}
        holidayThemesEnabled={holidayThemesEnabled}
        setHolidayThemesEnabled={setHolidayThemesEnabled}
      >
        {children}
      </ThemeContextInner>
    </NextThemesProvider>
  );
}

/**
 * Inner component to access next-themes context
 */
function ThemeContextInner({
  children,
  activeHoliday,
  holidayThemesEnabled,
  setHolidayThemesEnabled,
}: {
  children: ReactNode;
  activeHoliday: HolidayTheme | null;
  holidayThemesEnabled: boolean;
  setHolidayThemesEnabled: (enabled: boolean) => void;
}) {
  // We need to use next-themes hooks here
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>();

  // Sync with next-themes
  useEffect(() => {
    // Access next-themes state after mount
    const storedTheme = localStorage.getItem('avala-theme');
    if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
      setModeState(storedTheme);
    }

    // Detect resolved theme
    const isDark = document.documentElement.classList.contains('dark');
    setResolvedTheme(isDark ? 'dark' : 'light');

    // Watch for class changes
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setResolvedTheme(isDark ? 'dark' : 'light');
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('avala-theme', newMode);

    // Apply theme
    if (newMode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    } else {
      document.documentElement.classList.toggle('dark', newMode === 'dark');
    }
  }, []);

  const value: ThemeContextValue = {
    mode,
    setMode,
    activeHoliday,
    holidayThemesEnabled,
    setHolidayThemesEnabled,
    resolvedTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Hook to get only holiday-related state
 */
export function useHolidayTheme() {
  const { activeHoliday, holidayThemesEnabled, setHolidayThemesEnabled } = useTheme();
  return { activeHoliday, holidayThemesEnabled, setHolidayThemesEnabled };
}
