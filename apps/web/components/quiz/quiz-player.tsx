"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowLeft, ArrowRight, Send } from "lucide-react";
import {
  useQuizTimer,
  useQuizAnswers,
  useQuizNavigation,
  QuestionRenderer,
  QuizProgress,
  QuizNavigator,
  type QuestionAnswer,
  type QuizData,
  getQuestionText,
} from "./shared";

export type {
  QuestionType,
  Question,
  QuizData,
  QuestionAnswer,
} from "./shared/types";

interface QuizPlayerProps {
  quiz: QuizData;
  attemptId?: string;
  onSubmit: (answers: QuestionAnswer[], totalTime: number) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

/**
 * QuizPlayer Component (Refactored)
 * Interactive quiz taking experience with timer
 * Uses shared hooks and components for reduced complexity
 */
export function QuizPlayer({
  quiz,
  attemptId: _attemptId,
  onSubmit,
  onCancel,
  isSubmitting,
}: QuizPlayerProps) {
  // Initialize hooks
  const {
    answers,
    answeredCount,
    setAnswer,
    setMatchingAnswer,
    getAnswer,
    getAnswersArray,
    getTotalTimeSpent,
    recordQuestionTime,
    resetQuestionTimer,
  } = useQuizAnswers({ trackTime: true });

  const handleNavigate = () => {
    recordQuestionTime();
    resetQuestionTimer();
  };

  const navigation = useQuizNavigation({
    questions: quiz.questions,
    onNavigate: handleNavigate,
  });

  const handleTimeUp = () => {
    handleSubmit();
  };

  const timer = useQuizTimer({
    initialTime: quiz.timeLimit ? quiz.timeLimit * 60 : null,
    onTimeUp: handleTimeUp,
  });

  const {
    currentQuestion,
    currentIndex,
    totalQuestions,
    progress,
    isFirstQuestion,
    isLastQuestion,
  } = navigation;

  const handleSubmit = () => {
    const finalTime = getTotalTimeSpent();
    const answerArray = getAnswersArray();
    onSubmit(answerArray, finalTime);
  };

  const handleAnswer = (answer: string | string[] | Record<string, string>) => {
    if (currentQuestion) {
      setAnswer(currentQuestion.id, answer);
    }
  };

  const handleMatchingAnswer = (leftItem: string, rightItem: string) => {
    if (currentQuestion) {
      setMatchingAnswer(currentQuestion.id, leftItem, rightItem);
    }
  };

  const isAnswered = (questionId: string) => !!answers[questionId];

  if (!currentQuestion) {
    return <div>No questions available</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header with timer and progress */}
      <Card>
        <CardContent className="pt-6">
          <QuizProgress
            title={quiz.title}
            currentIndex={currentIndex}
            totalQuestions={totalQuestions}
            answeredCount={answeredCount}
            progress={progress}
            timeRemaining={timer.timeRemaining}
            isLowTime={timer.isLowTime}
            formatTime={timer.formatTime}
          />

          {/* Question navigation dots */}
          <div className="mt-4">
            <QuizNavigator
              questions={quiz.questions}
              currentIndex={currentIndex}
              getQuestionStatus={(idx) =>
                navigation.getQuestionStatus(idx, isAnswered)
              }
              onNavigate={navigation.goToQuestion}
              showLegend={false}
            />
          </div>
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">
              {getQuestionText(currentQuestion)}
            </CardTitle>
            <Badge variant="outline">{currentQuestion.points} pts</Badge>
          </div>
        </CardHeader>

        <CardContent>
          <QuestionRenderer
            question={currentQuestion}
            answer={getAnswer(currentQuestion.id)}
            onAnswer={handleAnswer}
            onMatchingAnswer={handleMatchingAnswer}
          />
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-4">
          <Button
            variant="outline"
            onClick={navigation.goToPrevious}
            disabled={isFirstQuestion}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>

            {isLastQuestion ? (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Quiz
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={navigation.goToNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Warning if not all questions answered */}
      {answeredCount < totalQuestions && (
        <div className="flex items-center gap-2 text-amber-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>
            You have {totalQuestions - answeredCount} unanswered questions
          </span>
        </div>
      )}
    </div>
  );
}
