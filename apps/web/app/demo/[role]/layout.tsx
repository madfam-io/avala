import { notFound } from "next/navigation";
import { DemoHeader } from "../_components";
import { GuidedTour } from "../_components/guided-tour";
import { DEMO_ROLE_IDS, DemoRole } from "../_data/demo-roles";

interface DemoRoleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ role: string }>;
}

export function generateStaticParams() {
  return DEMO_ROLE_IDS.map((role) => ({ role }));
}

export default async function DemoRoleLayout({
  children,
  params,
}: DemoRoleLayoutProps) {
  const { role: roleParam } = await params;

  if (!DEMO_ROLE_IDS.includes(roleParam as DemoRole)) {
    notFound();
  }

  const role = roleParam as DemoRole;

  return (
    <div className="min-h-screen bg-muted/30">
      <GuidedTour role={role} />
      <DemoHeader currentRole={role} />
      <main>{children}</main>
    </div>
  );
}
