"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

import {
  CheckCircle2,
  XCircle,
  Trophy,
  Clock,
  Target,
  RotateCcw,
  Home,
} from "lucide-react";

export interface GradedQuestion {
  questionId: string;
  correct: boolean;
  pointsEarned: number;
  pointsPossible: number;
  feedback?: string;
}

export interface QuizResult {
  attemptId: string;
  quizId: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  gradedQuestions: GradedQuestion[];
  completedAt: Date;
}

interface QuizResultsProps {
  result: QuizResult;
  quizTitle: string;
  passingScore: number;
  onRetry?: () => void;
  onGoHome: () => void;
  canRetry?: boolean;
}

/**
 * QuizResults Component
 * Displays quiz results with score breakdown
 */
export function QuizResults({
  result,
  quizTitle: _quizTitle,
  passingScore,
  onRetry,
  onGoHome,
  canRetry = false,
}: QuizResultsProps) {
  const correctCount = result.gradedQuestions.filter((q) => q.correct).length;
  const totalQuestions = result.gradedQuestions.length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Main Result Card */}
      <Card
        className={
          result.passed ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"
        }
      >
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4">
            {result.passed ? (
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <Trophy className="h-10 w-10 text-green-600" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl">
            {result.passed ? "Congratulations!" : "Keep Trying!"}
          </CardTitle>
          <CardDescription className="text-base">
            {result.passed
              ? "You have passed the quiz"
              : `You need ${passingScore}% to pass`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Score Display */}
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">
              {result.percentage}%
            </div>
            <div className="text-muted-foreground">
              {result.score} / {result.totalPoints} points
            </div>
          </div>

          <Progress
            value={result.percentage}
            className={`h-3 ${result.passed ? "[&>div]:bg-green-500" : "[&>div]:bg-red-500"}`}
          />

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-semibold">{correctCount}</span>
              </div>
              <div className="text-xs text-muted-foreground">Correct</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                <XCircle className="h-4 w-4" />
                <span className="font-semibold">
                  {totalQuestions - correctCount}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">Incorrect</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Target className="h-4 w-4" />
                <span className="font-semibold">{passingScore}%</span>
              </div>
              <div className="text-xs text-muted-foreground">Pass Score</div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center gap-4 pt-6">
          {canRetry && !result.passed && onRetry && (
            <Button onClick={onRetry} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          <Button onClick={onGoHome}>
            <Home className="h-4 w-4 mr-2" />
            Back to Quizzes
          </Button>
        </CardFooter>
      </Card>

      {/* Question Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Question Breakdown</CardTitle>
          <CardDescription>
            Review your answers for each question
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.gradedQuestions.map((question, index) => (
            <div
              key={question.questionId}
              className={`flex items-center justify-between p-3 rounded-lg ${
                question.correct ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <div className="flex items-center gap-3">
                {question.correct ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="font-medium">Question {index + 1}</span>
              </div>
              <Badge variant={question.correct ? "default" : "secondary"}>
                {question.pointsEarned} / {question.pointsPossible} pts
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Completion Info */}
      <div className="text-center text-sm text-muted-foreground">
        <Clock className="h-4 w-4 inline mr-1" />
        Completed on {new Date(result.completedAt).toLocaleString()}
      </div>
    </div>
  );
}
