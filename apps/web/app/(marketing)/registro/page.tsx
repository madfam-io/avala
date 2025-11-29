"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, ArrowRight, Building2, User } from "lucide-react";

export default function RegistroPage() {
  const [accountType, setAccountType] = useState<"individual" | "organization">(
    "organization"
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-background to-background dark:from-blue-950/20">
      <div className="container py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Benefits */}
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Comienza tu prueba gratuita
              </h1>
              <p className="text-lg text-muted-foreground">
                14 días gratis, sin tarjeta de crédito. Accede a todas las
                funcionalidades y descubre cómo AVALA transforma tu gestión de
                capacitación.
              </p>
            </div>

            <ul className="space-y-4">
              {[
                "Acceso completo a todos los módulos",
                "Importa hasta 50 usuarios de prueba",
                "Genera DC-3 de demostración",
                "Explora +1,400 estándares EC",
                "Soporte por email incluido",
              ].map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            <p className="text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>

          {/* Right: Form */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Crear cuenta</CardTitle>
              <CardDescription>
                Completa tus datos para comenzar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Account Type Selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAccountType("organization")}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    accountType === "organization"
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/30"
                  }`}
                >
                  <Building2 className="w-5 h-5 mb-2 text-primary" />
                  <div className="font-medium">Organización</div>
                  <div className="text-xs text-muted-foreground">
                    Empresa o institución
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType("individual")}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    accountType === "individual"
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/30"
                  }`}
                >
                  <User className="w-5 h-5 mb-2 text-primary" />
                  <div className="font-medium">Individual</div>
                  <div className="text-xs text-muted-foreground">
                    Freelancer o consultor
                  </div>
                </button>
              </div>

              <form className="space-y-4">
                {accountType === "organization" && (
                  <div className="space-y-2">
                    <Label htmlFor="company">Nombre de la empresa</Label>
                    <Input
                      id="company"
                      placeholder="Mi Empresa S.A. de C.V."
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input id="firstName" placeholder="Juan" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input id="lastName" placeholder="Pérez" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="juan@empresa.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Crear cuenta gratuita
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </form>

              <p className="text-xs text-center text-muted-foreground">
                Al registrarte, aceptas nuestros{" "}
                <Link href="/terminos" className="underline hover:text-primary">
                  Términos de Servicio
                </Link>{" "}
                y{" "}
                <Link
                  href="/privacidad"
                  className="underline hover:text-primary"
                >
                  Política de Privacidad
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
