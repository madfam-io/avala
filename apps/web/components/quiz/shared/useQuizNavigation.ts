"use client";

import { useState, useCallback } from "react";
import type { Question, QuestionStatus } from "./types";

interface UseQuizNavigationOptions {
  questions: Question[];
  onNavigate?: () => void;
}

interface UseQuizNavigationReturn {
  currentIndex: number;
  currentQuestion: Question | undefined;
  totalQuestions: number;
  progress: number;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  goToQuestion: (index: number) => void;
  goToNext: () => void;
  goToPrevious: () => void;
  flaggedQuestions: Set<string>;
  toggleFlag: (questionId: string) => void;
  getQuestionStatus: (
    index: number,
    isAnswered: (questionId: string) => boolean
  ) => QuestionStatus;
}

/**
 * Custom hook for quiz navigation
 * Handles question navigation, flagging, and status tracking
 */
export function useQuizNavigation({
  questions,
  onNavigate,
}: UseQuizNavigationOptions): UseQuizNavigationReturn {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  const goToQuestion = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalQuestions) {
        onNavigate?.();
        setCurrentIndex(index);
      }
    },
    [totalQuestions, onNavigate]
  );

  const goToNext = useCallback(() => {
    goToQuestion(currentIndex + 1);
  }, [currentIndex, goToQuestion]);

  const goToPrevious = useCallback(() => {
    goToQuestion(currentIndex - 1);
  }, [currentIndex, goToQuestion]);

  const toggleFlag = useCallback((questionId: string) => {
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  }, []);

  const getQuestionStatus = useCallback(
    (index: number, isAnswered: (questionId: string) => boolean): QuestionStatus => {
      const q = questions[index];
      if (!q) return "unanswered";
      if (flaggedQuestions.has(q.id)) return "flagged";
      if (isAnswered(q.id)) return "answered";
      return "unanswered";
    },
    [questions, flaggedQuestions]
  );

  return {
    currentIndex,
    currentQuestion,
    totalQuestions,
    progress,
    isFirstQuestion,
    isLastQuestion,
    goToQuestion,
    goToNext,
    goToPrevious,
    flaggedQuestions,
    toggleFlag,
    getQuestionStatus,
  };
}
