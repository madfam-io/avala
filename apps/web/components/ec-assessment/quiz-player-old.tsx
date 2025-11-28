"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  CheckCircle,
  AlertCircle,
  Send,
} from "lucide-react";
import { assessmentApi, type ECAssessment } from "@/lib/api/ec-api";

interface Question {
  id: string;
  text: string;
  type: "single" | "multiple" | "open";
  options?: { id: string; text: string }[];
  points: number;
}

interface QuizPlayerProps {
  assessment: ECAssessment;
  enrollmentId: string;
  onComplete?: (result: QuizResult) => void;
  onExit?: () => void;
}

interface QuizResult {
  score: number;
  passed: boolean;
  totalPoints: number;
  correctAnswers: number;
  totalQuestions: number;
}

type Answer = string | string[];

export function QuizPlayer({
  assessment,
  enrollmentId,
  onComplete,
  onExit: _onExit,
}: QuizPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(
    new Set(),
  );
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    assessment.timeLimit ? assessment.timeLimit * 60 : null,
  );
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  const questions: Question[] = (assessment.questions as Question[]) || [];
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;

  // Start attempt on mount
  useEffect(() => {
    const startAttempt = async () => {
      try {
        const attempt = await assessmentApi.startAttempt(
          assessment.id,
          enrollmentId,
        );
        setAttemptId(attempt.id);
      } catch (error) {
        console.error("Error starting attempt:", error);
      }
    };
    startAttempt();
  }, [assessment.id, enrollmentId]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return undefined;

    const timer = setInterval(() => {
      setTimeRemaining((prev): number => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswer = useCallback((questionId: string, answer: Answer) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }, []);

  const handleMultipleAnswer = useCallback(
    (questionId: string, optionId: string, checked: boolean) => {
      setAnswers((prev) => {
        const currentAnswers = (prev[questionId] as string[]) || [];
        if (checked) {
          return { ...prev, [questionId]: [...currentAnswers, optionId] };
        } else {
          return {
            ...prev,
            [questionId]: currentAnswers.filter((id) => id !== optionId),
          };
        }
      });
    },
    [],
  );

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

  const goToQuestion = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalQuestions) {
        setCurrentIndex(index);
      }
    },
    [totalQuestions],
  );

  const handleSubmit = async () => {
    if (!attemptId) return;

    setSubmitting(true);
    try {
      const result = await assessmentApi.submitAttempt(
        attemptId,
        Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          response: answer,
        })),
      );

      onComplete?.({
        score: result.score,
        passed: result.passed,
        totalPoints: result.maxScore,
        correctAnswers: result.correctCount,
        totalQuestions,
      });
    } catch (error) {
      console.error("Error submitting attempt:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const answer = answers[currentQuestion.id];

    switch (currentQuestion.type) {
      case "single":
        return (
          <RadioGroup
            value={answer as string}
            onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
            className="space-y-3"
          >
            {currentQuestion.options?.map((option) => (
              <div
                key={option.id}
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
              >
                <RadioGroupItem value={option.id} id={option.id} />
                <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "multiple":
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option) => {
              const isChecked = ((answer as string[]) || []).includes(
                option.id,
              );
              return (
                <div
                  key={option.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    id={option.id}
                    checked={isChecked}
                    onCheckedChange={(checked) =>
                      handleMultipleAnswer(
                        currentQuestion.id,
                        option.id,
                        checked as boolean,
                      )
                    }
                  />
                  <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                    {option.text}
                  </Label>
                </div>
              );
            })}
          </div>
        );

      case "open":
        return (
          <Textarea
            value={(answer as string) || ""}
            onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
            placeholder="Escribe tu respuesta aquí..."
            rows={6}
          />
        );

      default:
        return null;
    }
  };

  const getQuestionStatus = (index: number) => {
    const q = questions[index];
    if (!q) return "unanswered";
    if (flaggedQuestions.has(q.id)) return "flagged";
    if (answers[q.id]) return "answered";
    return "unanswered";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with Timer and Progress */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="font-semibold">{assessment.title}</h2>
              <Badge variant="outline">
                {answeredCount}/{totalQuestions} respondidas
              </Badge>
            </div>
            {timeRemaining !== null && (
              <div
                className={`flex items-center gap-2 ${
                  timeRemaining < 60 ? "text-red-500" : ""
                }`}
              >
                <Clock className="h-5 w-5" />
                <span className="font-mono text-lg">
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
          </div>
          <Progress
            value={(answeredCount / totalQuestions) * 100}
            className="mt-4"
          />
        </CardContent>
      </Card>

      {/* Question Navigator */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-2">
            {questions.map((q, idx) => {
              const status = getQuestionStatus(idx);
              return (
                <Button
                  key={q.id}
                  variant={currentIndex === idx ? "default" : "outline"}
                  size="sm"
                  className={`w-10 h-10 ${
                    status === "flagged"
                      ? "border-yellow-500 bg-yellow-50"
                      : status === "answered"
                        ? "border-green-500 bg-green-50"
                        : ""
                  }`}
                  onClick={() => goToQuestion(idx)}
                >
                  {idx + 1}
                </Button>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-50 border border-green-500 rounded" />
              Respondida
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-50 border border-yellow-500 rounded" />
              Marcada
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-white border rounded" />
              Sin responder
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Current Question */}
      {currentQuestion && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Pregunta {currentIndex + 1} de {totalQuestions}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{currentQuestion.points} pts</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleFlag(currentQuestion.id)}
                  className={
                    flaggedQuestions.has(currentQuestion.id)
                      ? "text-yellow-500"
                      : ""
                  }
                >
                  <Flag className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-6">{currentQuestion.text}</p>
            {renderQuestion()}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => goToQuestion(currentIndex - 1)}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            {currentIndex === totalQuestions - 1 ? (
              <Button onClick={() => setShowConfirmSubmit(true)}>
                <Send className="h-4 w-4 mr-1" />
                Finalizar
              </Button>
            ) : (
              <Button onClick={() => goToQuestion(currentIndex + 1)}>
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </CardFooter>
        </Card>
      )}

      {/* Submit Confirmation */}
      {showConfirmSubmit && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Confirmar envío
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>
                Estás a punto de finalizar el cuestionario. Una vez enviado, no
                podrás modificar tus respuestas.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{answeredCount} preguntas respondidas</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span>
                    {totalQuestions - answeredCount} preguntas sin responder
                  </span>
                </div>
              </div>
              {flaggedQuestions.size > 0 && (
                <Alert>
                  <AlertDescription>
                    Tienes {flaggedQuestions.size} preguntas marcadas para
                    revisar.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmSubmit(false)}
            >
              Revisar respuestas
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Enviando..." : "Confirmar y enviar"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
