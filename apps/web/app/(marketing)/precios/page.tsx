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
import {
  CheckCircle2,
  ArrowRight,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const plans = [
  {
    name: "Starter",
    description: "Para equipos que inician con capacitación formal",
    price: "$2,499",
    period: "MXN/mes",
    annualPrice: "$1,999",
    features: [
      { text: "Hasta 50 usuarios activos", included: true },
      { text: "Avala Learn completo", included: true },
      { text: "Avala Assess completo", included: true },
      { text: "5 estándares EC", included: true },
      { text: "Reportes básicos", included: true },
      { text: "Soporte por email", included: true },
      { text: "DC-3 automático", included: false },
      { text: "Credenciales OBv3", included: false },
      { text: "SSO/SCIM", included: false },
    ],
    cta: "Iniciar prueba gratis",
    href: "/registro",
    popular: false,
  },
  {
    name: "Profesional",
    description: "El más popular para empresas en crecimiento",
    price: "$6,999",
    period: "MXN/mes",
    annualPrice: "$5,599",
    features: [
      { text: "Hasta 200 usuarios activos", included: true },
      { text: "Todo de Starter", included: true },
      { text: "DC-3 automático con folio", included: true },
      { text: "Export SIRCE validado", included: true },
      { text: "Credenciales Open Badge 3.0", included: true },
      { text: "API de lectura", included: true },
      { text: "Reportes avanzados", included: true },
      { text: "Soporte prioritario", included: true },
      { text: "SSO/SCIM", included: false },
    ],
    cta: "Iniciar prueba gratis",
    href: "/registro",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "Para grandes organizaciones con necesidades avanzadas",
    price: "Personalizado",
    period: "",
    annualPrice: "",
    features: [
      { text: "Usuarios ilimitados", included: true },
      { text: "Todo de Profesional", included: true },
      { text: "SSO (SAML, OIDC)", included: true },
      { text: "SCIM provisioning", included: true },
      { text: "API completa (lectura/escritura)", included: true },
      { text: "Multi-sede", included: true },
      { text: "Marca blanca", included: true },
      { text: "SLA 99.9%", included: true },
      { text: "Customer Success Manager", included: true },
    ],
    cta: "Contactar ventas",
    href: "/contacto",
    popular: false,
  },
];

const faqs = [
  {
    question: "¿Qué incluye la prueba gratuita?",
    answer:
      "La prueba gratuita de 14 días incluye acceso completo a todas las funcionalidades del plan que elijas. No se requiere tarjeta de crédito y puedes cancelar en cualquier momento.",
  },
  {
    question: "¿Puedo cambiar de plan después?",
    answer:
      "Sí, puedes cambiar de plan en cualquier momento. Si subes de plan, el cambio es inmediato. Si bajas de plan, el cambio se aplica al siguiente ciclo de facturación.",
  },
  {
    question: "¿Qué métodos de pago aceptan?",
    answer:
      "Aceptamos tarjetas de crédito/débito (Visa, Mastercard, American Express), transferencia bancaria y facturación empresarial para planes Enterprise.",
  },
  {
    question: "¿Ofrecen descuentos para ONGs o educación?",
    answer:
      "Sí, ofrecemos descuentos especiales para organizaciones sin fines de lucro, instituciones educativas y gobierno. Contáctanos para más información.",
  },
  {
    question: "¿Qué pasa con mis datos si cancelo?",
    answer:
      "Si cancelas, tienes 30 días para exportar tus datos. Después de ese período, los datos se eliminan de forma segura según nuestra política de privacidad.",
  },
];

export default function PreciosPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50/50 via-background to-background dark:from-blue-950/20 py-16 md:py-24">
        <div className="container text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Precios simples y transparentes
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Elige el plan que mejor se adapte a tu organización. Todos incluyen
            prueba gratuita de 14 días sin compromiso.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="container py-12 -mt-8">
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${
                plan.popular
                  ? "border-primary shadow-lg scale-105 z-10"
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

              <CardContent className="flex-1 flex flex-col">
                {/* Price */}
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground ml-1">
                      {plan.period}
                    </span>
                  )}
                  {plan.annualPrice && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {plan.annualPrice}/mes facturado anual
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 flex-1">
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      className={`flex items-start gap-2 text-sm ${
                        !feature.included ? "text-muted-foreground" : ""
                      }`}
                    >
                      {feature.included ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      ) : (
                        <span className="w-4 h-4 shrink-0 mt-0.5 text-center">
                          ✗
                        </span>
                      )}
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  variant={plan.popular ? "default" : "outline"}
                  className="w-full mt-6"
                  asChild
                >
                  <Link href={plan.href}>
                    {plan.cta}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <HelpCircle className="w-10 h-10 mx-auto mb-4 text-primary" />
            <h2 className="text-3xl font-bold mb-4">Preguntas frecuentes</h2>
            <p className="text-muted-foreground">
              ¿Tienes dudas? Aquí encontrarás las respuestas más comunes.
            </p>
          </div>

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
      </section>

      {/* CTA */}
      <section className="container py-16">
        <div className="text-center bg-muted/50 rounded-2xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            ¿Necesitas algo personalizado?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Nuestro equipo puede ayudarte a diseñar una solución a la medida de
            tu organización.
          </p>
          <Button size="lg" asChild>
            <Link href="/contacto">
              Hablar con ventas
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
