import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building2,
  BadgeCheck,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const segments = [
  {
    icon: Building2,
    title: "Para Empresas",
    subtitle: "Cumplimiento laboral sin complicaciones",
    description:
      "Automatiza la gestión de capacitación y cumplimiento DC-3 para todo tu personal. Prepara auditorías en minutos, no en días.",
    benefits: [
      "Automatiza DC-3 para todo tu personal",
      "Prepara auditorías STPS en minutos",
      "Dashboards de competencia por área",
      "Integración con tu HRIS",
    ],
    href: "/soluciones/empresas",
    color: "blue",
  },
  {
    icon: BadgeCheck,
    title: "Para Entidades Certificadoras",
    subtitle: "Gestiona candidatos y dictámenes",
    description:
      "Digitaliza el proceso de certificación EC. Desde el registro de candidatos hasta el paquete de dictamen listo para SII.",
    benefits: [
      "Registro y seguimiento de candidatos",
      "Portafolio de evidencias listo para SII",
      "Asignación de evaluadores",
      "Reportes de productividad",
    ],
    href: "/soluciones/ece",
    color: "purple",
  },
  {
    icon: GraduationCap,
    title: "Para Centros de Capacitación",
    subtitle: "Profesionaliza tu oferta formativa",
    description:
      "Ofrece cursos alineados a estándares oficiales y emite credenciales verificables que tus egresados pueden mostrar con orgullo.",
    benefits: [
      "Cursos alineados a estándares oficiales",
      "Credenciales verificables para egresados",
      "Gestión multi-sede",
      "Marca blanca disponible",
    ],
    href: "/soluciones/ccap",
    color: "green",
  },
];

const colorClasses = {
  blue: {
    iconBg: "bg-blue-100 dark:bg-blue-950",
    iconColor: "text-blue-600 dark:text-blue-400",
    hoverBorder: "hover:border-blue-300 dark:hover:border-blue-700",
  },
  purple: {
    iconBg: "bg-purple-100 dark:bg-purple-950",
    iconColor: "text-purple-600 dark:text-purple-400",
    hoverBorder: "hover:border-purple-300 dark:hover:border-purple-700",
  },
  green: {
    iconBg: "bg-green-100 dark:bg-green-950",
    iconColor: "text-green-600 dark:text-green-400",
    hoverBorder: "hover:border-green-300 dark:hover:border-green-700",
  },
};

export function AudienceSegments() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Diseñado para quienes capacitan
          </h2>
          <p className="text-lg text-muted-foreground">
            Ya seas una empresa, entidad certificadora o centro de capacitación,
            AVALA se adapta a tus necesidades específicas.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {segments.map((segment) => {
            const colors = colorClasses[segment.color as keyof typeof colorClasses];
            return (
              <Card
                key={segment.title}
                className={`group transition-all duration-300 hover:shadow-lg ${colors.hoverBorder}`}
              >
                <CardHeader>
                  <div
                    className={`w-12 h-12 rounded-lg ${colors.iconBg} flex items-center justify-center mb-4`}
                  >
                    <segment.icon className={`w-6 h-6 ${colors.iconColor}`} />
                  </div>
                  <CardTitle className="text-xl">{segment.title}</CardTitle>
                  <CardDescription>{segment.subtitle}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    {segment.description}
                  </p>

                  <ul className="space-y-2">
                    {segment.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant="outline"
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    asChild
                  >
                    <Link href={segment.href}>
                      Conocer solución
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
