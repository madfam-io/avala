"use client";

import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getNavigationForRole, type NavItem } from "@/config/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Dashboard Home Page
 * Shows role-specific quick actions and overview
 */
export default function DashboardPage() {
  const { user, tenant } = useAuth();
  const t = useTranslations();

  if (!user || !tenant) {
    return null;
  }

  const navigation = getNavigationForRole(user.role);
  const quickActions = navigation
    .filter(
      (item) =>
        item.href !== "/dashboard" && item.href !== "/dashboard/settings",
    )
    .slice(0, 6);

  // Get role key for translation
  const roleKey = user.role
    .toLowerCase()
    .replace("_", "") as keyof typeof roleKeyMap;
  const roleKeyMap = {
    admin: "admin",
    complianceofficer: "manager",
    instructor: "instructor",
    assessor: "assessor",
    trainee: "trainee",
    supervisor: "manager",
    eceocadmin: "admin",
  } as const;
  const translatedRoleKey = roleKeyMap[roleKey] || "trainee";

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {user.firstName
            ? t("dashboard.welcomeUser", { name: user.firstName })
            : `${t("dashboard.welcome")}!`}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t(`roleMessages.${translatedRoleKey}`)}
        </p>
      </div>

      {/* Stats Cards - Role Dependent */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {t("dashboard.organization")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenant.name}</div>
            <p className="text-xs text-muted-foreground mt-1">{tenant.slug}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {t("dashboard.yourRole")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {t(`roles.${translatedRoleKey}`)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("dashboard.accessLevel")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {t("dashboard.availableFeatures")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{navigation.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("dashboard.menuItems")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">
          {t("dashboard.quickActions")}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((item) => (
            <QuickActionCard key={item.href} item={item} t={t} />
          ))}
        </div>
      </div>

      {/* Role-Specific Content */}
      <RoleSpecificContent role={user.role} t={t} />
    </div>
  );
}

/**
 * Quick Action Card Component
 */
function QuickActionCard({
  item,
  t,
}: {
  item: NavItem;
  t: ReturnType<typeof useTranslations>;
}) {
  const Icon = item.icon;
  const title = t(item.titleKey);
  const description = item.descriptionKey ? t(item.descriptionKey) : undefined;

  return (
    <Link href={item.href}>
      <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              {title}
            </div>
            <ArrowRight className="h-4 w-4 opacity-50" />
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      </Card>
    </Link>
  );
}

/**
 * Role-Specific Dashboard Content
 */
function RoleSpecificContent({
  role,
  t,
}: {
  role: string;
  t: ReturnType<typeof useTranslations>;
}) {
  if (role === "ADMIN") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.overview")}</CardTitle>
          <CardDescription>{t("common.info")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Phase 1-B: Dashboard widgets and analytics coming in next phase.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (role === "TRAINEE") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("training.myTraining")}</CardTitle>
          <CardDescription>{t("training.progress")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Phase 1-B: Course progress tracking coming in next phase.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (role === "INSTRUCTOR") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("navigation.courses")}</CardTitle>
          <CardDescription>{t("dashboard.recentActivity")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Phase 1-B: Course management interface coming in next phase.
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
}
