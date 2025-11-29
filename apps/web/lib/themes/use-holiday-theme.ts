"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getActiveHoliday,
  getNextHoliday,
  MEXICAN_HOLIDAYS,
  type HolidayTheme,
} from "./holidays";

interface UseHolidayDetectionOptions {
  /** Check interval in milliseconds (default: check at midnight) */
  checkInterval?: number;
  /** Enable preview mode to test specific holidays */
  previewMode?: boolean;
}

interface HolidayDetectionState {
  /** Currently active holiday (null if none) */
  activeHoliday: HolidayTheme | null;
  /** Next upcoming holiday */
  nextHoliday: HolidayTheme;
  /** Days until next holiday */
  daysUntilNext: number;
  /** Whether we're in preview mode */
  isPreview: boolean;
  /** Preview a specific holiday (for testing/demo) */
  previewHoliday: (holidayId: string | null) => void;
  /** All available holidays */
  allHolidays: HolidayTheme[];
}

/**
 * Hook for detecting and managing holiday themes
 *
 * Automatically detects active holidays and provides utilities
 * for previewing and managing holiday themes.
 *
 * @example
 * ```tsx
 * const { activeHoliday, nextHoliday, previewHoliday } = useHolidayDetection();
 *
 * // Preview a holiday
 * previewHoliday('dia-de-muertos');
 *
 * // Clear preview
 * previewHoliday(null);
 * ```
 */
export function useHolidayDetection(
  options: UseHolidayDetectionOptions = {},
): HolidayDetectionState {
  const { previewMode = false } = options;

  const [activeHoliday, setActiveHoliday] = useState<HolidayTheme | null>(null);
  const [previewedHoliday, setPreviewedHoliday] = useState<HolidayTheme | null>(
    null,
  );
  const [isPreview, setIsPreview] = useState(false);

  // Calculate next holiday and days until
  const nextHoliday = getNextHoliday();
  const daysUntilNext = calculateDaysUntil(nextHoliday);

  // Check for active holiday
  useEffect(() => {
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

  // Preview holiday function
  const previewHoliday = useCallback(
    (holidayId: string | null) => {
      if (!previewMode && process.env.NODE_ENV !== "development") {
        console.warn("Holiday preview is only available in development mode");
        return;
      }

      if (holidayId === null) {
        setPreviewedHoliday(null);
        setIsPreview(false);
        // Remove preview CSS
        const root = document.documentElement;
        root.removeAttribute("data-holiday-preview");
        return;
      }

      const holiday = MEXICAN_HOLIDAYS.find((h) => h.id === holidayId);
      if (holiday) {
        setPreviewedHoliday(holiday);
        setIsPreview(true);
        // Apply preview CSS
        applyHolidayPreview(holiday);
      }
    },
    [previewMode],
  );

  // Return previewed holiday if in preview mode, otherwise actual
  const effectiveHoliday = isPreview ? previewedHoliday : activeHoliday;

  return {
    activeHoliday: effectiveHoliday,
    nextHoliday,
    daysUntilNext,
    isPreview,
    previewHoliday,
    allHolidays: MEXICAN_HOLIDAYS,
  };
}

/**
 * Calculate days until a holiday
 */
function calculateDaysUntil(holiday: HolidayTheme): number {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Create date for this year's holiday
  let holidayDate = new Date(currentYear, holiday.month - 1, holiday.day || 1);

  // If holiday has passed this year, use next year
  if (holidayDate < now) {
    holidayDate = new Date(
      currentYear + 1,
      holiday.month - 1,
      holiday.day || 1,
    );
  }

  const diffTime = holidayDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Apply holiday preview styles to document
 */
function applyHolidayPreview(holiday: HolidayTheme) {
  const root = document.documentElement;
  const { colors } = holiday;

  root.style.setProperty("--holiday-primary", colors.primary);
  root.style.setProperty("--holiday-secondary", colors.secondary);
  root.style.setProperty("--holiday-accent", colors.accent);
  root.setAttribute("data-holiday", holiday.id);
  root.setAttribute("data-holiday-preview", "true");
  root.classList.add("holiday-theme");
}

/**
 * Hook for countdown to next holiday
 */
export function useHolidayCountdown() {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });
  const nextHoliday = getNextHoliday();

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const currentYear = now.getFullYear();

      let holidayDate = new Date(
        currentYear,
        nextHoliday.month - 1,
        nextHoliday.day || 1,
      );
      if (holidayDate < now) {
        holidayDate = new Date(
          currentYear + 1,
          nextHoliday.month - 1,
          nextHoliday.day || 1,
        );
      }

      const diff = holidayDate.getTime() - now.getTime();

      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [nextHoliday]);

  return { ...countdown, holiday: nextHoliday };
}
