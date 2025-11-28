"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle,
  AlertCircle,
  Send,
} from "lucide-react";
import { assessmentApi, type ECAssessment } from "@/lib/api/ec-api";
import {
  useQuizTimer,
  useQuizAnswers,
  useQuizNavigation,
  QuestionRenderer,
  QuizProgress,
  QuizNavigator,
  type ECQuestion,
  type AnswerValue,
} from "@/components/quiz/shared";

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

/**
 * EC Assessment QuizPlayer (Refactored)
 * Uses shared quiz infrastructure for EC assessments
 */
export function QuizPlayer({
  assessment,
  enrollmentId,
  onComplete,
  onExit: _onExit,
}: QuizPlayerProps) {
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  const questions: ECQuestion[] = (assessment.questions as ECQuestion[]) || [];

  // Initialize hooks
  const { answers, answeredCount, setAnswer, setMultipleAnswer, getAnswer } =
    useQuizAnswers({ trackTime: false });

  const navigation = useQuizNavigation({ questions });

  const handleTimeUp = () => {
    handleSubmit();
  };

  const timer = useQuizTimer({
    initialTime: assessment.timeLimit ? assessment.timeLimit * 60 : null,
    onTimeUp: handleTimeUp,
  });

  const {
    currentQuestion,
    currentIndex,
    totalQuestions,
    progress: _progress,
    isFirstQuestion,
    isLastQuestion,
    flaggedQuestions,
    toggleFlag,
  } = navigation;

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

  const handleSubmit = async () => {
    if (!attemptId) return;

    setSubmitting(true);
    try {
      const result = await assessmentApi.submitAttempt(
        attemptId,
        Object.entries(answers).map(([questionId, qa]) => ({
          questionId,
          response: qa.answer,
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

  const handleAnswer = (answer: AnswerValue) => {
    if (currentQuestion) {
      setAnswer(currentQuestion.id, answer);
    }
  };

  const handleMultipleAnswer = (optionId: string, checked: boolean) => {
    if (currentQuestion) {
      setMultipleAnswer(currentQuestion.id, optionId, checked);
    }
  };

  const isAnswered = (questionId: string) => !!answers[questionId];

  if (!currentQuestion) {
    return <div>No questions available</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with Timer and Progress */}
      <Card>
        <CardContent className="py-4">
          <QuizProgress
            title={assessment.title}
            currentIndex={currentIndex}
            totalQuestions={totalQuestions}
            answeredCount={answeredCount}
            progress={(answeredCount / totalQuestions) * 100}
            timeRemaining={timer.timeRemaining}
            isLowTime={timer.isLowTime}
            formatTime={timer.formatTime}
          />
        </CardContent>
      </Card>

      {/* Question Navigator */}
      <Card>
        <CardContent className="py-4">
          <QuizNavigator
            questions={questions}
            currentIndex={currentIndex}
            getQuestionStatus={(idx) =>
              navigation.getQuestionStatus(idx, isAnswered)
            }
            onNavigate={navigation.goToQuestion}
            showLegend={true}
          />
        </CardContent>
      </Card>

      {/* Current Question */}
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
          <p className="text-lg mb-6">{(currentQuestion as ECQuestion).text}</p>
          <QuestionRenderer
            question={currentQuestion}
            answer={getAnswer(currentQuestion.id)}
            onAnswer={handleAnswer}
            onMultipleAnswer={handleMultipleAnswer}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={navigation.goToPrevious}
            disabled={isFirstQuestion}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          {isLastQuestion ? (
            <Button onClick={() => setShowConfirmSubmit(true)}>
              <Send className="h-4 w-4 mr-1" />
              Finalizar
            </Button>
          ) : (
            <Button onClick={navigation.goToNext}>
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </CardFooter>
      </Card>

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
