"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Award,
  RefreshCw,
  ArrowRight,
  Trophy,
  Target,
} from "lucide-react";

interface QuizResultsProps {
  result: {
    score: number;
    passed: boolean;
    totalPoints: number;
    correctAnswers: number;
    totalQuestions: number;
    timeSpent?: number;
    feedback?: string;
    detailedResults?: {
      questionId: string;
      questionText: string;
      correct: boolean;
      userAnswer: string | string[];
      correctAnswer: string | string[];
      explanation?: string;
    }[];
  };
  passingScore: number;
  maxAttempts?: number;
  attemptsUsed?: number;
  onRetry?: () => void;
  onContinue?: () => void;
}

export function QuizResults({
  result,
  passingScore,
  maxAttempts,
  attemptsUsed = 1,
  onRetry,
  onContinue,
}: QuizResultsProps) {
  const percentage = Math.round((result.score / result.totalPoints) * 100);
  const canRetry = maxAttempts ? attemptsUsed < maxAttempts : true;

  const formatTime = (seconds?: number): string => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Result Header */}
      <Card
        className={`border-2 ${
          result.passed ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"
        }`}
      >
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            {result.passed ? (
              <>
                <div className="p-4 bg-green-100 rounded-full">
                  <Trophy className="h-12 w-12 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-green-700">
                  ¡Felicidades! Aprobaste
                </h2>
              </>
            ) : (
              <>
                <div className="p-4 bg-red-100 rounded-full">
                  <Target className="h-12 w-12 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-red-700">
                  No alcanzaste el puntaje mínimo
                </h2>
              </>
            )}
            <p className="text-muted-foreground">
              Puntaje mínimo requerido: {passingScore}%
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Score Details */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-4xl font-bold text-primary">{percentage}%</div>
            <p className="text-sm text-muted-foreground mt-1">Puntaje</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-4xl font-bold">
              {result.correctAnswers}/{result.totalQuestions}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Correctas</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-4xl font-bold">
              {result.score}/{result.totalPoints}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Puntos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-4xl font-bold">{formatTime(result.timeSpent)}</div>
            <p className="text-sm text-muted-foreground mt-1">Tiempo</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tu desempeño</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Puntaje obtenido</span>
              <span>{percentage}%</span>
            </div>
            <div className="relative h-4 bg-muted rounded-full overflow-hidden">
              <div
                className={`absolute h-full transition-all ${
                  result.passed ? "bg-green-500" : "bg-red-500"
                }`}
                style={{ width: `${percentage}%` }}
              />
              <div
                className="absolute h-full w-px bg-yellow-500"
                style={{ left: `${passingScore}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span className="text-yellow-600">Mínimo: {passingScore}%</span>
              <span>100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback */}
      {result.feedback && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Retroalimentación</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{result.feedback}</p>
          </CardContent>
        </Card>
      )}

      {/* Detailed Results */}
      {result.detailedResults && result.detailedResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revisión de respuestas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.detailedResults.map((detail, idx) => (
              <div
                key={detail.questionId}
                className={`p-4 rounded-lg border ${
                  detail.correct
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {detail.correct ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-2">
                    <p className="font-medium">
                      {idx + 1}. {detail.questionText}
                    </p>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="text-muted-foreground">Tu respuesta: </span>
                        <span
                          className={detail.correct ? "text-green-700" : "text-red-700"}
                        >
                          {Array.isArray(detail.userAnswer)
                            ? detail.userAnswer.join(", ")
                            : detail.userAnswer || "Sin respuesta"}
                        </span>
                      </p>
                      {!detail.correct && (
                        <p>
                          <span className="text-muted-foreground">
                            Respuesta correcta:{" "}
                          </span>
                          <span className="text-green-700">
                            {Array.isArray(detail.correctAnswer)
                              ? detail.correctAnswer.join(", ")
                              : detail.correctAnswer}
                          </span>
                        </p>
                      )}
                    </div>
                    {detail.explanation && (
                      <p className="text-sm text-muted-foreground italic mt-2">
                        {detail.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Attempts Info */}
      {maxAttempts && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Intentos utilizados: {attemptsUsed} de {maxAttempts}
                </span>
              </div>
              {!canRetry && (
                <Badge variant="destructive">Sin intentos restantes</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-4">
        {!result.passed && canRetry && onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Intentar de nuevo
          </Button>
        )}
        {result.passed && onContinue && (
          <Button onClick={onContinue}>
            Continuar
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
