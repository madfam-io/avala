"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  GraduationCap,
  BookOpen,
  BarChart3,
  ChevronDown,
  Eye,
} from "lucide-react";
import { DemoRole } from "../_data/demo-roles";

// Re-export for convenience
export type { DemoRole } from "../_data/demo-roles";

interface RoleConfig {
  id: DemoRole;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export const DEMO_ROLES: RoleConfig[] = [
  {
    id: "hr",
    label: "Gerente de Capacitación",
    description: "Gestiona equipo, cumplimiento y DC-3",
    icon: <Users className="h-4 w-4" />,
    color: "bg-blue-500",
  },
  {
    id: "instructor",
    label: "Instructor",
    description: "Crea cursos y evalúa aprendices",
    icon: <BookOpen className="h-4 w-4" />,
    color: "bg-green-500",
  },
  {
    id: "trainee",
    label: "Colaborador",
    description: "Aprende y obtiene certificaciones",
    icon: <GraduationCap className="h-4 w-4" />,
    color: "bg-amber-500",
  },
  {
    id: "executive",
    label: "Directivo",
    description: "Analíticas y reportes STPS",
    icon: <BarChart3 className="h-4 w-4" />,
    color: "bg-purple-500",
  },
];

export function getRoleConfig(role: DemoRole): RoleConfig {
  return DEMO_ROLES.find((r) => r.id === role) || DEMO_ROLES[0];
}

interface RoleSwitcherProps {
  currentRole: DemoRole;
  compact?: boolean;
}

export function RoleSwitcher({
  currentRole,
  compact = false,
}: RoleSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const current = getRoleConfig(currentRole);

  const handleRoleChange = (role: DemoRole) => {
    // Navigate to the same sub-path but different role
    const pathParts = pathname.split("/");
    pathParts[2] = role; // /demo/[role]/...
    router.push(pathParts.join("/"));
  };

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Vista:</span>
            <Badge
              variant="secondary"
              className={`${current.color} text-white`}
            >
              {current.icon}
              <span className="ml-1">{current.label}</span>
            </Badge>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Cambiar perspectiva</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {DEMO_ROLES.map((role) => (
            <DropdownMenuItem
              key={role.id}
              onClick={() => handleRoleChange(role.id)}
              className={currentRole === role.id ? "bg-muted" : ""}
            >
              <div className={`p-1.5 rounded ${role.color} text-white mr-3`}>
                {role.icon}
              </div>
              <div className="flex-1">
                <div className="font-medium">{role.label}</div>
                <div className="text-xs text-muted-foreground">
                  {role.description}
                </div>
              </div>
              {currentRole === role.id && (
                <Badge variant="outline" className="ml-2">
                  Actual
                </Badge>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {DEMO_ROLES.map((role) => (
        <Button
          key={role.id}
          variant={currentRole === role.id ? "default" : "outline"}
          size="sm"
          onClick={() => handleRoleChange(role.id)}
          className="gap-2"
        >
          <div
            className={`p-1 rounded ${currentRole === role.id ? "bg-white/20" : role.color} ${currentRole === role.id ? "" : "text-white"}`}
          >
            {role.icon}
          </div>
          <span className="hidden md:inline">{role.label}</span>
        </Button>
      ))}
    </div>
  );
}
