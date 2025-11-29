"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { DEMO_ROLES, DemoRole } from "./_components";
import { DEMO_TENANT, DEMO_ANALYTICS } from "./_data/demo-seed";

const ROLE_DETAILS: Record<
  DemoRole,
  {
    highlights: string[];
    features: string[];
  }
> = {
  hr: {
    highlights: [
      `${DEMO_ANALYTICS.overview.dc3Generated} DC-3 generados`,
      `${DEMO_ANALYTICS.overview.complianceRate}% cumplimiento`,
    ],
    features: [
      "Dashboard de cumplimiento STPS",
      "Generación automática de DC-3",
      "Gestión de planes LFT",
      "Exportación SIRCE",
    ],
  },
  instructor: {
    highlights: ["4 cursos activos", "3 evaluaciones pendientes"],
    features: [
      "Creación de cursos EC-alineados",
      "Evaluación con rúbricas",
      "Seguimiento de alumnos",
      "Biblioteca de recursos",
    ],
  },
  trainee: {
    highlights: ["2 cursos en progreso", "3 credenciales obtenidas"],
    features: [
      "Aprendizaje interactivo",
      "Simulaciones prácticas",
      "Portafolio de evidencias",
      "Badges verificables",
    ],
  },
  executive: {
    highlights: [
      `$${(DEMO_ANALYTICS.lftPlanProgress.spentBudget / 1000).toFixed(0)}K invertidos`,
      `${DEMO_ANALYTICS.overview.trainedThisYear} capacitados`,
    ],
    features: [
      "ROI de capacitación",
      "Reportes ejecutivos",
      "Análisis de brechas",
      "Cumplimiento normativo",
    ],
  },
};

export default function DemoRoleSelector() {
  const router = useRouter();

  const handleRoleSelect = (role: DemoRole) => {
    router.push(`/demo/${role}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-background to-background dark:from-blue-950/20">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" />
            <span className="font-bold text-xl">Avala</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/precios">Ver precios</Link>
            </Button>
            <Button asChild>
              <Link href="/registro">
                Iniciar prueba gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-12 md:py-16">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            Demo Interactivo
          </Badge>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Explora Avala desde tu perspectiva
          </h1>
          <p className="text-lg text-muted-foreground">
            Selecciona tu rol para ver cómo Avala resuelve los retos de
            capacitación y cumplimiento para cada persona en tu organización.
          </p>
        </div>

        {/* Demo Tenant Context */}
        <Card className="max-w-2xl mx-auto mb-12 bg-gradient-to-r from-primary/5 to-blue-500/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{DEMO_TENANT.logo}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Empresa demo
                  </span>
                </div>
                <h2 className="text-xl font-semibold">{DEMO_TENANT.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {DEMO_TENANT.industry} • {DEMO_TENANT.employeeCount} empleados
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {DEMO_ANALYTICS.overview.completionRate}%
                </div>
                <div className="text-xs text-muted-foreground">
                  Tasa de completación
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {DEMO_ROLES.map((role) => {
            const details = ROLE_DETAILS[role.id];
            return (
              <Card
                key={role.id}
                className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group"
                onClick={() => handleRoleSelect(role.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-xl ${role.color} text-white`}>
                      {role.icon}
                    </div>
                    <div className="flex gap-2">
                      {details.highlights.map((h, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {h}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <CardTitle className="text-xl mt-4">{role.label}</CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {details.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full group-hover:bg-primary">
                    Explorar como {role.label}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            ¿Prefieres una demostración personalizada?
          </p>
          <Button variant="outline" size="lg" asChild>
            <Link href="/contacto">Agendar llamada con ventas</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
