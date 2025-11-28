"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  ClipboardCheck,
  FileCheck,
  Award,
  Plug,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const modules = [
  {
    id: "learn",
    name: "Avala Learn",
    icon: BookOpen,
    tagline: "Rutas de aprendizaje alineadas a EC",
    description:
      "Diseña rutas de formación mapeadas a Estándares de Competencia. Visualiza la cobertura por criterio en tiempo real y asegura que tus cursos cubren lo que CONOCER exige.",
    features: [
      "Mapeo automático a criterios de competencia",
      "Medidor de cobertura en tiempo real",
      "Tracking xAPI/cmi5 nativo",
      "PWA móvil con captura offline",
    ],
    color: "blue",
    href: "/producto/learn",
  },
  {
    id: "assess",
    name: "Avala Assess",
    icon: ClipboardCheck,
    tagline: "Evaluación multi-método por criterio",
    description:
      "Evalúa competencias con múltiples métodos: observación, entrevista, quiz, portafolio. Califica por criterio de desempeño y gestiona evidencias con trazabilidad completa.",
    features: [
      "Rúbricas personalizables por EC",
      "Observación, entrevista, quiz, portafolio",
      "Calificación por criterio de desempeño",
      "Acuerdo inter-evaluador automático",
    ],
    color: "purple",
    href: "/producto/assess",
  },
  {
    id: "comply",
    name: "Avala Comply",
    icon: FileCheck,
    tagline: "DC-3, SIRCE y Plan LFT automáticos",
    description:
      "Genera constancias DC-3 con folio y firmas automáticamente. Exporta datos listos para SIRCE y mantén tu Plan de Capacitación LFT siempre actualizado y auditable.",
    features: [
      "Generación de DC-3 con folio y firmas",
      "Export SIRCE validado",
      "Plan de Capacitación LFT inmutable",
      "Audit trail completo",
    ],
    color: "green",
    href: "/producto/comply",
  },
  {
    id: "badges",
    name: "Avala Badges",
    icon: Award,
    tagline: "Credenciales verificables Open Badges 3.0",
    description:
      "Emite credenciales digitales verificables alineadas a EC. Tus empleados pueden compartirlas en LinkedIn y cualquiera puede verificar su autenticidad al instante.",
    features: [
      "Alineación a Estándares de Competencia",
      "Verificación pública instantánea",
      "Revocación cuando sea necesario",
      "Compatible con LinkedIn y wallets",
    ],
    color: "amber",
    href: "/producto/badges",
  },
  {
    id: "connect",
    name: "Avala Connect",
    icon: Plug,
    tagline: "SSO, SCIM e integraciones HRIS",
    description:
      "Conecta AVALA con tu infraestructura existente. Single Sign-On, provisioning automático de usuarios y sincronización con tu sistema de recursos humanos.",
    features: [
      "SSO (SAML, OIDC)",
      "SCIM provisioning automático",
      "API completa (lectura/escritura)",
      "Integraciones HRIS",
    ],
    color: "cyan",
    href: "/producto/connect",
  },
];

const colorClasses = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
    tab: "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 dark:data-[state=active]:bg-blue-900 dark:data-[state=active]:text-blue-100",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-200 dark:border-purple-800",
    icon: "text-purple-600 dark:text-purple-400",
    tab: "data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900 dark:data-[state=active]:bg-purple-900 dark:data-[state=active]:text-purple-100",
  },
  green: {
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    icon: "text-green-600 dark:text-green-400",
    tab: "data-[state=active]:bg-green-100 data-[state=active]:text-green-900 dark:data-[state=active]:bg-green-900 dark:data-[state=active]:text-green-100",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    icon: "text-amber-600 dark:text-amber-400",
    tab: "data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900 dark:data-[state=active]:bg-amber-900 dark:data-[state=active]:text-amber-100",
  },
  cyan: {
    bg: "bg-cyan-50 dark:bg-cyan-950/30",
    border: "border-cyan-200 dark:border-cyan-800",
    icon: "text-cyan-600 dark:text-cyan-400",
    tab: "data-[state=active]:bg-cyan-100 data-[state=active]:text-cyan-900 dark:data-[state=active]:bg-cyan-900 dark:data-[state=active]:text-cyan-100",
  },
};

export function ProductModules() {
  const [activeModule, setActiveModule] = useState(modules[0]);
  const colors = colorClasses[activeModule.color as keyof typeof colorClasses];

  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Una plataforma, cinco módulos poderosos
          </h2>
          <p className="text-lg text-muted-foreground">
            Cada módulo resuelve un problema específico. Juntos, transforman tu
            gestión de capacitación y cumplimiento.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {modules.map((module) => {
            const Icon = module.icon;
            const isActive = activeModule.id === module.id;
            return (
              <button
                key={module.id}
                onClick={() => setActiveModule(module)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-background hover:bg-muted border"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{module.name}</span>
              </button>
            );
          })}
        </div>

        {/* Content Card */}
        <div
          className={cn(
            "max-w-4xl mx-auto rounded-2xl border-2 p-8 md:p-12 transition-colors",
            colors.bg,
            colors.border
          )}
        >
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Left: Description */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <activeModule.icon className={cn("w-8 h-8", colors.icon)} />
                  <h3 className="text-2xl font-bold">{activeModule.name}</h3>
                </div>
                <p className="text-muted-foreground">{activeModule.tagline}</p>
              </div>

              <p className="text-foreground/80">{activeModule.description}</p>

              <Button asChild>
                <Link href={activeModule.href}>
                  Conocer más
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>

            {/* Right: Features */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Características clave
              </h4>
              <ul className="space-y-3">
                {activeModule.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                        colors.bg,
                        "border",
                        colors.border
                      )}
                    >
                      <span className={cn("text-xs font-bold", colors.icon)}>
                        ✓
                      </span>
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
