/**
 * Theme System
 *
 * Exports for the AVALA theme system including:
 * - ThemeProvider for wrapping the app
 * - useTheme and useHolidayTheme hooks
 * - Holiday configuration and utilities
 */

// Provider and hooks
export {
  ThemeProvider,
  useTheme,
  useHolidayTheme,
  type ThemeMode,
} from "./theme-provider";

// Holiday configuration
export {
  MEXICAN_HOLIDAYS,
  getActiveHoliday,
  getNextHoliday,
  isHolidayActive,
  getHolidaysInMonth,
  type HolidayTheme,
} from "./holidays";

// Holiday detection hooks
export { useHolidayDetection, useHolidayCountdown } from "./use-holiday-theme";
