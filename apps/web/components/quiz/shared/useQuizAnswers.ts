"use client";

import { useState, useCallback } from "react";
import type { AnswerValue, QuestionAnswer } from "./types";

interface UseQuizAnswersOptions {
  trackTime?: boolean;
}

interface UseQuizAnswersReturn {
  answers: Record<string, QuestionAnswer>;
  answeredCount: number;
  setAnswer: (questionId: string, answer: AnswerValue) => void;
  setMultipleAnswer: (questionId: string, optionId: string, checked: boolean) => void;
  setMatchingAnswer: (questionId: string, leftItem: string, rightItem: string) => void;
  getAnswer: (questionId: string) => AnswerValue | undefined;
  getAnswersArray: () => QuestionAnswer[];
  getTotalTimeSpent: () => number;
  recordQuestionTime: () => number;
  resetQuestionTimer: () => void;
}

/**
 * Custom hook for managing quiz answers
 * Handles answer state, time tracking, and answer transformations
 */
export function useQuizAnswers({
  trackTime = true,
}: UseQuizAnswersOptions = {}): UseQuizAnswersReturn {
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);

  const recordQuestionTime = useCallback((): number => {
    if (!trackTime) return 0;
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
    setTotalTimeSpent((prev) => prev + timeSpent);
    return timeSpent;
  }, [questionStartTime, trackTime]);

  const resetQuestionTimer = useCallback(() => {
    setQuestionStartTime(Date.now());
  }, []);

  const setAnswer = useCallback(
    (questionId: string, answer: AnswerValue) => {
      const timeSpent = trackTime ? recordQuestionTime() : 0;
      setAnswers((prev) => ({
        ...prev,
        [questionId]: {
          questionId,
          answer,
          timeSpent: (prev[questionId]?.timeSpent || 0) + timeSpent,
        },
      }));
      if (trackTime) resetQuestionTimer();
    },
    [recordQuestionTime, resetQuestionTimer, trackTime]
  );

  const setMultipleAnswer = useCallback(
    (questionId: string, optionId: string, checked: boolean) => {
      setAnswers((prev) => {
        const currentAnswers = (prev[questionId]?.answer as string[]) || [];
        const newAnswers = checked
          ? [...currentAnswers, optionId]
          : currentAnswers.filter((id) => id !== optionId);
        
        return {
          ...prev,
          [questionId]: {
            questionId,
            answer: newAnswers,
            timeSpent: prev[questionId]?.timeSpent || 0,
          },
        };
      });
    },
    []
  );

  const setMatchingAnswer = useCallback(
    (questionId: string, leftItem: string, rightItem: string) => {
      setAnswers((prev) => {
        const currentMatching = (prev[questionId]?.answer as Record<string, string>) || {};
        return {
          ...prev,
          [questionId]: {
            questionId,
            answer: { ...currentMatching, [leftItem]: rightItem },
            timeSpent: prev[questionId]?.timeSpent || 0,
          },
        };
      });
    },
    []
  );

  const getAnswer = useCallback(
    (questionId: string): AnswerValue | undefined => {
      return answers[questionId]?.answer;
    },
    [answers]
  );

  const getAnswersArray = useCallback((): QuestionAnswer[] => {
    return Object.values(answers);
  }, [answers]);

  const getTotalTimeSpent = useCallback((): number => {
    return totalTimeSpent + (trackTime ? recordQuestionTime() : 0);
  }, [totalTimeSpent, recordQuestionTime, trackTime]);

  return {
    answers,
    answeredCount: Object.keys(answers).length,
    setAnswer,
    setMultipleAnswer,
    setMatchingAnswer,
    getAnswer,
    getAnswersArray,
    getTotalTimeSpent,
    recordQuestionTime,
    resetQuestionTimer,
  };
}
