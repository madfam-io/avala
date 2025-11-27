import { Suspense } from "react";
import Link from "next/link";
import { BookOpen, Building2, MapPin, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBox } from "@/components/renec/search-box";
import { StatsCards } from "@/components/renec/stats-cards";
import { getStats, type RenecStats } from "@/lib/api/renec";

async function Stats() {
  let stats: RenecStats;

  try {
    stats = await getStats();
  } catch {
    // Fallback stats for when API is unavailable
    stats = {
      overview: {
        ecStandards: { total: 0, active: 0 },
        certifiers: { total: 0, active: 0 },
        centers: { total: 0, active: 0 },
        lastSyncAt: null,
      },
      distributions: {
        ecBySector: [],
        certifiersByState: [],
        centersByState: [],
      },
    };
  }

  return <StatsCards stats={stats} />;
}

function StatsLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border bg-card p-6 shadow-sm animate-pulse"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-muted p-3 h-12 w-12" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-6 w-20 bg-muted rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ExplorarPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Explora el{" "}
              <span className="text-primary">Registro Nacional</span> de
              Estándares de Competencia
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Encuentra estándares de competencia, certificadores autorizados y
              centros de evaluación en todo México. Una mejor experiencia para
              acceder a los datos públicos de CONOCER.
            </p>

            {/* Search Box */}
            <div className="mt-8 mx-auto max-w-2xl">
              <SearchBox />
            </div>

            {/* Quick Links */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/explorar/estandares?q=EC0217"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                EC0217 - Impartición de cursos
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link
                href="/explorar/estandares?q=EC0249"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                EC0249 - Conducción de capacitación
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link
                href="/explorar/estandares?q=EC0076"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                EC0076 - Evaluación de competencias
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container py-12">
        <Suspense fallback={<StatsLoading />}>
          <Stats />
        </Suspense>
      </section>

      {/* Browse Categories */}
      <section className="container py-12">
        <h2 className="text-2xl font-bold text-center mb-8">
          ¿Qué estás buscando?
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          {/* EC Standards */}
          <Link
            href="/explorar/estandares"
            className="group relative rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-lg hover:border-blue-200"
          >
            <div className="mb-4 inline-flex rounded-lg bg-blue-50 p-3">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold group-hover:text-blue-600 transition-colors">
              Estándares de Competencia
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Consulta los estándares de competencia vigentes, sus requisitos,
              elementos y criterios de evaluación.
            </p>
            <div className="mt-4 flex items-center text-sm font-medium text-blue-600">
              Explorar estándares
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Certifiers */}
          <Link
            href="/explorar/certificadores"
            className="group relative rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-lg hover:border-green-200"
          >
            <div className="mb-4 inline-flex rounded-lg bg-green-50 p-3">
              <Building2 className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold group-hover:text-green-600 transition-colors">
              Certificadores
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Encuentra Entidades de Certificación (ECE) y Organismos
              Certificadores (OC) autorizados por CONOCER.
            </p>
            <div className="mt-4 flex items-center text-sm font-medium text-green-600">
              Ver certificadores
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Centers */}
          <Link
            href="/explorar/centros"
            className="group relative rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-lg hover:border-orange-200"
          >
            <div className="mb-4 inline-flex rounded-lg bg-orange-50 p-3">
              <MapPin className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold group-hover:text-orange-600 transition-colors">
              Centros de Evaluación
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Localiza centros de evaluación cercanos a ti donde puedes
              certificar tus competencias laborales.
            </p>
            <div className="mt-4 flex items-center text-sm font-medium text-orange-600">
              Buscar centros
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-16">
        <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-8 md:p-12 text-primary-foreground">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">
                ¿Listo para certificarte?
              </h2>
              <p className="mt-4 text-primary-foreground/90">
                Avala te ayuda a prepararte para tu certificación de competencia
                laboral. Accede a materiales de estudio, simuladores de examen y
                seguimiento de tu progreso.
              </p>
              <ul className="mt-6 space-y-2">
                {[
                  "Cursos alineados a estándares CONOCER",
                  "Simuladores de evaluación",
                  "Generación de constancias DC-3",
                  "Seguimiento de certificaciones",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col items-center md:items-end gap-4">
              <Button
                size="lg"
                variant="secondary"
                className="w-full md:w-auto"
                asChild
              >
                <Link href="/demo">
                  Comenzar prueba gratuita
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <p className="text-sm text-primary-foreground/70">
                Sin tarjeta de crédito • 14 días gratis
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
