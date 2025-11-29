import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StreakCalendar } from "./streak-calendar";

describe("StreakCalendar", () => {
  const mockActivities = [
    { activityDate: new Date(), pointsEarned: 100 },
    { activityDate: new Date(Date.now() - 86400000), pointsEarned: 50 },
  ];

  it("renders correctly", () => {
    render(
      <StreakCalendar
        activities={mockActivities}
        currentStreak={5}
        longestStreak={10}
      />,
    );

    expect(screen.getByText("Actividad Diaria")).toBeInTheDocument();
  });

  it("displays current streak", () => {
    render(
      <StreakCalendar
        activities={mockActivities}
        currentStreak={7}
        longestStreak={10}
      />,
    );

    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("Racha actual")).toBeInTheDocument();
  });

  it("displays longest streak", () => {
    render(
      <StreakCalendar
        activities={mockActivities}
        currentStreak={5}
        longestStreak={15}
      />,
    );

    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("Mejor racha")).toBeInTheDocument();
  });

  it("renders calendar grid", () => {
    render(
      <StreakCalendar
        activities={mockActivities}
        currentStreak={5}
        longestStreak={10}
      />,
    );

    expect(screen.getByText("L")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
  });

  it("renders with empty activities", () => {
    render(
      <StreakCalendar activities={[]} currentStreak={0} longestStreak={0} />,
    );

    // Both current and longest streak show 0, so use getAllByText
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBe(2);
    expect(screen.getByText("Racha actual")).toBeInTheDocument();
    expect(screen.getByText("Mejor racha")).toBeInTheDocument();
  });
});
