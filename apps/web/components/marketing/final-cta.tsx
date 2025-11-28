import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-br from-primary via-blue-600 to-indigo-700 text-primary-foreground relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="container text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Headline */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
            Comienza a avalar competencias hoy
          </h2>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-primary-foreground/80">
            Únete a las empresas que ya automatizan su cumplimiento de
            capacitación con AVALA. Tu equipo de RH te lo agradecerá.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="text-base font-semibold"
              asChild
            >
              <Link href="/registro">
                Iniciar prueba gratis de 14 días
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <Link href="/contacto">Hablar con ventas</Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-primary-foreground/70">
            <span className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Sin tarjeta de crédito
            </span>
            <span className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Cancela cuando quieras
            </span>
            <span className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Soporte incluido
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
