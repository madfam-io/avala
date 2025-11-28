import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  BookOpen,
  Building2,
  MapPin,
  CheckCircle,
  XCircle,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LeadCapture } from "@/components/renec/lead-capture";
import { ECJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { getEC, type ECDetail } from "@/lib/api/renec";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Generate dynamic metadata for SEO
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const ec = await getEC(id);

    return {
      title: `${ec.ecClave} - ${ec.titulo} | Avala`,
      description: ec.proposito
        ? ec.proposito.substring(0, 160)
        : `Estándar de Competencia ${ec.ecClave}: ${ec.titulo}. Encuentra certificadores y centros de evaluación.`,
      keywords: [
        ec.ecClave,
        ec.titulo,
        "certificación",
        "competencias laborales",
        "CONOCER",
        ec.sector || "",
      ].filter(Boolean),
      openGraph: {
        title: `${ec.ecClave} - ${ec.titulo}`,
        description:
          ec.proposito?.substring(0, 200) ||
          `Estándar de Competencia ${ec.ecClave}`,
        type: "article",
        url: `https://avala.studio/explorar/estandares/${id}`,
      },
      twitter: {
        card: "summary",
        title: `${ec.ecClave} - ${ec.titulo}`,
        description:
          ec.proposito?.substring(0, 200) ||
          `Estándar de Competencia ${ec.ecClave}`,
      },
      alternates: {
        canonical: `https://avala.studio/explorar/estandares/${id}`,
      },
    };
  } catch {
    return {
      title: "Estándar de Competencia | Avala",
      description: "Explora estándares de competencia laboral en México.",
    };
  }
}

