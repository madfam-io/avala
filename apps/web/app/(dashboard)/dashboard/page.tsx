'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getNavigationForRole } from '@/config/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * Dashboard Home Page
 * Shows role-specific quick actions and overview
 */
export default function DashboardPage() {
  const { user, tenant } = useAuth();

  if (!user || !tenant) {
    return null;
  }

  const navigation = getNavigationForRole(user.role);
  const quickActions = navigation.filter(
    (item) => item.href !== '/dashboard' && item.href !== '/dashboard/settings'
  ).slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back{user.firstName ? `, ${user.firstName}` : ''}!
        </h1>
        <p className="text-muted-foreground mt-2">
          {getRoleWelcomeMessage(user.role)}
        </p>
      </div>

      {/* Stats Cards - Role Dependent */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenant.name}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {tenant.slug}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Your Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {user.role.toLowerCase().replace('_', ' ')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Access level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Available Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{navigation.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Menu items accessible
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((item) => (
            <QuickActionCard key={item.href} item={item} />
          ))}
        </div>
      </div>

      {/* Role-Specific Content */}
      <RoleSpecificContent role={user.role} />
    </div>
  );
}

/**
 * Quick Action Card Component
 */
function QuickActionCard({ item }: { item: any }) {
  const Icon = item.icon;

  return (
    <Link href={item.href}>
      <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              {item.title}
            </div>
            <ArrowRight className="h-4 w-4 opacity-50" />
          </CardTitle>
          {item.description && (
            <CardDescription>{item.description}</CardDescription>
          )}
        </CardHeader>
      </Card>
    </Link>
  );
}

/**
 * Role-Specific Welcome Messages
 */
function getRoleWelcomeMessage(role: string): string {
  const messages: Record<string, string> = {
    ADMIN: "You have full access to manage users, compliance, and system settings.",
    COMPLIANCE_OFFICER: "Manage DC-3 records, SIRCE exports, and LFT plans from your dashboard.",
    INSTRUCTOR: "Create courses, assess trainees, and track their progress.",
    ASSESSOR: "Review evidence portfolios and grade assessments.",
    TRAINEE: "Continue your learning journey and track your certifications.",
    SUPERVISOR: "Monitor your team's training progress and compliance.",
    ECE_OC_ADMIN: "Manage certification processes and candidate evaluations.",
  };

  return messages[role] || "Welcome to your personalized dashboard.";
}

/**
 * Role-Specific Dashboard Content
 */
function RoleSpecificContent({ role }: { role: string }) {
  if (role === 'ADMIN') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <CardDescription>
            Quick insights into platform usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Phase 1-B: Dashboard widgets and analytics coming in next phase.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (role === 'TRAINEE') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Learning Progress</CardTitle>
          <CardDescription>Your current courses and achievements</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Phase 1-B: Course progress tracking coming in next phase.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (role === 'INSTRUCTOR') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Courses</CardTitle>
          <CardDescription>Active courses and recent activity</CardDescription>
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
