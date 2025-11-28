"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock } from "lucide-react";

interface QuizProgressProps {
  title: string;
  currentIndex: number;
  totalQuestions: number;
  answeredCount: number;
  progress: number;
  timeRemaining?: number | null;
  isLowTime?: boolean;
  formatTime?: (seconds: number) => string;
}

/**
 * Shared quiz progress header component
 * Displays title, timer, and progress bar
 */
export function QuizProgress({
  title,
  currentIndex,
  totalQuestions,
  answeredCount,
  progress,
  timeRemaining,
  isLowTime,
  formatTime,
}: QuizProgressProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Badge variant="outline">
            {answeredCount}/{totalQuestions} answered
          </Badge>
        </div>
        {timeRemaining !== null && timeRemaining !== undefined && formatTime && (
          <Badge
            variant={isLowTime ? "destructive" : "secondary"}
            className="text-lg px-3 py-1"
          >
            <Clock className="h-4 w-4 mr-2" />
            {formatTime(timeRemaining)}
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <span>
            {answeredCount} of {totalQuestions} answered
          </span>
        </div>
        <Progress value={progress} />
      </div>
    </div>
  );
}
