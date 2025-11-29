// Server-safe demo role configuration (no React components)

export type DemoRole = "hr" | "instructor" | "trainee" | "executive";

export interface RoleConfigBase {
  id: DemoRole;
  label: string;
  description: string;
  color: string;
}

export const DEMO_ROLE_IDS: DemoRole[] = ["hr", "instructor", "trainee", "executive"];

export const DEMO_ROLES_BASE: RoleConfigBase[] = [
  {
    id: "hr",
    label: "Gerente de Capacitación",
    description: "Gestiona equipo, cumplimiento y DC-3",
    color: "bg-blue-500",
  },
  {
    id: "instructor",
    label: "Instructor",
    description: "Crea cursos y evalúa aprendices",
    color: "bg-green-500",
  },
  {
    id: "trainee",
    label: "Colaborador",
    description: "Aprende, certifícate y crece",
    color: "bg-purple-500",
  },
  {
    id: "executive",
    label: "Directivo",
    description: "Analiza ROI y cumplimiento",
    color: "bg-amber-500",
  },
];

export function getRoleConfigBase(role: DemoRole): RoleConfigBase | undefined {
  return DEMO_ROLES_BASE.find((r) => r.id === role);
}
