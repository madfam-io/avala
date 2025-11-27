"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ECStandard } from "@/lib/api/renec";

interface ECCardProps {
  ec: ECStandard;
  className?: string;
}

export function ECCard({ ec, className }: ECCardProps) {
  return (
    <Link
      href={`/explorar/estandares/${ec.id}`}
      className={cn(
        "group block rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/50",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* EC Code and Status */}
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-lg font-bold text-primary">
              {ec.ecClave}
            </span>
            {ec.vigente ? (
              <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
                <CheckCircle className="mr-1 h-3 w-3" />
                Vigente
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                <XCircle className="mr-1 h-3 w-3" />
                No vigente
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {ec.titulo}
          </h3>

          {/* Sector and Level */}
          <div className="mt-2 flex flex-wrap gap-2">
            {ec.sector && (
              <Badge variant="outline" className="text-xs">
                {ec.sector}
              </Badge>
            )}
            {ec.nivelCompetencia && (
              <Badge variant="outline" className="text-xs">
                Nivel {ec.nivelCompetencia}
              </Badge>
            )}
          </div>

          {/* Proposito preview */}
          {ec.proposito && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {ec.proposito}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground border-t pt-3">
        <div className="flex items-center gap-1">
          <Building2 className="h-4 w-4" />
          <span>{ec.certifierCount} certificadores</span>
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          <span>{ec.centerCount} centros</span>
        </div>
      </div>
    </Link>
  );
}

interface ECListProps {
  items: ECStandard[];
  className?: string;
}

export function ECList({ items, className }: ECListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No se encontraron estándares de competencia
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map((ec) => (
        <ECCard key={ec.id} ec={ec} />
      ))}
    </div>
  );
}
