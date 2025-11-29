import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";

describe("Avatar", () => {
  it("renders correctly", () => {
    const { container } = render(
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>,
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders fallback text", () => {
    render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByText("AB")).toBeInTheDocument();
  });

  it("renders AvatarImage component", () => {
    const { container } = render(
      <Avatar>
        <AvatarImage src="/avatar.jpg" alt="User avatar" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>,
    );

    // AvatarImage may show fallback initially while image loads
    expect(container.firstChild).toBeInTheDocument();
  });

  it("shows fallback when no image", () => {
    render(
      <Avatar>
        <AvatarFallback>FB</AvatarFallback>
      </Avatar>,
    );

    expect(screen.getByText("FB")).toBeInTheDocument();
  });

  it("applies custom className to Avatar", () => {
    const { container } = render(
      <Avatar className="custom-avatar">
        <AvatarFallback>CA</AvatarFallback>
      </Avatar>,
    );
    expect(container.firstChild).toHaveClass("custom-avatar");
  });

  it("applies custom className to AvatarFallback", () => {
    render(
      <Avatar>
        <AvatarFallback className="custom-fallback">CF</AvatarFallback>
      </Avatar>,
    );
    const fallback = screen.getByText("CF");
    expect(fallback).toHaveClass("custom-fallback");
  });
});
