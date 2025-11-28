"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, FileQuestion, Target, Trophy } from "lucide-react";

export interface Quiz {
  id: string;
  code: string;
  title: string;
  description: string | null;
  timeLimit: number | null;
  passingScore: number;
  allowedAttempts: number;
  status: string;
  _count?: {
    questions: number;
    attempts: number;
  };
}

interface QuizCardProps {
  quiz: Quiz;
  userAttempts?: number;
  bestScore?: number;
  onStart: (quizId: string) => void;
  isStarting?: boolean;
}

/**
 * QuizCard Component
 * Displays quiz information with start button
 */
export function QuizCard({
  quiz,
  userAttempts = 0,
  bestScore,
  onStart,
  isStarting,
}: QuizCardProps) {
  const attemptsRemaining = quiz.allowedAttempts - userAttempts;
  const hasPassed = bestScore !== undefined && bestScore >= quiz.passingScore;

  return (
    <Card className="flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg">{quiz.title}</CardTitle>
            <CardDescription className="mt-1">
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                {quiz.code}
              </code>
            </CardDescription>
          </div>
          {hasPassed ? (
            <Badge className="bg-green-500">Passed</Badge>
          ) : bestScore !== undefined ? (
            <Badge variant="secondary">Best: {bestScore}%</Badge>
          ) : (
            <Badge variant="outline">Not Attempted</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {quiz.description || "No description available"}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileQuestion className="h-4 w-4" />
            <span>{quiz._count?.questions || 0} questions</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{quiz.timeLimit ? `${quiz.timeLimit} min` : "No limit"}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Target className="h-4 w-4" />
            <span>Pass: {quiz.passingScore}%</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Trophy className="h-4 w-4" />
            <span>
              {attemptsRemaining > 0
                ? `${attemptsRemaining} attempts left`
                : "No attempts left"}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4">
        <Button
          onClick={() => onStart(quiz.id)}
          disabled={isStarting || attemptsRemaining <= 0 || hasPassed}
          className="w-full"
        >
          {isStarting
            ? "Starting..."
            : hasPassed
              ? "Completed"
              : attemptsRemaining <= 0
                ? "No Attempts Left"
                : "Start Quiz"}
        </Button>
      </CardFooter>
    </Card>
  );
}
