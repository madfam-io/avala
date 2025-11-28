"use client";

import type { Question, QuestionStatus } from "./types";

interface QuizNavigatorProps {
  questions: Question[];
  currentIndex: number;
  getQuestionStatus: (index: number) => QuestionStatus;
  onNavigate: (index: number) => void;
  showLegend?: boolean;
}

/**
 * Question navigation dots/buttons component
 * Shows progress through quiz with visual status indicators
 */
export function QuizNavigator({
  questions,
  currentIndex,
  getQuestionStatus,
  onNavigate,
  showLegend = true,
}: QuizNavigatorProps) {
  const getStatusStyles = (status: QuestionStatus, isCurrent: boolean) => {
    if (isCurrent) {
      return "bg-primary text-primary-foreground";
    }

    switch (status) {
      case "answered":
        return "bg-green-100 text-green-700 border border-green-300 hover:bg-green-200";
      case "flagged":
        return "bg-yellow-100 text-yellow-700 border border-yellow-500 hover:bg-yellow-200";
      default:
        return "bg-muted hover:bg-muted/80";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {questions.map((q, i) => {
          const status = getQuestionStatus(i);
          const isCurrent = i === currentIndex;

          return (
            <button
              key={q.id}
              onClick={() => onNavigate(i)}
              className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${getStatusStyles(
                status,
                isCurrent,
              )}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {showLegend && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-50 border border-green-500 rounded" />
            Answered
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-50 border border-yellow-500 rounded" />
            Flagged
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-white border rounded" />
            Unanswered
          </span>
        </div>
      )}
    </div>
  );
}
