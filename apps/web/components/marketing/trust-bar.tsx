import { Building2 } from "lucide-react";

// Placeholder for actual client logos
const placeholderLogos = [
  { name: "CONOCER Compatible", className: "text-primary" },
  { name: "STPS Validado", className: "text-primary" },
  { name: "Open Badges 3.0", className: "text-primary" },
  { name: "ISO 27001", className: "text-primary" },
];

export function TrustBar() {
  return (
    <section className="border-y bg-muted/30 py-8">
      <div className="container">
        <p className="text-center text-sm text-muted-foreground mb-6">
          Desarrollado para cumplir con los más altos estándares
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {placeholderLogos.map((logo) => (
            <div
              key={logo.name}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Building2 className="w-5 h-5" />
              <span className="text-sm font-medium">{logo.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
