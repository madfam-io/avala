"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DemoRole } from "../_data/demo-roles";

interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
}

interface GuidedTourProps {
  role: DemoRole;
  onComplete?: () => void;
  onSkip?: () => void;
}

const TOUR_STEPS: Record<DemoRole, TourStep[]> = {
  hr: [
    {
      id: "welcome",
      title: "¡Bienvenido, Gerente de Capacitación!",
      description:
        "En esta demo interactiva verás cómo Avala te ayuda a gestionar la capacitación de tu equipo con cumplimiento normativo automático.",
      position: "center",
    },
    {
      id: "compliance",
      title: "Panel de Cumplimiento",
      description:
        "Visualiza en tiempo real el porcentaje de cumplimiento STPS de tu organización. Avala calcula automáticamente DC-3 vencidos y próximos a vencer.",
      position: "center",
    },
    {
      id: "dc3",
      title: "Generación de DC-3",
      description:
        "Los constancias DC-3 se generan automáticamente al completar cursos alineados a Estándares de Competencia. Sin capturas manuales.",
      position: "center",
    },
    {
      id: "reports",
      title: "Reportes para STPS",
      description:
        "Descarga reportes listos para auditorías: listados DC-3, planes LFT, y matrices de competencias por área.",
      position: "center",
    },
  ],
  instructor: [
    {
      id: "welcome",
      title: "¡Bienvenido, Instructor!",
      description:
        "Descubre cómo Avala simplifica la impartición de cursos y la evaluación de competencias alineadas a estándares CONOCER.",
      position: "center",
    },
    {
      id: "courses",
      title: "Tus Cursos Asignados",
      description:
        "Visualiza los cursos que impartes, el progreso de cada grupo, y los participantes inscritos.",
      position: "center",
    },
    {
      id: "assessments",
      title: "Evaluaciones Pendientes",
      description:
        "Recibe notificaciones de evaluaciones por calificar. Cada evaluación está alineada a los criterios del Estándar de Competencia.",
      position: "center",
    },
    {
      id: "students",
      title: "Seguimiento de Participantes",
      description:
        "Monitorea el avance individual, identifica quién necesita apoyo, y registra evidencias de desempeño.",
      position: "center",
    },
  ],
  trainee: [
    {
      id: "welcome",
      title: "¡Bienvenido, Colaborador!",
      description:
        "Explora tu experiencia de aprendizaje con gamificación, credenciales verificables, y desarrollo profesional medible.",
      position: "center",
    },
    {
      id: "progress",
      title: "Tu Progreso de Aprendizaje",
      description:
        "Visualiza tus cursos activos, porcentaje de avance, y tiempo estimado de finalización. Gana XP al completar actividades.",
      position: "center",
    },
    {
      id: "credentials",
      title: "Credenciales Open Badge 3.0",
      description:
        "Al aprobar un curso recibes una credencial digital verificable internacionalmente. Compártela en LinkedIn o tu CV.",
      position: "center",
    },
    {
      id: "achievements",
      title: "Gamificación y Logros",
      description:
        "Desbloquea logros, sube de nivel, y compite en rankings. El aprendizaje se vuelve una experiencia motivante.",
      position: "center",
    },
  ],
  executive: [
    {
      id: "welcome",
      title: "¡Bienvenido, Directivo!",
      description:
        "Accede a métricas ejecutivas de capacitación: ROI, cumplimiento regulatorio, y análisis de inversión en capital humano.",
      position: "center",
    },
    {
      id: "roi",
      title: "Retorno de Inversión",
      description:
        "Visualiza el ROI de capacitación calculado automáticamente: costo por colaborador capacitado, comparativas sectoriales, y tendencias.",
      position: "center",
    },
    {
      id: "compliance",
      title: "Cumplimiento Organizacional",
      description:
        "Dashboard ejecutivo de cumplimiento STPS por área, alertas de riesgo regulatorio, y proyecciones de vencimiento.",
      position: "center",
    },
    {
      id: "reports",
      title: "Reportes Estratégicos",
      description:
        "Genera reportes para el consejo: inversión en capacitación, impacto en competencias clave, y benchmarks de industria.",
      position: "center",
    },
  ],
};

export function GuidedTour({ role, onComplete, onSkip }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const steps = TOUR_STEPS[role];
  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Check if user has already seen the tour for this role
  useEffect(() => {
    const tourKey = `avala-demo-tour-${role}`;
    const hasSeen = localStorage.getItem(tourKey);
    if (hasSeen === "true") {
      setIsVisible(false);
    }
  }, [role]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    const tourKey = `avala-demo-tour-${role}`;
    localStorage.setItem(tourKey, "true");
    setIsVisible(false);
    onSkip?.();
  };

  const handleComplete = () => {
    const tourKey = `avala-demo-tour-${role}`;
    localStorage.setItem(tourKey, "true");
    setIsVisible(false);
    onComplete?.();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Tour Card */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-background border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Progress indicator */}
        <div className="flex gap-1 p-3 bg-muted/30">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                index <= currentStep ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {isFirstStep && (
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-blue-600/20 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
            </div>
          )}

          <h3 className="text-xl font-semibold text-center mb-3">
            {step.title}
          </h3>
          <p className="text-muted-foreground text-center leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 p-4 border-t bg-muted/20">
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            Saltar tour
          </Button>

          <div className="flex gap-2">
            {!isFirstStep && (
              <Button variant="outline" size="sm" onClick={handlePrev}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
            )}
            <Button size="sm" onClick={handleNext}>
              {isLastStep ? (
                "Explorar demo"
              ) : (
                <>
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

// Hook for resetting tour (useful for demo purposes)
export function useResetTour() {
  const resetTour = (role?: DemoRole) => {
    if (role) {
      localStorage.removeItem(`avala-demo-tour-${role}`);
    } else {
      // Reset all tours
      ["hr", "instructor", "trainee", "executive"].forEach((r) => {
        localStorage.removeItem(`avala-demo-tour-${r}`);
      });
    }
  };

  return { resetTour };
}

// Floating help button to restart tour
export function TourHelpButton({
  role,
  className,
}: {
  role: DemoRole;
  className?: string;
}) {
  const { resetTour } = useResetTour();

  const handleRestart = () => {
    resetTour(role);
    // Force re-render by reloading
    window.location.reload();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRestart}
      className={cn("gap-2", className)}
    >
      <Sparkles className="w-4 h-4" />
      Repetir tour
    </Button>
  );
}
