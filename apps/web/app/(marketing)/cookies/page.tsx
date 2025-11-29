import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function CookiesPage() {
  return (
    <div className="min-h-screen">
      <div className="container py-16 md:py-24 max-w-4xl">
        <Button variant="ghost" asChild className="mb-8">
          <Link href="/">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Volver al inicio
          </Link>
        </Button>

        <h1 className="text-3xl md:text-4xl font-bold mb-8">
          Política de Cookies
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-muted-foreground">
            Última actualización: {new Date().toLocaleDateString("es-MX", { dateStyle: "long" })}
          </p>

          <h2>¿Qué son las Cookies?</h2>
          <p>
            Las cookies son pequeños archivos de texto que se almacenan en su
            dispositivo cuando visita un sitio web. Nos ayudan a mejorar su
            experiencia y entender cómo utiliza nuestra plataforma.
          </p>

          <h2>Tipos de Cookies que Utilizamos</h2>

          <h3>Cookies Esenciales</h3>
          <p>
            Necesarias para el funcionamiento básico del sitio. Incluyen cookies
            de sesión y autenticación. No se pueden desactivar.
          </p>

          <h3>Cookies de Rendimiento</h3>
          <p>
            Nos ayudan a entender cómo los visitantes interactúan con el sitio,
            recopilando información de forma anónima.
          </p>

          <h3>Cookies de Funcionalidad</h3>
          <p>
            Permiten recordar sus preferencias (como idioma o tema) para
            proporcionar una experiencia más personalizada.
          </p>

          <h2>Gestión de Cookies</h2>
          <p>
            Puede controlar y eliminar cookies a través de la configuración de su
            navegador. Sin embargo, esto puede afectar la funcionalidad del sitio.
          </p>

          <h2>Cookies de Terceros</h2>
          <p>
            Utilizamos servicios de terceros que pueden establecer sus propias
            cookies, incluyendo:
          </p>
          <ul>
            <li>Google Analytics (análisis de uso)</li>
            <li>Intercom (soporte al cliente)</li>
          </ul>

          <h2>Más Información</h2>
          <p>
            Para más información sobre nuestra política de cookies, contáctenos en:{" "}
            <a href="mailto:privacidad@avala.studio">privacidad@avala.studio</a>
          </p>
        </div>
      </div>
    </div>
  );
}
