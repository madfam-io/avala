import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowLeft } from "lucide-react";

const services = [
  { name: "API Principal", status: "operational" },
  { name: "Aplicación Web", status: "operational" },
  { name: "Base de Datos", status: "operational" },
  { name: "Autenticación", status: "operational" },
  { name: "Generación DC-3", status: "operational" },
  { name: "Credenciales OBv3", status: "operational" },
];

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/50 via-background to-background dark:from-green-950/20">
      <div className="container py-16 md:py-24 max-w-3xl">
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Todos los sistemas operativos
          </h1>
          <p className="text-muted-foreground">
            Última actualización: {new Date().toLocaleDateString("es-MX", {
              dateStyle: "long",
            })} {new Date().toLocaleTimeString("es-MX", { timeStyle: "short" })}
          </p>
        </div>

        <div className="space-y-3 mb-12">
          {services.map((service) => (
            <div
              key={service.name}
              className="flex items-center justify-between p-4 rounded-lg border bg-card"
            >
              <span className="font-medium">{service.name}</span>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">Operativo</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 w-4 h-4" />
              Volver al inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
