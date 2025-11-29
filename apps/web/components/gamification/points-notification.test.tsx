import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { PointsNotification } from "./points-notification";

describe("PointsNotification", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with points", () => {
    render(<PointsNotification points={100} />);
    expect(screen.getByText("+100 puntos")).toBeInTheDocument();
  });

  it("renders with reason", () => {
    render(<PointsNotification points={50} reason="Quiz completed" />);
    expect(screen.getByText("+50 puntos")).toBeInTheDocument();
    expect(screen.getByText("Quiz completed")).toBeInTheDocument();
  });

  it("renders points type notification", () => {
    render(<PointsNotification points={25} type="points" />);
    expect(screen.getByText("+25 puntos")).toBeInTheDocument();
  });

  it("renders achievement type notification", () => {
    render(<PointsNotification points={100} type="achievement" />);
    expect(screen.getByText("+100 puntos")).toBeInTheDocument();
  });

  it("renders streak type notification", () => {
    render(<PointsNotification points={75} type="streak" />);
    expect(screen.getByText("+75 puntos")).toBeInTheDocument();
  });

  it("renders levelUp type notification", () => {
    render(<PointsNotification points={200} type="levelUp" />);
    expect(screen.getByText("+200 puntos")).toBeInTheDocument();
  });

  it("calls onComplete after timeout", async () => {
    const onComplete = vi.fn();

    render(<PointsNotification points={50} onComplete={onComplete} />);

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(onComplete).toHaveBeenCalled();
  });
});
