import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CenterCard } from "./center-card";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("CenterCard", () => {
  const mockCenter = {
    id: "1",
    nombre: "Test Center",
    activo: true,
    municipio: "Mexico City",
    estado: "CDMX",
    direccion: "123 Test Street",
  };

  it("renders center name", () => {
    render(<CenterCard center={mockCenter} />);
    expect(screen.getByText("Test Center")).toBeInTheDocument();
  });

  it("displays active status", () => {
    render(<CenterCard center={mockCenter} />);
    expect(screen.getByText("Activo")).toBeInTheDocument();
  });

  it("displays inactive status", () => {
    const inactiveCenter = { ...mockCenter, activo: false };
    render(<CenterCard center={inactiveCenter} />);
    expect(screen.getByText("Inactivo")).toBeInTheDocument();
  });

  it("displays location", () => {
    render(<CenterCard center={mockCenter} />);
    expect(screen.getByText(/Mexico City/)).toBeInTheDocument();
    expect(screen.getByText(/CDMX/)).toBeInTheDocument();
  });

  it("displays address", () => {
    render(<CenterCard center={mockCenter} />);
    expect(screen.getByText("123 Test Street")).toBeInTheDocument();
  });

  it("shows distance when available and showDistance is true", () => {
    const centerWithDistance = { ...mockCenter, distance: 5.2 };
    render(<CenterCard center={centerWithDistance} showDistance={true} />);
    expect(screen.getByText(/5.2 km/)).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <CenterCard center={mockCenter} className="custom-card" />,
    );
    const link = container.querySelector("a");
    expect(link).toHaveClass("custom-card");
  });

  it("renders icon", () => {
    const { container } = render(<CenterCard center={mockCenter} />);
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });
});
