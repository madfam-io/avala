import Link from "next/link";
import { BookOpen, Building2, MapPin } from "lucide-react";
import { FloatingCTA } from "@/components/renec/lead-capture";

export default function ExplorarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/explorar" className="flex items-center gap-2">
              <div className="rounded-lg bg-primary p-2">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">RENEC Explorer</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/explorar/estandares"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                Estándares
              </Link>
              <Link
                href="/explorar/certificadores"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                <Building2 className="h-4 w-4" />
                Certificadores
              </Link>
              <Link
                href="/explorar/centros"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                <MapPin className="h-4 w-4" />
                Centros
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/demo"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Comenzar gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Floating CTA */}
      <FloatingCTA />

      {/* Footer */}
      <footer className="border-t bg-muted/50 mt-16">
        <div className="container py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-lg bg-primary p-2">
                  <BookOpen className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold">Avala</span>
              </div>
              <p className="text-sm text-muted-foreground">
                La plataforma más completa para gestionar certificaciones de
                competencia laboral en México.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Explorar</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/explorar/estandares" className="hover:text-foreground">
                    Estándares de Competencia
                  </Link>
                </li>
                <li>
                  <Link href="/explorar/certificadores" className="hover:text-foreground">
                    Certificadores (ECE/OC)
                  </Link>
                </li>
                <li>
                  <Link href="/explorar/centros" className="hover:text-foreground">
                    Centros de Evaluación
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Soluciones</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/demo" className="hover:text-foreground">
                    Para Individuos
                  </Link>
                </li>
                <li>
                  <Link href="/demo" className="hover:text-foreground">
                    Para Empresas
                  </Link>
                </li>
                <li>
                  <Link href="/demo" className="hover:text-foreground">
                    Para Certificadores
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/privacy" className="hover:text-foreground">
                    Aviso de Privacidad
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-foreground">
                    Términos de Uso
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>
              Datos provenientes del{" "}
              <a
                href="https://conocer.gob.mx/RENEC/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Registro Nacional de Estándares de Competencia (RENEC)
              </a>{" "}
              de CONOCER.
            </p>
            <p className="mt-2">© {new Date().getFullYear()} Avala. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
