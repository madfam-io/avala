"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "¿AVALA genera DC-3 oficiales válidos ante la STPS?",
    answer:
      "Sí. AVALA genera constancias DC-3 con todos los campos requeridos por la STPS, incluyendo folio único y espacio para firmas. El documento cumple con el formato oficial y puede ser utilizado para cumplimiento laboral. La responsabilidad de las firmas y la información recae en el empleador, como indica la normativa.",
  },
  {
    question: "¿Cómo se integra con los Estándares de Competencia de CONOCER?",
    answer:
      "AVALA mantiene una base de datos actualizada de los 1,477 Estándares de Competencia publicados por CONOCER. Puedes buscar cualquier EC por código o título, importar su estructura (elementos y criterios), y mapear tu contenido formativo directamente a cada criterio. El Coverage Meter te muestra en tiempo real qué porcentaje del estándar cubres.",
  },
  {
    question: "¿Puedo migrar mis cursos existentes a AVALA?",
    answer:
      "Sí. AVALA soporta importación de contenido SCORM y xAPI. También puedes crear contenido nativo directamente en la plataforma. Nuestro equipo de implementación puede ayudarte con la migración y el mapeo a Estándares de Competencia.",
  },
  {
    question: "¿Las credenciales son verificables por terceros?",
    answer:
      "Absolutamente. Las credenciales emitidas por AVALA siguen el estándar Open Badges 3.0 / W3C Verifiable Credentials. Cualquier persona puede verificar la autenticidad de una credencial escaneando un código QR o visitando la URL de verificación pública. Esto incluye la alineación al EC, las evidencias asociadas y el estado de validez.",
  },
  {
    question: "¿Ofrecen implementación y capacitación?",
    answer:
      "Sí. Todos los planes incluyen onboarding guiado y documentación completa. Los planes Profesional y Enterprise incluyen sesiones de capacitación en vivo. Enterprise también incluye un Customer Success Manager dedicado para acompañarte en toda la implementación.",
  },
  {
    question: "¿Cómo funciona la prueba gratuita?",
    answer:
      "La prueba gratuita dura 14 días y te da acceso completo al plan Profesional. No requiere tarjeta de crédito para iniciar. Durante la prueba puedes crear cursos, evaluar competencias, generar DC-3 de prueba y explorar todas las funcionalidades. Al terminar, puedes elegir el plan que mejor se adapte a ti.",
  },
  {
    question: "¿Es seguro para datos de empleados?",
    answer:
      "La seguridad es nuestra prioridad. AVALA utiliza cifrado TLS 1.3 en tránsito y AES-256 en reposo. Implementamos Row Level Security para aislamiento multi-tenant, autenticación multi-factor opcional, y cumplimos con las mejores prácticas de seguridad de la industria. Todos los accesos quedan registrados en audit logs inmutables.",
  },
  {
    question: "¿Se integra con mi sistema de nómina/HRIS?",
    answer:
      "El plan Enterprise incluye integraciones HRIS via SCIM para provisioning automático de usuarios, SSO (SAML/OIDC) para autenticación centralizada, y API completa para sincronización bidireccional de datos. Soportamos integraciones con los principales sistemas de RH del mercado.",
  },
];

export function FAQ() {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Preguntas frecuentes
          </h2>
          <p className="text-lg text-muted-foreground">
            Respuestas a las dudas más comunes sobre AVALA y el cumplimiento de
            capacitación.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
