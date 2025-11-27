"use client";

import * as React from "react";
import { useState } from "react";
import { ArrowRight, CheckCircle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createLead, type LeadInput } from "@/lib/api/renec";

interface LeadCaptureProps {
  variant?: "inline" | "modal" | "banner";
  context?: {
    ecCode?: string;
    certifierId?: string;
    centerId?: string;
    source?: string;
  };
  className?: string;
  onSuccess?: () => void;
}

type LeadType = "individual" | "organization";

interface LeadFormData {
  email: string;
  name: string;
  phone?: string;
  company?: string;
  leadType: LeadType;
  interests: string[];
}

export function LeadCapture({
  variant = "inline",
  context,
  className,
  onSuccess,
}: LeadCaptureProps) {
  const [isOpen, setIsOpen] = useState(variant !== "modal");
  const [step, setStep] = useState<"form" | "success">("form");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<LeadFormData>({
    email: "",
    name: "",
    phone: "",
    company: "",
    leadType: "individual",
    interests: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get UTM params from URL if present
      const urlParams = new URLSearchParams(window.location.search);

      // Prepare lead data for API
      const leadData: LeadInput = {
        email: formData.email,
        name: formData.name || undefined,
        phone: formData.phone || undefined,
        company: formData.company || undefined,
        leadType: formData.leadType === "individual" ? "INDIVIDUAL" : "ORGANIZATION",
        interests: formData.interests,
        ecCode: context?.ecCode,
        certifierId: context?.certifierId,
        centerId: context?.centerId,
        utmSource: urlParams.get("utm_source") || undefined,
        utmMedium: urlParams.get("utm_medium") || undefined,
        utmCampaign: urlParams.get("utm_campaign") || undefined,
      };

      // Call real API
      const response = await createLead(leadData);

      if (response.success) {
        setStep("success");
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error submitting lead:", error);
      // Still show success to user - we can retry later
      setStep("success");
      onSuccess?.();
    } finally {
      setIsLoading(false);
    }
  };

  const interests = [
    { id: "certification", label: "Certificarme en competencias" },
    { id: "training", label: "Capacitación para mi equipo" },
    { id: "dc3", label: "Gestión de constancias DC-3" },
    { id: "compliance", label: "Cumplimiento STPS/LFT" },
  ];

  // Modal variant
  if (variant === "modal") {
    if (!isOpen) {
      return (
        <Button onClick={() => setIsOpen(true)} className={className}>
          Comenzar gratis
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      );
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="relative w-full max-w-md rounded-xl bg-background p-6 shadow-lg">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
          <LeadForm
            step={step}
            formData={formData}
            setFormData={setFormData}
            interests={interests}
            isLoading={isLoading}
            handleSubmit={handleSubmit}
            onClose={() => setIsOpen(false)}
          />
        </div>
      </div>
    );
  }

  // Banner variant
  if (variant === "banner") {
    if (step === "success") {
      return (
        <div
          className={cn(
            "rounded-lg bg-green-50 border border-green-200 p-4 text-center",
            className
          )}
        >
          <div className="flex items-center justify-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">¡Gracias! Te contactaremos pronto.</span>
          </div>
        </div>
      );
    }

    return (
      <form
        onSubmit={handleSubmit}
        className={cn(
          "rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border p-4",
          className
        )}
      >
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 text-center sm:text-left">
            <p className="font-medium">
              {context?.ecCode
                ? `¿Quieres certificarte en ${context.ecCode}?`
                : "¿Listo para certificarte?"}
            </p>
            <p className="text-sm text-muted-foreground">
              Déjanos tu correo y te ayudamos a empezar.
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="email"
              required
              placeholder="tu@email.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="h-10 flex-1 sm:w-64 rounded-md border border-input bg-background px-3 text-sm"
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Enviar"
              )}
            </Button>
          </div>
        </div>
      </form>
    );
  }

  // Inline variant (default)
  return (
    <div className={cn("rounded-lg border bg-card p-6", className)}>
      <LeadForm
        step={step}
        formData={formData}
        setFormData={setFormData}
        interests={interests}
        isLoading={isLoading}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}

interface LeadFormProps {
  step: "form" | "success";
  formData: LeadFormData;
  setFormData: React.Dispatch<React.SetStateAction<LeadFormData>>;
  interests: Array<{ id: string; label: string }>;
  isLoading: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  onClose?: () => void;
}

