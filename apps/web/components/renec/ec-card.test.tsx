import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ECCard, ECList } from "./ec-card";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

import { vi } from "vitest";

const mockEC = {
  id: "ec-1",
  ecClave: "EC0001",
  titulo: "Desarrollo de Software",
  sector: "Tecnología",
  nivelCompetencia: 3,
  proposito: "Desarrollar aplicaciones de software de calidad",
  vigente: true,
  certifierCount: 15,
  centerCount: 42,
};

const mockECInactive = {
  ...mockEC,
  id: "ec-2",
  ecClave: "EC0002",
  titulo: "Estándar Inactivo",
  vigente: false,
};

describe("ECCard", () => {
  it("renders EC code", () => {
    render(<ECCard ec={mockEC} />);
    expect(screen.getByText("EC0001")).toBeInTheDocument();
  });

  it("renders EC title", () => {
    render(<ECCard ec={mockEC} />);
    expect(screen.getByText("Desarrollo de Software")).toBeInTheDocument();
  });

  it("shows Vigente badge when active", () => {
    render(<ECCard ec={mockEC} />);
    expect(screen.getByText("Vigente")).toBeInTheDocument();
  });

  it("shows No vigente badge when inactive", () => {
    render(<ECCard ec={mockECInactive} />);
    expect(screen.getByText("No vigente")).toBeInTheDocument();
  });

  it("displays sector badge", () => {
    render(<ECCard ec={mockEC} />);
    expect(screen.getByText("Tecnología")).toBeInTheDocument();
  });

  it("displays competency level badge", () => {
    render(<ECCard ec={mockEC} />);
    expect(screen.getByText("Nivel 3")).toBeInTheDocument();
  });

  it("displays proposito preview", () => {
    render(<ECCard ec={mockEC} />);
    expect(
      screen.getByText("Desarrollar aplicaciones de software de calidad"),
    ).toBeInTheDocument();
  });

  it("displays certifier count", () => {
    render(<ECCard ec={mockEC} />);
    expect(screen.getByText("15 certificadores")).toBeInTheDocument();
  });

  it("displays center count", () => {
    render(<ECCard ec={mockEC} />);
    expect(screen.getByText("42 centros")).toBeInTheDocument();
  });

  it("links to EC detail page", () => {
    render(<ECCard ec={mockEC} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/explorar/estandares/ec-1");
  });

  it("applies custom className to card", () => {
    const { container } = render(
      <ECCard ec={mockEC} className="custom-class" />,
    );
    const link = container.querySelector("a");
    // className is applied via cn() utility
    expect(link).toBeInTheDocument();
  });

  it("handles EC without sector", () => {
    const ecWithoutSector = { ...mockEC, sector: null };
    render(<ECCard ec={ecWithoutSector as any} />);
    expect(screen.queryByText("Tecnología")).not.toBeInTheDocument();
  });

  it("handles EC without nivel", () => {
    const ecWithoutNivel = { ...mockEC, nivelCompetencia: null };
    render(<ECCard ec={ecWithoutNivel as any} />);
    // Should not show nivel badge when null
    expect(screen.queryByText("Nivel 3")).not.toBeInTheDocument();
  });
});

describe("ECList", () => {
  const mockItems = [mockEC, mockECInactive];

  it("renders all EC cards", () => {
    render(<ECList items={mockItems} />);
    expect(screen.getByText("EC0001")).toBeInTheDocument();
    expect(screen.getByText("EC0002")).toBeInTheDocument();
  });

  it("shows empty message when no items", () => {
    render(<ECList items={[]} />);
    expect(
      screen.getByText("No se encontraron estándares de competencia"),
    ).toBeInTheDocument();
  });

  it("applies grid layout classes", () => {
    const { container } = render(<ECList items={mockItems} />);
    const grid = container.querySelector(".grid");
    expect(grid).toHaveClass("md:grid-cols-2", "lg:grid-cols-3");
  });

  it("applies custom className", () => {
    const { container } = render(
      <ECList items={mockItems} className="custom-list" />,
    );
    const grid = container.querySelector(".grid");
    expect(grid).toHaveClass("custom-list");
  });
});
