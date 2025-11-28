import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "AVALA transformó nuestra gestión de capacitación. Lo que antes nos tomaba semanas en Excel, ahora se genera automáticamente. El cumplimiento SIRCE dejó de ser una pesadilla.",
    author: "María González",
    role: "Directora de Recursos Humanos",
    company: "Grupo Industrial del Norte",
    rating: 5,
  },
  {
    quote:
      "Como ECE, el portafolio de evidencias siempre era un cuello de botella. Con AVALA, nuestros candidatos suben evidencias directamente y el paquete para SII se genera solo.",
    author: "Roberto Méndez",
    role: "Director de Operaciones",
    company: "Certifica México, S.C.",
    rating: 5,
  },
  {
    quote:
      "Las credenciales verificables han sido un diferenciador enorme. Nuestros egresados las comparten en LinkedIn y las empresas pueden verificar la autenticidad al instante.",
    author: "Laura Vega",
    role: "Coordinadora Académica",
    company: "Centro de Capacitación Profesional",
    rating: 5,
  },
];

const stats = [
  { value: "+10,000", label: "Certificaciones emitidas" },
  { value: "99.5%", label: "Disponibilidad" },
  { value: "<5 min", label: "Generación DC-3" },
  { value: "4.9/5", label: "Satisfacción cliente" },
];

export function Testimonials() {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Empresas que ya confían en AVALA
          </h2>
          <p className="text-lg text-muted-foreground">
            Descubre cómo organizaciones como la tuya han transformado su
            gestión de capacitación y cumplimiento.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="text-center p-6 rounded-lg bg-muted/50"
            >
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, i) => (
            <Card key={i} className="relative">
              <CardContent className="pt-8 pb-6">
                {/* Quote Icon */}
                <Quote className="absolute top-4 right-4 w-8 h-8 text-muted-foreground/20" />

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star
                      key={j}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-sm leading-relaxed mb-6">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-primary-foreground font-semibold text-sm">
                    {testimonial.author
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">
                      {testimonial.author}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {testimonial.role}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
