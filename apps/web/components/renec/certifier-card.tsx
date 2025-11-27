"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, BookOpen, Phone, Mail, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Certifier } from "@/lib/api/renec";

interface CertifierCardProps {
  certifier: Certifier;
  className?: string;
}

export function CertifierCard({ certifier, className }: CertifierCardProps) {
  return (
    <Link
      href={`/explorar/certificadores/${certifier.id}`}
      className={cn(
        "group block rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/50",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            "rounded-lg p-3 shrink-0",
            certifier.tipo === "ECE" ? "bg-blue-50" : "bg-purple-50"
          )}
        >
          <Building2
            className={cn(
              "h-6 w-6",
              certifier.tipo === "ECE" ? "text-blue-600" : "text-purple-600"
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* Type and Status */}
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="outline"
              className={cn(
                certifier.tipo === "ECE"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-purple-200 bg-purple-50 text-purple-700"
              )}
            >
              {certifier.tipo}
            </Badge>
            {certifier.activo ? (
              <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
                Activo
              </Badge>
            ) : (
              <Badge variant="secondary">Inactivo</Badge>
            )}
          </div>

          {/* Name */}
          <h3 className="font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {certifier.razonSocial}
          </h3>

          {certifier.nombreComercial && certifier.nombreComercial !== certifier.razonSocial && (
            <p className="text-sm text-muted-foreground">{certifier.nombreComercial}</p>
          )}

          {/* Location */}
          {certifier.estado && (
            <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{certifier.estado}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground border-t pt-3">
        <div className="flex items-center gap-1">
          <BookOpen className="h-4 w-4" />
          <span>{certifier.ecCount} estándares</span>
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          <span>{certifier.centerCount} centros</span>
        </div>
      </div>

      {/* Contact info preview */}
      {(certifier.telefono || certifier.email || certifier.sitioWeb) && (
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {certifier.telefono && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {certifier.telefono}
            </span>
          )}
          {certifier.email && (
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {certifier.email}
            </span>
          )}
          {certifier.sitioWeb && (
            <span className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              Sitio web
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

interface CertifierListProps {
  items: Certifier[];
  className?: string;
}

export function CertifierList({ items, className }: CertifierListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No se encontraron certificadores
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4 md:grid-cols-2", className)}>
      {items.map((certifier) => (
        <CertifierCard key={certifier.id} certifier={certifier} />
      ))}
    </div>
  );
}
