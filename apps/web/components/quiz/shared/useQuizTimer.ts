"use client";

import { useState, useEffect, useCallback } from "react";

interface UseQuizTimerOptions {
  initialTime: number | null;
  onTimeUp?: () => void;
}

interface UseQuizTimerReturn {
  timeRemaining: number | null;
  isTimeUp: boolean;
  formatTime: (seconds: number) => string;
  isLowTime: boolean;
}

/**
 * Custom hook for quiz timer functionality
 * Handles countdown, formatting, and time-up callback
 */
export function useQuizTimer({
  initialTime,
  onTimeUp,
}: UseQuizTimerOptions): UseQuizTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(initialTime);
  const [isTimeUp, setIsTimeUp] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return undefined;

    const timer = setInterval(() => {
      setTimeRemaining((prev): number => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          setIsTimeUp(true);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, onTimeUp]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const isLowTime = timeRemaining !== null && timeRemaining < 60;

  return {
    timeRemaining,
    isTimeUp,
    formatTime,
    isLowTime,
  };
}
