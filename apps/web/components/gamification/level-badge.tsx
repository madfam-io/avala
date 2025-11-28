"use client";

import { cn } from "@/lib/utils";
import { Star, Crown, Shield, Gem, Award, Zap, Target, Rocket, Sparkles, Trophy } from "lucide-react";

interface LevelBadgeProps {
  level: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const LEVEL_CONFIG = [
  { name: "Novato", icon: Star, color: "bg-gray-100 text-gray-600 border-gray-300" },
  { name: "Aprendiz", icon: Shield, color: "bg-green-100 text-green-600 border-green-300" },
  { name: "Estudiante", icon: Target, color: "bg-blue-100 text-blue-600 border-blue-300" },
  { name: "Practicante", icon: Zap, color: "bg-cyan-100 text-cyan-600 border-cyan-300" },
  { name: "Competente", icon: Award, color: "bg-purple-100 text-purple-600 border-purple-300" },
  { name: "Profesional", icon: Gem, color: "bg-pink-100 text-pink-600 border-pink-300" },
  { name: "Experto", icon: Rocket, color: "bg-orange-100 text-orange-600 border-orange-300" },
  { name: "Maestro", icon: Sparkles, color: "bg-yellow-100 text-yellow-600 border-yellow-300" },
  { name: "Gran Maestro", icon: Crown, color: "bg-amber-100 text-amber-600 border-amber-400" },
  { name: "Leyenda", icon: Trophy, color: "bg-gradient-to-br from-yellow-200 to-orange-200 text-orange-700 border-orange-400" },
];

export function LevelBadge({
  level,
  size = "md",
  showLabel = false,
  className
}: LevelBadgeProps) {
  const config = LEVEL_CONFIG[Math.min(level - 1, LEVEL_CONFIG.length - 1)] || LEVEL_CONFIG[0];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-5 w-5",
    lg: "h-7 w-7",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "rounded-full border-2 flex items-center justify-center",
          sizeClasses[size],
          config.color
        )}
        title={`Nivel ${level}: ${config.name}`}
      >
        <Icon className={iconSizes[size]} />
      </div>
      {showLabel && (
        <div>
          <p className="font-medium text-sm">Nivel {level}</p>
          <p className="text-xs text-muted-foreground">{config.name}</p>
        </div>
      )}
    </div>
  );
}

// Compact inline badge
export function LevelBadgeInline({ level }: { level: number }) {
  const config = LEVEL_CONFIG[Math.min(level - 1, LEVEL_CONFIG.length - 1)] || LEVEL_CONFIG[0];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
        config.color
      )}
    >
      <Icon className="h-3 w-3" />
      Nv. {level}
    </span>
  );
}
