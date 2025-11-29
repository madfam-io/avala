import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuizResults } from "./quiz-results";

describe("QuizResults", () => {
  const mockPassedResult = {
    attemptId: "1",
    quizId: "quiz-1",
    score: 80,
    totalPoints: 100,
    percentage: 80,
    passed: true,
    gradedQuestions: [
      { questionId: "1", correct: true, pointsEarned: 20, pointsPossible: 20 },
      { questionId: "2", correct: true, pointsEarned: 20, pointsPossible: 20 },
      { questionId: "3", correct: true, pointsEarned: 20, pointsPossible: 20 },
      { questionId: "4", correct: true, pointsEarned: 20, pointsPossible: 20 },
      { questionId: "5", correct: false, pointsEarned: 0, pointsPossible: 20 },
    ],
    completedAt: new Date(),
  };

  const mockFailedResult = {
    ...mockPassedResult,
    score: 40,
    percentage: 40,
    passed: false,
  };

  it("renders passed result with percentage", () => {
    const onGoHome = vi.fn();
    render(
      <QuizResults
        result={mockPassedResult}
        quizTitle="Test Quiz"
        passingScore={70}
        onGoHome={onGoHome}
      />,
    );

    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("Congratulations!")).toBeInTheDocument();
  });

  it("renders failed result with percentage", () => {
    const onGoHome = vi.fn();
    render(
      <QuizResults
        result={mockFailedResult}
        quizTitle="Test Quiz"
        passingScore={70}
        onGoHome={onGoHome}
      />,
    );

    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("Keep Trying!")).toBeInTheDocument();
  });

  it("displays correct count", () => {
    const onGoHome = vi.fn();
    render(
      <QuizResults
        result={mockPassedResult}
        quizTitle="Test Quiz"
        passingScore={70}
        onGoHome={onGoHome}
      />,
    );

    // 4 correct out of 5
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Correct")).toBeInTheDocument();
  });

  it("shows retry button when canRetry is true and failed", () => {
    const onGoHome = vi.fn();
    const onRetry = vi.fn();

    render(
      <QuizResults
        result={mockFailedResult}
        quizTitle="Test Quiz"
        passingScore={70}
        onGoHome={onGoHome}
        onRetry={onRetry}
        canRetry={true}
      />,
    );

    expect(screen.getByText("Try Again")).toBeInTheDocument();
  });

  it("calls onRetry when retry button clicked", async () => {
    const user = userEvent.setup();
    const onGoHome = vi.fn();
    const onRetry = vi.fn();

    render(
      <QuizResults
        result={mockFailedResult}
        quizTitle="Test Quiz"
        passingScore={70}
        onGoHome={onGoHome}
        onRetry={onRetry}
        canRetry={true}
      />,
    );

    const retryButton = screen.getByText("Try Again");
    await user.click(retryButton);

    expect(onRetry).toHaveBeenCalled();
  });

  it("calls onGoHome when home button clicked", async () => {
    const user = userEvent.setup();
    const onGoHome = vi.fn();

    render(
      <QuizResults
        result={mockPassedResult}
        quizTitle="Test Quiz"
        passingScore={70}
        onGoHome={onGoHome}
      />,
    );

    const homeButton = screen.getByText("Back to Quizzes");
    await user.click(homeButton);

    expect(onGoHome).toHaveBeenCalled();
  });

  it("displays question breakdown", () => {
    const onGoHome = vi.fn();
    render(
      <QuizResults
        result={mockPassedResult}
        quizTitle="Test Quiz"
        passingScore={70}
        onGoHome={onGoHome}
      />,
    );

    expect(screen.getByText("Question Breakdown")).toBeInTheDocument();
    expect(screen.getByText("Question 1")).toBeInTheDocument();
  });
});
