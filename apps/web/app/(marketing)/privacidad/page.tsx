import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacidadPage() {
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
          Política de Privacidad
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-muted-foreground">
            Última actualización: {new Date().toLocaleDateString("es-MX", { dateStyle: "long" })}
          </p>

          <h2>1. Información que Recopilamos</h2>
          <p>
            En AVALA (operado por Innovaciones MADFAM S.A.S. de C.V.), recopilamos
            información que usted nos proporciona directamente, como nombre, correo
            electrónico, información de empresa y datos relacionados con su uso de
            nuestros servicios de capacitación y certificación.
          </p>

          <h2>2. Uso de la Información</h2>
          <p>Utilizamos la información recopilada para:</p>
          <ul>
            <li>Proporcionar, mantener y mejorar nuestros servicios</li>
            <li>Generar constancias DC-3 y credenciales verificables</li>
            <li>Comunicarnos con usted sobre su cuenta y servicios</li>
            <li>Cumplir con obligaciones legales y regulatorias</li>
          </ul>

          <h2>3. Compartir Información</h2>
          <p>
            No vendemos su información personal. Podemos compartir información con:
          </p>
          <ul>
            <li>Proveedores de servicios que nos ayudan a operar la plataforma</li>
            <li>Autoridades cuando sea requerido por ley</li>
            <li>Entidades certificadoras cuando usted lo autorice</li>
          </ul>

          <h2>4. Seguridad</h2>
          <p>
            Implementamos medidas de seguridad técnicas y organizativas para proteger
            su información, incluyendo encriptación, control de acceso y auditorías
            regulares.
          </p>

          <h2>5. Sus Derechos</h2>
          <p>
            De acuerdo con la Ley Federal de Protección de Datos Personales en
            Posesión de los Particulares, usted tiene derecho a acceder, rectificar,
            cancelar y oponerse al tratamiento de sus datos personales (derechos ARCO).
          </p>

          <h2>6. Contacto</h2>
          <p>
            Para ejercer sus derechos o consultas sobre privacidad, contáctenos en:{" "}
            <a href="mailto:privacidad@avala.studio">privacidad@avala.studio</a>
          </p>
        </div>
      </div>
    </div>
  );
}
