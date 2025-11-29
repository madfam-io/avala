import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CertifierCard } from "./certifier-card";

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

describe("CertifierCard", () => {
  const mockCertifier = {
    id: "1",
    razonSocial: "Test Certifier Inc.",
    nombreComercial: "Test Certifier",
    tipo: "ECE" as const,
    activo: true,
    ecCount: 5,
    centerCount: 3,
  };

  it("renders certifier name", () => {
    render(<CertifierCard certifier={mockCertifier} />);
    expect(screen.getByText("Test Certifier Inc.")).toBeInTheDocument();
  });

  it("displays type badge", () => {
    render(<CertifierCard certifier={mockCertifier} />);
    expect(screen.getByText("ECE")).toBeInTheDocument();
  });

  it("displays active status", () => {
    render(<CertifierCard certifier={mockCertifier} />);
    expect(screen.getByText("Activo")).toBeInTheDocument();
  });

  it("displays inactive status", () => {
    const inactiveCertifier = { ...mockCertifier, activo: false };
    render(<CertifierCard certifier={inactiveCertifier} />);
    expect(screen.getByText("Inactivo")).toBeInTheDocument();
  });

  it("renders commercial name when different from legal name", () => {
    render(<CertifierCard certifier={mockCertifier} />);
    expect(screen.getByText("Test Certifier Inc.")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <CertifierCard certifier={mockCertifier} className="custom-card" />,
    );
    const link = container.querySelector("a");
    expect(link).toHaveClass("custom-card");
  });

  it("renders icon", () => {
    const { container } = render(<CertifierCard certifier={mockCertifier} />);
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("links to certifier detail page", () => {
    const { container } = render(<CertifierCard certifier={mockCertifier} />);
    const link = container.querySelector("a");
    expect(link).toHaveAttribute("href", "/explorar/certificadores/1");
  });
});
