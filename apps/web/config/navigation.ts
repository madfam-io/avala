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
  titleKey: string; // i18n key for title
  descriptionKey?: string; // i18n key for description
  href: string;
  icon: LucideIcon;
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
    titleKey: "nav.dashboard",
    descriptionKey: "nav.dashboardDesc",
    href: "/dashboard",
    icon: Home,
    roles: ALL_ROLES,
  },

  // Admin Section
  {
    titleKey: "nav.users",
    descriptionKey: "nav.usersDesc",
    href: "/dashboard/users",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    titleKey: "nav.tenants",
    descriptionKey: "nav.tenantsDesc",
    href: "/dashboard/tenants",
    icon: Building2,
    roles: ["ADMIN"],
  },

  // Compliance Section
  {
    titleKey: "nav.compliance",
    descriptionKey: "nav.complianceDesc",
    href: "/dashboard/compliance",
    icon: FileCheck,
    roles: ["ADMIN", "COMPLIANCE_OFFICER"],
  },

  // Instructor Section
  {
    titleKey: "nav.myCourses",
    descriptionKey: "nav.myCoursesDesc",
    href: "/dashboard/courses",
    icon: BookOpen,
    roles: ["ADMIN", "INSTRUCTOR", "SUPERVISOR"],
  },
  {
    titleKey: "nav.assessments",
    descriptionKey: "nav.assessmentsDesc",
    href: "/dashboard/assessments",
    icon: ClipboardCheck,
    roles: ["ADMIN", "INSTRUCTOR", "ASSESSOR"],
  },
  {
    titleKey: "nav.traineeProgress",
    descriptionKey: "nav.traineeProgressDesc",
    href: "/dashboard/progress",
    icon: TrendingUp,
    roles: ["ADMIN", "INSTRUCTOR", "SUPERVISOR"],
  },

  // Trainee Section
  {
    titleKey: "nav.myLearning",
    descriptionKey: "nav.myLearningDesc",
    href: "/dashboard/learning",
    icon: GraduationCap,
    roles: ["TRAINEE"],
  },
  {
    titleKey: "nav.myBadges",
    descriptionKey: "nav.myBadgesDesc",
    href: "/dashboard/badges",
    icon: Award,
    roles: ["TRAINEE"],
  },
  {
    titleKey: "nav.myCertificates",
    descriptionKey: "nav.myCertificatesDesc",
    href: "/dashboard/certificates",
    icon: FileBadge,
    roles: ["TRAINEE"],
  },

  // Settings - All Users
  {
    titleKey: "nav.settings",
    descriptionKey: "nav.settingsDesc",
    href: "/dashboard/settings",
    icon: Settings,
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