export default async function ECDetailPage({ params }: PageProps) {
  const { id } = await params;

  let ec: ECDetail;

  try {
    ec = await getEC(id);
  } catch {
    notFound();
  }

  return (
    <>
      {/* Structured Data */}
      <ECJsonLd ec={ec} />
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: "https://avala.studio" },
          { name: "Explorar", url: "https://avala.studio/explorar" },
          {
            name: "Estándares",
            url: "https://avala.studio/explorar/estandares",
          },
          {
            name: ec.ecClave,
            url: `https://avala.studio/explorar/estandares/${ec.id}`,
          },
        ]}
      />

      <div className="container py-8">
        {/* Back link */}
        <Link
          href="/explorar/estandares"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a estándares
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-blue-50 p-3">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-mono font-bold text-primary">
                  {ec.ecClave}
                </h1>
                {ec.vigente ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Vigente
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="mr-1 h-3 w-3" />
                    No vigente
                  </Badge>
                )}
              </div>
              <h2 className="text-xl text-foreground">{ec.titulo}</h2>

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                {ec.sector && (
                  <span className="flex items-center gap-1">
                    <Badge variant="outline">{ec.sector}</Badge>
                  </span>
                )}
                {ec.nivelCompetencia && (
                  <span className="flex items-center gap-1">
                    <Badge variant="outline">Nivel {ec.nivelCompetencia}</Badge>
                  </span>
                )}
                {ec.fechaPublicacion && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Publicado:{" "}
                    {new Date(ec.fechaPublicacion).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                )}
                <span>Versión: {ec.version}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Propósito */}
            {ec.proposito && (
              <section className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold mb-4">Propósito</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {ec.proposito}
                </p>
              </section>
            )}

            {/* Elementos de Competencia */}
            {Array.isArray(ec.elementosJson) && ec.elementosJson.length > 0 && (
              <section className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Elementos de Competencia
                </h3>
                <div className="space-y-4">
                  {ec.elementosJson.map((elemento: unknown, index: number) => {
                    const el = elemento as {
                      titulo?: string;
                      descripcion?: string;
                    };
                    return (
                      <div
                        key={index}
                        className="border-l-4 border-primary/30 pl-4 py-2"
                      >
                        <h4 className="font-medium">
                          Elemento {index + 1}
                          {el.titulo && `: ${el.titulo}`}
                        </h4>
                        {el.descripcion && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {el.descripcion}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Criterios de Evaluación */}
            <section className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-semibold mb-4">
                Criterios de Evaluación
              </h3>
              <div className="space-y-6">
                {/* Desempeño */}
                {Array.isArray(ec.critDesempeno) &&
                  ec.critDesempeno.length > 0 && (
                    <div>
                      <h4 className="font-medium text-blue-700 mb-2">
                        Criterios de Desempeño
                      </h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {ec.critDesempeno.map((crit: unknown, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-blue-500">•</span>
                            <span>{String(crit)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Conocimiento */}
                {Array.isArray(ec.critConocimiento) &&
                  ec.critConocimiento.length > 0 && (
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">
                        Criterios de Conocimiento
                      </h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {ec.critConocimiento.map((crit: unknown, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-green-500">•</span>
                            <span>{String(crit)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Producto */}
                {Array.isArray(ec.critProducto) &&
                  ec.critProducto.length > 0 && (
                    <div>
                      <h4 className="font-medium text-orange-700 mb-2">
                        Criterios de Producto
                      </h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {ec.critProducto.map((crit: unknown, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-orange-500">•</span>
                            <span>{String(crit)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* CTA Card */}
            <div className="rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 p-6">
              <h3 className="font-semibold mb-2">¿Quieres certificarte?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Prepárate con nuestros cursos alineados a este estándar de
                competencia.
              </p>
              <Button className="w-full" asChild>
                <Link href="/demo">
                  Comenzar ahora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Certifiers */}
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">
                  Certificadores ({ec.certifiers.length})
                </h3>
              </div>
              {ec.certifiers.length > 0 ? (
                <ul className="space-y-3">
                  {ec.certifiers.slice(0, 5).map((cert) => (
                    <li key={cert.id}>
                      <Link
                        href={`/explorar/certificadores/${cert.id}`}
                        className="block text-sm hover:text-primary transition-colors"
                      >
                        <span className="font-medium">{cert.razonSocial}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {cert.tipo}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                  {ec.certifiers.length > 5 && (
                    <li>
                      <Link
                        href={`/explorar/certificadores?ecCode=${ec.ecClave}`}
                        className="text-sm text-primary hover:underline"
                      >
                        Ver todos ({ec.certifiers.length})
                      </Link>
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay certificadores registrados para este estándar.
                </p>
              )}
            </div>

            {/* Centers */}
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold">
                  Centros de Evaluación ({ec.centers.length})
                </h3>
              </div>
              {ec.centers.length > 0 ? (
                <ul className="space-y-3">
                  {ec.centers.slice(0, 5).map((center) => (
                    <li key={center.id}>
                      <Link
                        href={`/explorar/centros/${center.id}`}
                        className="block text-sm hover:text-primary transition-colors"
                      >
                        <span className="font-medium">{center.nombre}</span>
                        {center.estado && (
                          <span className="text-muted-foreground ml-1">
                            ({center.estado})
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                  {ec.centers.length > 5 && (
                    <li>
                      <Link
                        href={`/explorar/centros?ecCode=${ec.ecClave}`}
                        className="text-sm text-primary hover:underline"
                      >
                        Ver todos ({ec.centers.length})
                      </Link>
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay centros registrados para este estándar.
                </p>
              )}
            </div>

            {/* Source Link */}
            <div className="text-xs text-muted-foreground">
              <p>
                Datos obtenidos del{" "}
                <a
                  href="https://conocer.gob.mx/RENEC/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  RENEC de CONOCER
                </a>
              </p>
              <p className="mt-1">
                Última sincronización:{" "}
                {new Date(ec.lastSyncedAt).toLocaleDateString("es-MX")}
              </p>
            </div>
          </div>
        </div>

        {/* Lead Capture Banner */}
        <div className="mt-12">
          <LeadCapture variant="banner" context={{ ecCode: ec.ecClave }} />
        </div>
      </div>
    </>
  );
}
