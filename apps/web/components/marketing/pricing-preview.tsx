import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Starter",
    description: "Para equipos que inician",
    price: "$2,499",
    period: "MXN/mes",
    features: [
      "Hasta 50 usuarios",
      "Avala Learn completo",
      "Avala Assess completo",
      "5 estándares EC",
      "Soporte email",
    ],
    limitations: ["Sin DC-3 automático", "Sin credenciales"],
    cta: "Iniciar prueba",
    ctaVariant: "outline" as const,
    popular: false,
  },
  {
    name: "Profesional",
    description: "El más popular",
    price: "$6,999",
    period: "MXN/mes",
    features: [
      "Hasta 200 usuarios",
      "Todo de Starter",
      "DC-3 automático con folio",
      "Export SIRCE validado",
      "Credenciales OBv3",
      "API de lectura",
      "Soporte prioritario",
    ],
    limitations: [],
    cta: "Iniciar prueba",
    ctaVariant: "default" as const,
    popular: true,
  },
  {
    name: "Enterprise",
    description: "Para grandes organizaciones",
    price: "Personalizado",
    period: "",
    features: [
      "Usuarios ilimitados",
      "Todo de Profesional",
      "SSO/SCIM",
      "API completa",
      "Multi-sede",
      "Marca blanca",
      "SLA 99.9%",
      "CSM dedicado",
    ],
    limitations: [],
    cta: "Contactar ventas",
    ctaVariant: "outline" as const,
    popular: false,
  },
];

export function PricingPreview() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Precios simples, valor claro
          </h2>
          <p className="text-lg text-muted-foreground">
            Elige el plan que mejor se adapte a tu organización. Todos incluyen
            prueba gratuita de 14 días.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${
                plan.popular
                  ? "border-primary shadow-lg scale-105 md:scale-110"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Más popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Price */}
                <div className="text-center">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground ml-1">
                      {plan.period}
                    </span>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {plan.limitations.map((limitation, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span className="w-4 h-4 shrink-0 mt-0.5 text-center">
                        ✗
                      </span>
                      <span>{limitation}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  variant={plan.ctaVariant}
                  className="w-full"
                  asChild
                >
                  <Link
                    href={plan.name === "Enterprise" ? "/contacto" : "/registro"}
                  >
                    {plan.cta}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All */}
        <div className="text-center mt-12">
          <Button variant="link" asChild>
            <Link href="/precios">
              Ver comparativa completa de planes
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
