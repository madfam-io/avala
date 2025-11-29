"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ArrowRight,
  Zap,
  Shield,
  BarChart3,
  Award,
  X,
} from "lucide-react";
import { useState } from "react";
import { DemoRole } from "../_data/demo-roles";

interface ContextualCTAProps {
  role: DemoRole;
  className?: string;
}

const CTA_CONFIG: Record<
  DemoRole,
  {
    title: string;
    description: string;
    features: string[];
    icon: React.ReactNode;
    planBadge: string;
  }
> = {
  hr: {
    title: "Automatiza tu cumplimiento STPS",
    description:
      "Genera DC-3, exporta SIRCE y gestiona planes LFT desde un solo lugar.",
    features: [
      "DC-3 automáticos al completar cursos",
      "Exportación SIRCE con un clic",
      "Dashboard de cumplimiento en tiempo real",
    ],
    icon: <Shield className="h-5 w-5" />,
    planBadge: "Plan Profesional",
  },
  instructor: {
    title: "Herramientas de instructor avanzadas",
    description:
      "Crea cursos alineados a EC, evalúa con rúbricas y da retroalimentación efectiva.",
    features: [
      "Biblioteca de plantillas EC",
      "Evaluación asistida por IA",
      "Reportes de desempeño por alumno",
    ],
    icon: <Zap className="h-5 w-5" />,
    planBadge: "Plan Equipo",
  },
  trainee: {
    title: "Tu portafolio de competencias",
    description:
      "Obtén credenciales verificables y comparte tus logros con empleadores.",
    features: [
      "Badges Open Badge 3.0",
      "Compartir en LinkedIn",
      "Verificación pública de certificados",
    ],
    icon: <Award className="h-5 w-5" />,
    planBadge: "Incluido",
  },
  executive: {
    title: "Inteligencia de capacitación",
    description:
      "ROI de capacitación, predicciones de cumplimiento y reportes ejecutivos.",
    features: [
      "Dashboard ejecutivo personalizado",
      "Reportes SIRCE automatizados",
      "Análisis predictivo de brechas",
    ],
    icon: <BarChart3 className="h-5 w-5" />,
    planBadge: "Plan Enterprise",
  },
};

export function ContextualCTA({ role, className }: ContextualCTAProps) {
  const [dismissed, setDismissed] = useState(false);
  const config = CTA_CONFIG[role];

  if (dismissed) return null;

  return (
    <Card
      className={`bg-gradient-to-r from-primary/5 to-blue-500/5 border-primary/20 ${className}`}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {config.icon}
              </div>
              <div>
                <Badge variant="secondary" className="mb-1">
                  {config.planBadge}
                </Badge>
                <h3 className="font-semibold">{config.title}</h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {config.description}
            </p>
            <ul className="text-sm space-y-1">
              {config.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button size="sm" asChild>
                <Link href="/registro">
                  Comenzar prueba gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/precios">Ver planes</Link>
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Inline CTA for embedding in demo features
interface InlineCTAProps {
  feature: string;
  plan?: string;
}

export function InlineCTA({ feature, plan = "Pro" }: InlineCTAProps) {
  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-dashed">
      <Sparkles className="h-4 w-4 text-primary shrink-0" />
      <span className="text-sm text-muted-foreground flex-1">
        {feature} disponible en el plan <strong>{plan}</strong>
      </span>
      <Button size="sm" variant="outline" asChild>
        <Link href="/registro">Probar</Link>
      </Button>
    </div>
  );
}
