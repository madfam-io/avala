import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  MapPin,
  Building2,
  BookOpen,
  Phone,
  Mail,
  Navigation,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LeadCapture } from "@/components/renec/lead-capture";
import { CenterJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { getCenter } from "@/lib/api/renec";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Generate dynamic metadata for SEO
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const center = await getCenter(id);
    const location = [center.municipio, center.estado]
      .filter(Boolean)
      .join(", ");

    return {
      title: `${center.nombre} - Centro de Evaluación | Avala`,
      description: `Centro de evaluación ${center.nombre} en ${location || "México"}. Evalúa ${center.ecStandards.length} estándares de competencia.`,
      openGraph: {
        title: `${center.nombre} - Centro de Evaluación`,
        description: `Centro de evaluación en ${location || "México"} con ${center.ecStandards.length} estándares.`,
        type: "website",
        url: `https://avala.mx/explorar/centros/${id}`,
      },
      alternates: {
        canonical: `https://avala.mx/explorar/centros/${id}`,
      },
    };
  } catch {
    return {
      title: "Centro de Evaluación | Avala",
      description: "Explora centros de evaluación en México.",
    };
  }
}

export default async function CenterDetailPage({ params }: PageProps) {
  const { id } = await params;

  let center: Awaited<ReturnType<typeof getCenter>>;

  try {
    center = await getCenter(id);
  } catch {
    notFound();
  }

  const hasCoordinates = center.latitud && center.longitud;
  const googleMapsUrl = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${center.latitud},${center.longitud}`
    : center.direccion
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          center.direccion + ", " + center.municipio + ", " + center.estado,
        )}`
      : null;

  return (
    <>
      {/* Structured Data */}
      <CenterJsonLd center={center} />
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: "https://avala.mx" },
          { name: "Explorar", url: "https://avala.mx/explorar" },
          { name: "Centros", url: "https://avala.mx/explorar/centros" },
          {
            name: center.nombre,
            url: `https://avala.mx/explorar/centros/${center.id}`,
          },
        ]}
      />

      <div className="container py-8">
        {/* Back link */}
        <Link
          href="/explorar/centros"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a centros
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-orange-50 p-3">
              <MapPin className="h-8 w-8 text-orange-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {center.activo ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                    Activo
                  </Badge>
                ) : (
                  <Badge variant="secondary">Inactivo</Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold">{center.nombre}</h1>

              <div className="mt-2 text-muted-foreground">
                {center.municipio && <span>{center.municipio}, </span>}
                {center.estado && <span>{center.estado}</span>}
              </div>

              {center.direccion && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {center.direccion}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Contact & Location */}
            <section className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-semibold mb-4">
                Contacto y Ubicación
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {center.telefono && (
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Teléfono</p>
                      <a
                        href={`tel:${center.telefono}`}
                        className="font-medium hover:text-primary"
                      >
                        {center.telefono}
                      </a>
                    </div>
                  </div>
                )}
                {center.email && (
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <a
                        href={`mailto:${center.email}`}
                        className="font-medium hover:text-primary"
                      >
                        {center.email}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Map Link */}
              {googleMapsUrl && (
                <div className="mt-4 pt-4 border-t">
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    <Navigation className="h-4 w-4" />
                    Ver en Google Maps
                  </a>
                </div>
              )}
            </section>

            {/* Parent Certifier */}
            {center.certifier && (
              <section className="rounded-lg border bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold">Certificador</h3>
                </div>
                <Link
                  href={`/explorar/certificadores/${center.certifier.id}`}
                  className="block rounded-lg border p-4 hover:border-primary/50 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-lg p-2 ${
                        center.certifier.tipo === "ECE"
                          ? "bg-blue-50"
                          : "bg-purple-50"
                      }`}
                    >
                      <Building2
                        className={`h-5 w-5 ${
                          center.certifier.tipo === "ECE"
                            ? "text-blue-600"
                            : "text-purple-600"
                        }`}
                      />
                    </div>
                    <div>
                      <Badge
                        variant="outline"
                        className={`mb-1 ${
                          center.certifier.tipo === "ECE"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-purple-200 bg-purple-50 text-purple-700"
                        }`}
                      >
                        {center.certifier.tipo}
                      </Badge>
                      <p className="font-medium">
                        {center.certifier.razonSocial}
                      </p>
                    </div>
                  </div>
                </Link>
              </section>
            )}

            {/* EC Standards */}
            <section className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">
                  Estándares que evalúa ({center.ecStandards.length})
                </h3>
              </div>
              {center.ecStandards.length > 0 ? (
                <div className="space-y-3">
                  {center.ecStandards.map((ec) => (
                    <Link
                      key={ec.id}
                      href={`/explorar/estandares/${ec.id}`}
                      className="block rounded-lg border p-4 hover:border-primary/50 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="font-mono font-bold text-primary">
                            {ec.ecClave}
                          </span>
                          <p className="text-sm text-foreground mt-1 line-clamp-2">
                            {ec.titulo}
                          </p>
                          <div className="mt-2 flex gap-2">
                            {ec.sector && (
                              <Badge variant="outline" className="text-xs">
                                {ec.sector}
                              </Badge>
                            )}
                            {ec.vigente ? (
                              <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">
                                Vigente
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                No vigente
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay estándares registrados para este centro.
                </p>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* CTA Card */}
            <div className="rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 p-6">
              <h3 className="font-semibold mb-2">
                ¿Quieres certificarte aquí?
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Prepárate con nuestros cursos alineados a los estándares que
                evalúa este centro.
              </p>
              <Button className="w-full" asChild>
                <Link href="/demo">
                  Comenzar ahora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold mb-4">Información</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Estándares
                  </span>
                  <span className="font-medium">
                    {center.ecStandards.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">ID</span>
                  <span className="font-mono text-sm">{center.centerId}</span>
                </div>
                {hasCoordinates && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Coordenadas
                    </span>
                    <span className="font-mono text-xs">
                      {center.latitud?.toFixed(4)},{" "}
                      {center.longitud?.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
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
                {new Date(center.lastSyncedAt).toLocaleDateString("es-MX")}
              </p>
            </div>
          </div>
        </div>

        {/* Lead Capture Banner */}
        <div className="mt-12">
          <LeadCapture variant="banner" context={{ centerId: center.id }} />
        </div>
      </div>
    </>
  );
}