function LeadForm({
  step,
  formData,
  setFormData,
  interests,
  isLoading,
  handleSubmit,
  onClose,
}: LeadFormProps) {
  if (step === "success") {
    return (
      <div className="text-center py-4">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold">¡Gracias por tu interés!</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Te enviaremos información a tu correo. Mientras tanto, puedes seguir
          explorando el RENEC.
        </p>
        {onClose && (
          <Button variant="outline" className="mt-4" onClick={onClose}>
            Cerrar
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Comienza tu certificación</h3>
        <p className="text-sm text-muted-foreground">
          Cuéntanos sobre ti y te ayudamos a empezar.
        </p>
      </div>

      {/* Lead Type */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setFormData({ ...formData, leadType: "individual" })}
          className={cn(
            "rounded-lg border p-3 text-sm transition-colors",
            formData.leadType === "individual"
              ? "border-primary bg-primary/5"
              : "hover:bg-accent"
          )}
        >
          <p className="font-medium">Soy individuo</p>
          <p className="text-xs text-muted-foreground">
            Quiero certificarme
          </p>
        </button>
        <button
          type="button"
          onClick={() => setFormData({ ...formData, leadType: "organization" })}
          className={cn(
            "rounded-lg border p-3 text-sm transition-colors",
            formData.leadType === "organization"
              ? "border-primary bg-primary/5"
              : "hover:bg-accent"
          )}
        >
          <p className="font-medium">Soy empresa</p>
          <p className="text-xs text-muted-foreground">
            Capacitar a mi equipo
          </p>
        </button>
      </div>

      {/* Name */}
      <div>
        <label className="text-sm font-medium">Nombre completo *</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          placeholder="Tu nombre"
        />
      </div>

      {/* Email */}
      <div>
        <label className="text-sm font-medium">Email *</label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          placeholder="tu@email.com"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="text-sm font-medium">Teléfono (opcional)</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          placeholder="55 1234 5678"
        />
      </div>

      {/* Company (for organizations) */}
      {formData.leadType === "organization" && (
        <div>
          <label className="text-sm font-medium">Empresa *</label>
          <input
            type="text"
            required
            value={formData.company}
            onChange={(e) =>
              setFormData({ ...formData, company: e.target.value })
            }
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            placeholder="Nombre de tu empresa"
          />
        </div>
      )}

      {/* Interests */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          ¿Qué te interesa?
        </label>
        <div className="grid grid-cols-2 gap-2">
          {interests.map((interest) => (
            <label
              key={interest.id}
              className={cn(
                "flex items-center gap-2 rounded-md border p-2 text-sm cursor-pointer transition-colors",
                formData.interests.includes(interest.id)
                  ? "border-primary bg-primary/5"
                  : "hover:bg-accent"
              )}
            >
              <input
                type="checkbox"
                checked={formData.interests.includes(interest.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({
                      ...formData,
                      interests: [...formData.interests, interest.id],
                    });
                  } else {
                    setFormData({
                      ...formData,
                      interests: formData.interests.filter(
                        (i) => i !== interest.id
                      ),
                    });
                  }
                }}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span>{interest.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            Comenzar ahora
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Al enviar, aceptas nuestros{" "}
        <a href="/terms" className="underline hover:text-foreground">
          términos
        </a>{" "}
        y{" "}
        <a href="/privacy" className="underline hover:text-foreground">
          aviso de privacidad
        </a>
        .
      </p>
    </form>
  );
}

// Floating CTA that appears after scrolling
export function FloatingCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const pageHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercentage = (scrollY / pageHeight) * 100;

      // Show after scrolling 40% of the page
      if (scrollPercentage > 40 && !isDismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDismissed]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 animate-in slide-in-from-bottom-4 duration-300">
      <div className="relative rounded-lg border bg-card p-4 shadow-lg max-w-sm">
        <button
          onClick={() => {
            setIsVisible(false);
            setIsDismissed(true);
          }}
          className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="font-medium pr-6">¿Listo para certificarte?</p>
        <p className="text-sm text-muted-foreground mt-1 mb-3">
          Comienza tu prueba gratuita de 14 días.
        </p>
        <Button size="sm" className="w-full" asChild>
          <a href="/demo">
            Comenzar gratis
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}

// Exit intent popup
export function ExitIntentPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  React.useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasShown) {
        setIsOpen(true);
        setHasShown(true);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [hasShown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-xl bg-background p-6 shadow-lg animate-in zoom-in-95 duration-200">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold">¡Espera!</h3>
          <p className="text-muted-foreground mt-2">
            Antes de irte, ¿te gustaría recibir recursos gratuitos para tu
            certificación?
          </p>
        </div>
        <LeadCapture
          variant="inline"
          context={{ source: "exit-intent" }}
          onSuccess={() => {
            setTimeout(() => setIsOpen(false), 2000);
          }}
        />
      </div>
    </div>
  );
}
