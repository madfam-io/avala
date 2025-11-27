"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MapPin, BookOpen, Phone, Mail, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Center, CenterWithDistance } from "@/lib/api/renec";

interface CenterCardProps {
  center: Center | CenterWithDistance;
  className?: string;
  showDistance?: boolean;
}

function hasDistance(center: Center | CenterWithDistance): center is CenterWithDistance {
  return "distance" in center;
}

export function CenterCard({ center, className, showDistance = false }: CenterCardProps) {
  return (
    <Link
      href={`/explorar/centros/${center.id}`}
      className={cn(
        "group block rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/50",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="rounded-lg bg-orange-50 p-3 shrink-0">
          <MapPin className="h-6 w-6 text-orange-600" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Status and Distance */}
          <div className="flex items-center gap-2 mb-1">
            {center.activo ? (
              <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
                Activo
              </Badge>
            ) : (
              <Badge variant="secondary">Inactivo</Badge>
            )}
            {showDistance && hasDistance(center) && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Navigation className="h-3 w-3" />
                {center.distance} km
              </Badge>
            )}
          </div>

          {/* Name */}
          <h3 className="font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {center.nombre}
          </h3>

          {/* Location */}
          <div className="mt-2 text-sm text-muted-foreground">
            {center.municipio && <span>{center.municipio}, </span>}
            {center.estado && <span>{center.estado}</span>}
          </div>

          {/* Address */}
          {center.direccion && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {center.direccion}
            </p>
          )}

          {/* Certifier */}
          {center.certifier && (
            <p className="mt-2 text-xs text-muted-foreground">
              <span className="font-medium">{center.certifier.tipo}:</span>{" "}
              {center.certifier.razonSocial}
            </p>
          )}
        </div>
      </div>

      {/* Stats and Contact */}
      <div className="mt-4 flex items-center justify-between gap-4 text-sm text-muted-foreground border-t pt-3">
        <div className="flex items-center gap-1">
          <BookOpen className="h-4 w-4" />
          <span>{center.ecCount} estándares</span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {center.telefono && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {center.telefono}
            </span>
          )}
          {center.email && (
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              Contacto
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

interface CenterListProps {
  items: (Center | CenterWithDistance)[];
  className?: string;
  showDistance?: boolean;
}

export function CenterList({ items, className, showDistance = false }: CenterListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No se encontraron centros de evaluación
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4 md:grid-cols-2", className)}>
      {items.map((center) => (
        <CenterCard key={center.id} center={center} showDistance={showDistance} />
      ))}
    </div>
  );
}
