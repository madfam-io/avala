"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Clock,
  Send,
} from "lucide-react";

export type QuestionType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "SHORT_ANSWER"
  | "ESSAY"
  | "MATCHING";

export interface Question {
  id: string;
  type: QuestionType;
  questionText: string;
  points: number;
  orderIndex: number;
  questionData: {
    options?: string[];
    leftItems?: string[];
    rightItems?: string[];
    maxLength?: number;
    minWords?: number;
    maxWords?: number;
  };
}

export interface QuizData {
  id: string;
  title: string;
  description: string | null;
  timeLimit: number | null;
  passingScore: number;
  questions: Question[];
}

export interface QuestionAnswer {
  questionId: string;
  answer: string | string[] | Record<string, string>;
  timeSpent: number;
}

interface QuizPlayerProps {
  quiz: QuizData;
  attemptId: string;
  onSubmit: (answers: QuestionAnswer[], totalTime: number) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

/**
 * QuizPlayer Component
 * Interactive quiz taking experience with timer
 */
export function QuizPlayer({
  quiz,
  attemptId: _attemptId,
  onSubmit,
  onCancel,
  isSubmitting,
}: QuizPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    quiz.timeLimit ? quiz.timeLimit * 60 : null,
  );
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);

  const currentQuestion = quiz.questions[currentIndex];
  const progress = ((currentIndex + 1) / quiz.questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null) return undefined;

    const timer = setInterval(() => {
      setTimeRemaining((prev): number => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeRemaining === 0) {
      handleSubmit();
    }
  }, [timeRemaining]);

  // Track time spent on current question
  const recordQuestionTime = useCallback(() => {
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
    setTotalTimeSpent((prev) => prev + timeSpent);
    return timeSpent;
  }, [questionStartTime]);

  const setAnswer = (
    questionId: string,
    answer: string | string[] | Record<string, string>,
  ) => {
    const timeSpent = recordQuestionTime();
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        questionId,
        answer,
        timeSpent: (prev[questionId]?.timeSpent || 0) + timeSpent,
      },
    }));
    setQuestionStartTime(Date.now());
  };

  const goToQuestion = (index: number) => {
    recordQuestionTime();
    setCurrentIndex(index);
    setQuestionStartTime(Date.now());
  };

  const handleSubmit = () => {
    const finalTime = totalTimeSpent + recordQuestionTime();
    const answerArray = Object.values(answers);
    onSubmit(answerArray, finalTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const renderQuestionInput = () => {
    const currentAnswer = answers[currentQuestion.id]?.answer;

    switch (currentQuestion.type) {
      case "MULTIPLE_CHOICE":
        return (
          <RadioGroup
            value={(currentAnswer as string) || ""}
            onValueChange={(value) => setAnswer(currentQuestion.id, value)}
            className="space-y-3"
          >
            {currentQuestion.questionData.options?.map((option, i) => (
              <div key={i} className="flex items-center space-x-3">
                <RadioGroupItem
                  value={option}
                  id={`option-${i}`}
                  className="peer"
                />
                <Label
                  htmlFor={`option-${i}`}
                  className="flex-1 p-3 rounded-md border cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "TRUE_FALSE":
        return (
          <RadioGroup
            value={(currentAnswer as string) || ""}
            onValueChange={(value) => setAnswer(currentQuestion.id, value)}
            className="space-y-3"
          >
            {["True", "False"].map((option) => (
              <div key={option} className="flex items-center space-x-3">
                <RadioGroupItem
                  value={option.toLowerCase()}
                  id={`tf-${option}`}
                  className="peer"
                />
                <Label
                  htmlFor={`tf-${option}`}
                  className="flex-1 p-3 rounded-md border cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "SHORT_ANSWER":
      case "ESSAY":
        return (
          <Textarea
            value={(currentAnswer as string) || ""}
            onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
            placeholder="Type your answer here..."
            className="min-h-[150px]"
            maxLength={currentQuestion.questionData.maxLength}
          />
        );

      case "MATCHING":
        const matchingAnswer = (currentAnswer as Record<string, string>) || {};
        return (
          <div className="space-y-4">
            {currentQuestion.questionData.leftItems?.map((leftItem, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="flex-1 p-3 bg-muted rounded-md">{leftItem}</div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <select
                  value={matchingAnswer[leftItem] || ""}
                  onChange={(e) =>
                    setAnswer(currentQuestion.id, {
                      ...matchingAnswer,
                      [leftItem]: e.target.value,
                    })
                  }
                  className="flex-1 p-3 border rounded-md bg-background"
                >
                  <option value="">Select match...</option>
                  {currentQuestion.questionData.rightItems?.map((right, j) => (
                    <option key={j} value={right}>
                      {right}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        );

      default:
        return <p>Unsupported question type</p>;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header with timer and progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{quiz.title}</h2>
            {timeRemaining !== null && (
              <Badge
                variant={timeRemaining < 60 ? "destructive" : "secondary"}
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
                Question {currentIndex + 1} of {quiz.questions.length}
              </span>
              <span>
                {answeredCount} of {quiz.questions.length} answered
              </span>
            </div>
            <Progress value={progress} />
          </div>

          {/* Question navigation dots */}
          <div className="flex flex-wrap gap-2 mt-4">
            {quiz.questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => goToQuestion(i)}
                className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                  i === currentIndex
                    ? "bg-primary text-primary-foreground"
                    : answers[q.id]
                      ? "bg-green-100 text-green-700 border border-green-300"
                      : "bg-muted hover:bg-muted/80"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">
              {currentQuestion.questionText}
            </CardTitle>
            <Badge variant="outline">{currentQuestion.points} pts</Badge>
          </div>
        </CardHeader>

        <CardContent>{renderQuestionInput()}</CardContent>

        <CardFooter className="flex justify-between border-t pt-4">
          <Button
            variant="outline"
            onClick={() => goToQuestion(currentIndex - 1)}
            disabled={currentIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>

            {currentIndex === quiz.questions.length - 1 ? (
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
              <Button onClick={() => goToQuestion(currentIndex + 1)}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Warning if not all questions answered */}
      {answeredCount < quiz.questions.length && (
        <div className="flex items-center gap-2 text-amber-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>
            You have {quiz.questions.length - answeredCount} unanswered
            questions
          </span>
        </div>
      )}
    </div>
  );
}
