import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "./sidebar";

// Mock dependencies
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      email: "test@example.com",
      role: "LEARNER",
    },
    logout: vi.fn(),
    isLoggingOut: false,
  }),
}));

// Mock icon component
const MockIcon = () => <svg data-testid="mock-icon" />;

vi.mock("@/config/navigation", () => ({
  getNavigationForRole: () => [
    { href: "/dashboard", titleKey: "nav.dashboard", icon: MockIcon },
    { href: "/courses", titleKey: "nav.courses", icon: MockIcon },
  ],
}));

vi.mock("./tenant-switcher", () => ({
  TenantSwitcher: () => <div>Tenant Switcher</div>,
}));

vi.mock("./language-switcher", () => ({
  LanguageSwitcher: () => <div>Language Switcher</div>,
}));

describe("Sidebar", () => {
  it("renders sidebar", () => {
    render(<Sidebar />);
    expect(screen.getByText("AVALA")).toBeInTheDocument();
  });

  it("displays user email", () => {
    render(<Sidebar />);
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("renders tenant switcher", () => {
    render(<Sidebar />);
    expect(screen.getByText("Tenant Switcher")).toBeInTheDocument();
  });

  it("renders language switcher", () => {
    render(<Sidebar />);
    expect(screen.getByText("Language Switcher")).toBeInTheDocument();
  });

  it("renders logout button", () => {
    render(<Sidebar />);
    expect(screen.getByText("auth.logout")).toBeInTheDocument();
  });
});
