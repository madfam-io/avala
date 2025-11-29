"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ExternalLink,
  Users,
  FileText,
  Building2,
  ArrowRight,
} from "lucide-react";

// Sample EC data for the demo (coverage is deterministic to avoid hydration mismatch)
const sampleECs = [
  {
    code: "EC0217.01",
    title: "Impartición de cursos de formación del capital humano",
    certifiers: 371,
    coverage: 82,
  },
  {
    code: "EC0301",
    title: "Diseño de cursos de formación del capital humano",
    certifiers: 245,
    coverage: 75,
  },
  {
    code: "EC0366",
    title: "Desarrollo de cursos de formación en línea",
    certifiers: 156,
    coverage: 68,
  },
  {
    code: "EC0076",
    title: "Evaluación de la competencia de candidatos",
    certifiers: 452,
    coverage: 91,
  },
];

const stats = [
  { value: "1,477", label: "Estándares EC", icon: FileText },
  { value: "482", label: "Entidades Certificadoras", icon: Building2 },
  { value: "581", label: "Comités de Gestión", icon: Users },
];

export function ECHighlight() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  const filteredECs = sampleECs.filter(
    (ec) =>
      ec.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ec.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <div className="space-y-8">
            <div>
              <Badge variant="outline" className="mb-4">
                Base de datos actualizada
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Nativo para <span className="text-primary">CONOCER</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Accede a la base de datos más completa de Estándares de
                Competencia de México. Busca, explora y alinea tu formación a
                los criterios oficiales.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="text-center p-4 rounded-lg bg-muted/50"
                >
                  <stat.icon className="w-5 h-5 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <Button asChild>
              <Link href="/explorar">
                Explorar estándares
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>

          {/* Right: Interactive Demo */}
          <div className="relative">
            <div className="rounded-xl border bg-background shadow-lg overflow-hidden">
              {/* Search Header */}
              <div className="p-4 border-b bg-muted/30">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar estándar... ej: EC0217"
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowResults(e.target.value.length > 0);
                    }}
                    onFocus={() => setShowResults(searchQuery.length > 0)}
                  />
                </div>
              </div>

              {/* Results */}
              <div className="divide-y max-h-[300px] overflow-y-auto">
                {(showResults ? filteredECs : sampleECs).map((ec) => (
                  <div
                    key={ec.code}
                    className="p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-semibold text-primary">
                            {ec.code}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            Vigente
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {ec.title}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-semibold">
                          {ec.certifiers}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          certificadores
                        </div>
                      </div>
                    </div>

                    {/* Coverage Meter */}
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full"
                          style={{ width: `${ec.coverage}%` }}
                        />
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 border-t bg-muted/30 text-center">
                <Link
                  href="/explorar"
                  className="text-sm text-primary hover:underline inline-flex items-center"
                >
                  Ver todos los estándares
                  <ArrowRight className="ml-1 w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Decoration */}
            <div className="absolute -z-10 -top-4 -right-4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
