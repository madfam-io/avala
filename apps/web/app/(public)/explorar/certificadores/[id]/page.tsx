import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  MapPin,
  BookOpen,
  Phone,
  Mail,
  Globe,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCertifier } from "@/lib/api/renec";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CertifierDetailPage({ params }: PageProps) {
  const { id } = await params;

  let certifier: Awaited<ReturnType<typeof getCertifier>>;

  try {
    certifier = await getCertifier(id);
  } catch {
    notFound();
  }

  return (
    <div className="container py-8">
      {/* Back link */}
      <Link
        href="/explorar/certificadores"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a certificadores
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-4">
          <div
            className={`rounded-lg p-3 ${
              certifier.tipo === "ECE" ? "bg-blue-50" : "bg-purple-50"
            }`}
          >
            <Building2
              className={`h-8 w-8 ${
                certifier.tipo === "ECE" ? "text-blue-600" : "text-purple-600"
              }`}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge
                variant="outline"
                className={
                  certifier.tipo === "ECE"
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-purple-200 bg-purple-50 text-purple-700"
                }
              >
                {certifier.tipo === "ECE"
                  ? "Entidad de Certificación y Evaluación"
                  : "Organismo Certificador"}
              </Badge>
              {certifier.activo ? (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  Activo
                </Badge>
              ) : (
                <Badge variant="secondary">Inactivo</Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold">{certifier.razonSocial}</h1>
            {certifier.nombreComercial &&
              certifier.nombreComercial !== certifier.razonSocial && (
                <p className="text-lg text-muted-foreground">
                  {certifier.nombreComercial}
                </p>
              )}

            {certifier.estado && (
              <div className="mt-2 flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{certifier.estado}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Contact Information */}
          <section className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4">
              Información de Contacto
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {certifier.telefono && (
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-muted p-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <a
                      href={`tel:${certifier.telefono}`}
                      className="font-medium hover:text-primary"
                    >
                      {certifier.telefono}
                    </a>
                  </div>
                </div>
              )}
              {certifier.email && (
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-muted p-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a
                      href={`mailto:${certifier.email}`}
                      className="font-medium hover:text-primary"
                    >
                      {certifier.email}
                    </a>
                  </div>
                </div>
              )}
              {certifier.sitioWeb && (
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-muted p-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sitio Web</p>
                    <a
                      href={certifier.sitioWeb}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:text-primary"
                    >
                      {certifier.sitioWeb.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* EC Standards */}
          <section className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">
                Estándares Acreditados ({certifier.ecStandards.length})
              </h3>
            </div>
            {certifier.ecStandards.length > 0 ? (
              <div className="space-y-3">
                {certifier.ecStandards.map((ec) => (
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
                No hay estándares registrados para este certificador.
              </p>
            )}
          </section>

          {/* Centers */}
          <section className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-semibold">
                Centros de Evaluación ({certifier.centers.length})
              </h3>
            </div>
            {certifier.centers.length > 0 ? (
              <div className="space-y-3">
                {certifier.centers.map((center) => (
                  <Link
                    key={center.id}
                    href={`/explorar/centros/${center.id}`}
                    className="block rounded-lg border p-4 hover:border-primary/50 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="font-medium">{center.nombre}</span>
                        <p className="text-sm text-muted-foreground mt-1">
                          {[center.municipio, center.estado]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {center.ecCount} estándares
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay centros registrados para este certificador.
              </p>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* CTA Card */}
          <div className="rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 p-6">
            <h3 className="font-semibold mb-2">¿Quieres certificarte aquí?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Prepárate con nuestros cursos y encuentra el centro de evaluación
              más cercano.
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
            <h3 className="font-semibold mb-4">Resumen</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Estándares acreditados
                </span>
                <span className="font-medium">{certifier.ecCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Centros de evaluación
                </span>
                <span className="font-medium">{certifier.centerCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">ID</span>
                <span className="font-mono text-sm">{certifier.certId}</span>
              </div>
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
              {new Date(certifier.lastSyncedAt).toLocaleDateString("es-MX")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
