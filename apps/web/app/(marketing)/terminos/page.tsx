import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TerminosPage() {
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
          Términos de Servicio
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-muted-foreground">
            Última actualización: {new Date().toLocaleDateString("es-MX", { dateStyle: "long" })}
          </p>

          <h2>1. Aceptación de los Términos</h2>
          <p>
            Al acceder y utilizar AVALA (la &quot;Plataforma&quot;), operada por
            Innovaciones MADFAM S.A.S. de C.V., usted acepta estos términos de
            servicio. Si no está de acuerdo, no utilice la plataforma.
          </p>

          <h2>2. Descripción del Servicio</h2>
          <p>
            AVALA es una plataforma de gestión de capacitación y cumplimiento
            laboral que incluye:
          </p>
          <ul>
            <li>Gestión de cursos y rutas de aprendizaje</li>
            <li>Evaluación de competencias</li>
            <li>Generación de constancias DC-3</li>
            <li>Emisión de credenciales digitales verificables</li>
          </ul>

          <h2>3. Cuentas de Usuario</h2>
          <p>
            Usted es responsable de mantener la confidencialidad de su cuenta y
            contraseña. Debe notificarnos inmediatamente cualquier uso no autorizado.
          </p>

          <h2>4. Uso Aceptable</h2>
          <p>Usted se compromete a no:</p>
          <ul>
            <li>Violar leyes o regulaciones aplicables</li>
            <li>Infringir derechos de propiedad intelectual</li>
            <li>Transmitir contenido malicioso o dañino</li>
            <li>Intentar acceder a sistemas sin autorización</li>
          </ul>

          <h2>5. Propiedad Intelectual</h2>
          <p>
            AVALA y su contenido son propiedad de Innovaciones MADFAM S.A.S. de C.V.
            El contenido que usted cargue permanece como su propiedad, pero nos
            otorga licencia para utilizarlo en la prestación del servicio.
          </p>

          <h2>6. Limitación de Responsabilidad</h2>
          <p>
            AVALA se proporciona &quot;tal cual&quot;. No garantizamos que el servicio
            sea ininterrumpido o libre de errores. Nuestra responsabilidad se
            limita al monto pagado por el servicio.
          </p>

          <h2>7. Ley Aplicable</h2>
          <p>
            Estos términos se rigen por las leyes de México. Cualquier disputa se
            resolverá en los tribunales competentes de la Ciudad de México.
          </p>

          <h2>8. Contacto</h2>
          <p>
            Para consultas sobre estos términos:{" "}
            <a href="mailto:legal@avala.studio">legal@avala.studio</a>
          </p>
        </div>
      </div>
    </div>
  );
}
