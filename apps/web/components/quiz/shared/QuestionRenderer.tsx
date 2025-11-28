"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight } from "lucide-react";
import type {
  Question,
  AnswerValue,
  StandardQuestion,
  ECQuestion,
} from "./types";

interface QuestionRendererProps {
  question: Question;
  answer: AnswerValue | undefined;
  onAnswer: (answer: AnswerValue) => void;
  onMultipleAnswer?: (optionId: string, checked: boolean) => void;
  onMatchingAnswer?: (leftItem: string, rightItem: string) => void;
}

/**
 * Unified question renderer component
 * Handles all question types from both quiz systems
 */
export function QuestionRenderer({
  question,
  answer,
  onAnswer,
  onMultipleAnswer,
  onMatchingAnswer,
}: QuestionRendererProps) {
  // Determine if this is a standard or EC question
  const isStandard = "questionText" in question && "questionData" in question;

  if (isStandard) {
    return (
      <StandardQuestionRenderer
        question={question as StandardQuestion}
        answer={answer}
        onAnswer={onAnswer}
        onMatchingAnswer={onMatchingAnswer}
      />
    );
  }

  return (
    <ECQuestionRenderer
      question={question as ECQuestion}
      answer={answer}
      onAnswer={onAnswer}
      onMultipleAnswer={onMultipleAnswer}
    />
  );
}

interface StandardQuestionRendererProps {
  question: StandardQuestion;
  answer: AnswerValue | undefined;
  onAnswer: (answer: AnswerValue) => void;
  onMatchingAnswer?: (leftItem: string, rightItem: string) => void;
}

function StandardQuestionRenderer({
  question,
  answer,
  onAnswer,
  onMatchingAnswer,
}: StandardQuestionRendererProps) {
  switch (question.type) {
    case "MULTIPLE_CHOICE":
      return (
        <RadioGroup
          value={(answer as string) || ""}
          onValueChange={onAnswer}
          className="space-y-3"
        >
          {question.questionData.options?.map((option, i) => (
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
          value={(answer as string) || ""}
          onValueChange={onAnswer}
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
          value={(answer as string) || ""}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder="Type your answer here..."
          className="min-h-[150px]"
          maxLength={question.questionData.maxLength}
        />
      );

    case "MATCHING":
      const matchingAnswer = (answer as Record<string, string>) || {};
      return (
        <div className="space-y-4">
          {question.questionData.leftItems?.map((leftItem, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="flex-1 p-3 bg-muted rounded-md">{leftItem}</div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <select
                value={matchingAnswer[leftItem] || ""}
                onChange={(e) => onMatchingAnswer?.(leftItem, e.target.value)}
                className="flex-1 p-3 border rounded-md bg-background"
              >
                <option value="">Select match...</option>
                {question.questionData.rightItems?.map((right, j) => (
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
      return <p className="text-muted-foreground">Unsupported question type</p>;
  }
}

interface ECQuestionRendererProps {
  question: ECQuestion;
  answer: AnswerValue | undefined;
  onAnswer: (answer: AnswerValue) => void;
  onMultipleAnswer?: (optionId: string, checked: boolean) => void;
}

function ECQuestionRenderer({
  question,
  answer,
  onAnswer,
  onMultipleAnswer,
}: ECQuestionRendererProps) {
  switch (question.type) {
    case "single":
      return (
        <RadioGroup
          value={(answer as string) || ""}
          onValueChange={onAnswer}
          className="space-y-3"
        >
          {question.options?.map((option) => (
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
      const multiAnswer = (answer as string[]) || [];
      return (
        <div className="space-y-3">
          {question.options?.map((option) => {
            const isChecked = multiAnswer.includes(option.id);
            return (
              <div
                key={option.id}
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
              >
                <Checkbox
                  id={option.id}
                  checked={isChecked}
                  onCheckedChange={(checked) =>
                    onMultipleAnswer?.(option.id, checked as boolean)
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
          onChange={(e) => onAnswer(e.target.value)}
          placeholder="Escribe tu respuesta aquí..."
          rows={6}
        />
      );

    default:
      return (
        <p className="text-muted-foreground">Tipo de pregunta no soportado</p>
      );
  }
}
