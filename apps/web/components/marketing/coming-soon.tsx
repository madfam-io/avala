import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Construction, ArrowLeft, Bell } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description?: string;
  backLink?: string;
  backLabel?: string;
}

export function ComingSoon({
  title,
  description = "Estamos trabajando en esta sección. Pronto estará disponible.",
  backLink = "/",
  backLabel = "Volver al inicio",
}: ComingSoonProps) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="container max-w-2xl text-center py-16">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Construction className="w-8 h-8 text-primary" />
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-4">{title}</h1>

        <p className="text-lg text-muted-foreground mb-8">{description}</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" asChild>
            <Link href={backLink}>
              <ArrowLeft className="mr-2 w-4 h-4" />
              {backLabel}
            </Link>
          </Button>
          <Button asChild>
            <Link href="/registro">
              <Bell className="mr-2 w-4 h-4" />
              Notificarme cuando esté listo
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
