import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Play, CheckCircle2, Shield, Award } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/50 via-background to-background dark:from-blue-950/20">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/40 dark:bg-blue-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container py-20 md:py-28 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="space-y-8">
            {/* Badge */}
            <Badge
              variant="secondary"
              className="px-4 py-1.5 text-sm font-medium"
            >
              <Award className="w-4 h-4 mr-2" />
              Plataforma #1 para Capacitación CONOCER
            </Badge>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Capacitación que satisface.{" "}
                <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  Competencias que avalan.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
                Diseña, imparte y certifica formación alineada a Estándares de
                Competencia. Genera DC-3 automáticamente. Emite credenciales
                verificables.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild className="text-base">
                <Link href="/registro">
                  Iniciar prueba gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base">
                <Link href="/demo">
                  <Play className="mr-2 h-5 w-5" />
                  Ver demo
                </Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-green-600" />
                Sin tarjeta de crédito
              </span>
              <span className="flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-green-600" />
                Setup en 5 minutos
              </span>
              <span className="flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-green-600" />
                Soporte incluido
              </span>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative">
            <div className="relative rounded-xl border bg-background shadow-2xl overflow-hidden">
              {/* Mock Dashboard Header */}
              <div className="border-b bg-muted/30 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-muted rounded px-3 py-1 text-xs text-muted-foreground max-w-xs mx-auto text-center">
                    app.avala.mx/dashboard
                  </div>
                </div>
              </div>

              {/* Mock Dashboard Content */}
              <div className="p-6 space-y-4">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-primary">1,247</div>
                    <div className="text-xs text-muted-foreground">
                      Certificaciones
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">98%</div>
                    <div className="text-xs text-muted-foreground">
                      Cumplimiento
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-amber-600">45</div>
                    <div className="text-xs text-muted-foreground">
                      DC-3 este mes
                    </div>
                  </div>
                </div>

                {/* DC-3 Card */}
                <div className="border rounded-lg p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-green-600" />
                        <span className="font-semibold">DC-3 Generado</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        EC0217.01 - Impartición de cursos
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    >
                      Válido
                    </Badge>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Cobertura EC0217.01</span>
                    <span className="text-primary font-medium">92%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: "92%" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Badge */}
            <div className="absolute -bottom-4 -left-4 md:-left-8 bg-background border rounded-lg shadow-lg p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold">Open Badge 3.0</div>
                <div className="text-xs text-muted-foreground">
                  Credencial verificada
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
