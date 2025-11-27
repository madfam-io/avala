"use client";

import { BookOpen, Building2, MapPin, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RenecStats } from "@/lib/api/renec";

interface StatsCardsProps {
  stats: RenecStats;
  className?: string;
}

export function StatsCards({ stats, className }: StatsCardsProps) {
  const cards = [
    {
      title: "Estándares de Competencia",
      value: stats.overview.ecStandards.active,
      total: stats.overview.ecStandards.total,
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Certificadores",
      value: stats.overview.certifiers.active,
      total: stats.overview.certifiers.total,
      icon: Building2,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Centros de Evaluación",
      value: stats.overview.centers.active,
      total: stats.overview.centers.total,
      icon: MapPin,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className={cn("grid gap-4 md:grid-cols-3", className)}>
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className={cn("rounded-lg p-3", card.bgColor)}>
              <card.icon className={cn("h-6 w-6", card.color)} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <p className="text-2xl font-bold">{card.value.toLocaleString()}</p>
              {card.total !== card.value && (
                <p className="text-xs text-muted-foreground">
                  de {card.total.toLocaleString()} totales
                </p>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Last sync info */}
      {stats.overview.lastSyncAt && (
        <div className="col-span-full flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3" />
          <span>
            Última actualización:{" "}
            {new Date(stats.overview.lastSyncAt).toLocaleDateString("es-MX", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      )}
    </div>
  );
}
