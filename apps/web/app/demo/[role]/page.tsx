import { notFound } from "next/navigation";
import { DemoRole } from "../_data/demo-roles";
import { HRDashboard } from "./_dashboards/hr-dashboard";
import { InstructorDashboard } from "./_dashboards/instructor-dashboard";
import { TraineeDashboard } from "./_dashboards/trainee-dashboard";
import { ExecutiveDashboard } from "./_dashboards/executive-dashboard";

interface DemoRolePageProps {
  params: Promise<{ role: string }>;
}

export default async function DemoRolePage({ params }: DemoRolePageProps) {
  const { role: roleParam } = await params;
  const role = roleParam as DemoRole;

  switch (role) {
    case "hr":
      return <HRDashboard />;
    case "instructor":
      return <InstructorDashboard />;
    case "trainee":
      return <TraineeDashboard />;
    case "executive":
      return <ExecutiveDashboard />;
    default:
      notFound();
  }
}
