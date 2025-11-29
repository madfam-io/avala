"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Building2,
  Clock,
} from "lucide-react";

const contactMethods = [
  {
    icon: Mail,
    title: "Email",
    description: "Respuesta en menos de 24 horas",
    value: "hola@avala.studio",
    href: "mailto:hola@avala.studio",
  },
  {
    icon: Phone,
    title: "Teléfono",
    description: "Lun-Vie 9:00-18:00 CST",
    value: "+52 (55) 1234-5678",
    href: "tel:+525512345678",
  },
  {
    icon: MapPin,
    title: "Oficina",
    description: "Visítanos con cita previa",
    value: "CDMX, México",
    href: "#",
  },
];

const reasons = [
  { value: "demo", label: "Solicitar demostración" },
  { value: "pricing", label: "Información de precios" },
  { value: "enterprise", label: "Plan Enterprise" },
  { value: "partnership", label: "Alianzas y partnerships" },
  { value: "support", label: "Soporte técnico" },
  { value: "other", label: "Otro" },
];

export default function ContactoPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    alert("Gracias por contactarnos. Te responderemos pronto.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-background to-background dark:from-blue-950/20">
      <div className="container py-16 md:py-24">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Hablemos de tu proyecto
          </h1>
          <p className="text-lg text-muted-foreground">
            Nuestro equipo está listo para ayudarte a transformar la gestión de
            capacitación de tu organización.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto">
          {/* Contact Methods */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Otras formas de contacto</h2>

            {contactMethods.map((method) => (
              <a
                key={method.title}
                href={method.href}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <method.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{method.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {method.description}
                  </div>
                  <div className="text-sm text-primary mt-1">
                    {method.value}
                  </div>
                </div>
              </a>
            ))}

            {/* Office Hours */}
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-sm">Horario de atención</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Lunes a Viernes: 9:00 - 18:00 CST
                <br />
                Sábado y Domingo: Cerrado
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <Card className="lg:col-span-2 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Envíanos un mensaje
              </CardTitle>
              <CardDescription>
                Completa el formulario y te contactaremos en menos de 24 horas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre *</Label>
                    <Input id="firstName" required placeholder="Juan" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido *</Label>
                    <Input id="lastName" required placeholder="Pérez" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="juan@empresa.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" placeholder="+52 (55) 1234-5678" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Empresa</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="company"
                        className="pl-10"
                        placeholder="Mi Empresa S.A."
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Motivo de contacto *</Label>
                    <select
                      id="reason"
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Selecciona una opción</option>
                      {reasons.map((reason) => (
                        <option key={reason.value} value={reason.value}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensaje *</Label>
                  <Textarea
                    id="message"
                    required
                    placeholder="Cuéntanos sobre tu proyecto o necesidades..."
                    rows={5}
                  />
                </div>

                <Button type="submit" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    "Enviando..."
                  ) : (
                    <>
                      Enviar mensaje
                      <Send className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
