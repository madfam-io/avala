import {
  Home,
  Users,
  Building2,
  FileCheck,
  Settings,
  BookOpen,
  ClipboardCheck,
  TrendingUp,
  GraduationCap,
  Award,
  FileBadge,
  type LucideIcon,
} from "lucide-react";
import { Role } from "@avala/db";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  roles: Role[]; // Which roles can see this item
}

/**
 * Navigation Configuration
 * Maps user roles to available navigation items
 *
 * Role hierarchy:
 * - ALL: Items visible to all authenticated users
 * - ADMIN: Full system access
 * - COMPLIANCE_OFFICER: DC-3, SIRCE, LFT compliance
 * - INSTRUCTOR: Course management, assessments
 * - ASSESSOR: Evaluation tools
 * - TRAINEE: Learning paths, credentials
 */

const ALL_ROLES: Role[] = [
  "ADMIN",
  "COMPLIANCE_OFFICER",
  "ECE_OC_ADMIN",
  "ASSESSOR",
  "INSTRUCTOR",
  "SUPERVISOR",
  "TRAINEE",
];

export const navigation: NavItem[] = [
  // Universal - All Users
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    description: "Overview and quick actions",
    roles: ALL_ROLES,
  },

  // Admin Section
  {
    title: "Users",
    href: "/dashboard/users",
    icon: Users,
    description: "Manage users and roles",
    roles: ["ADMIN"],
  },
  {
    title: "Tenants",
    href: "/dashboard/tenants",
    icon: Building2,
    description: "Tenant management",
    roles: ["ADMIN"],
  },

  // Compliance Section
  {
    title: "Compliance",
    href: "/dashboard/compliance",
    icon: FileCheck,
    description: "DC-3, SIRCE, LFT plans",
    roles: ["ADMIN", "COMPLIANCE_OFFICER"],
  },

  // Instructor Section
  {
    title: "My Courses",
    href: "/dashboard/courses",
    icon: BookOpen,
    description: "Manage your courses",
    roles: ["ADMIN", "INSTRUCTOR", "SUPERVISOR"],
  },
  {
    title: "Assessments",
    href: "/dashboard/assessments",
    icon: ClipboardCheck,
    description: "Create and grade assessments",
    roles: ["ADMIN", "INSTRUCTOR", "ASSESSOR"],
  },
  {
    title: "Trainee Progress",
    href: "/dashboard/progress",
    icon: TrendingUp,
    description: "Monitor trainee advancement",
    roles: ["ADMIN", "INSTRUCTOR", "SUPERVISOR"],
  },

  // Trainee Section
  {
    title: "My Learning Path",
    href: "/dashboard/learning",
    icon: GraduationCap,
    description: "Your courses and progress",
    roles: ["TRAINEE"],
  },
  {
    title: "My Badges",
    href: "/dashboard/badges",
    icon: Award,
    description: "Earned credentials",
    roles: ["TRAINEE"],
  },
  {
    title: "My Certificates",
    href: "/dashboard/certificates",
    icon: FileBadge,
    description: "DC-3 and certifications",
    roles: ["TRAINEE"],
  },

  // Settings - All Users
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    description: "Account preferences",
    roles: ALL_ROLES,
  },
];

/**
 * Get navigation items for a specific role
 */
export function getNavigationForRole(role: Role): NavItem[] {
  return navigation.filter((item) => item.roles.includes(role));
}

/**
 * Check if a user role has access to a specific route
 */
export function hasAccessToRoute(role: Role, pathname: string): boolean {
  // Dashboard root is accessible to all
  if (pathname === "/dashboard") {
    return true;
  }

  const item = navigation.find((nav) => pathname.startsWith(nav.href));
  return item ? item.roles.includes(role) : false;
}
