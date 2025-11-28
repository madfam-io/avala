"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Trophy, Lock, Star, Flame, BookOpen, FileText, Award, Zap } from "lucide-react";

interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  icon: string;
  points: number;
  unlocked: boolean;
  unlockedAt?: Date;
}

interface AchievementsGridProps {
  achievements: Achievement[];
  showLocked?: boolean;
  compact?: boolean;
}

const RARITY_COLORS = {
  common: "bg-gray-100 border-gray-300 text-gray-700",
  rare: "bg-blue-100 border-blue-400 text-blue-700",
  epic: "bg-purple-100 border-purple-400 text-purple-700",
  legendary: "bg-yellow-100 border-yellow-400 text-yellow-700",
};

const RARITY_LABELS = {
  common: "Común",
  rare: "Raro",
  epic: "Épico",
  legendary: "Legendario",
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  first_steps: <Star className="h-4 w-4" />,
  streaks: <Flame className="h-4 w-4" />,
  learning: <BookOpen className="h-4 w-4" />,
  documents: <FileText className="h-4 w-4" />,
  mastery: <Award className="h-4 w-4" />,
  performance: <Zap className="h-4 w-4" />,
};

export function AchievementsGrid({
  achievements,
  showLocked = true,
  compact = false
}: AchievementsGridProps) {
  const displayAchievements = showLocked
    ? achievements
    : achievements.filter(a => a.unlocked);

  // Group by category
  const grouped = displayAchievements.reduce((acc, achievement) => {
    const category = achievement.category || "other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {displayAchievements.slice(0, 6).map((achievement) => (
          <AchievementBadge key={achievement.id} achievement={achievement} />
        ))}
        {displayAchievements.length > 6 && (
          <Badge variant="outline" className="text-xs">
            +{displayAchievements.length - 6} más
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, categoryAchievements]) => (
        <div key={category}>
          <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
            {CATEGORY_ICONS[category] || <Trophy className="h-4 w-4" />}
            {getCategoryLabel(category)}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryAchievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <Card
      className={cn(
        "transition-all duration-200",
        achievement.unlocked
          ? "border-2 " + RARITY_COLORS[achievement.rarity]
          : "opacity-60 grayscale"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            achievement.unlocked
              ? "bg-primary/10"
              : "bg-muted"
          )}>
            {achievement.unlocked ? (
              <Trophy className="h-6 w-6 text-primary" />
            ) : (
              <Lock className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm truncate">{achievement.title}</h4>
              <Badge variant="outline" className="text-xs shrink-0">
                +{achievement.points}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {achievement.description}
            </p>
            {achievement.unlocked && achievement.unlockedAt && (
              <p className="text-xs text-green-600 mt-2">
                Desbloqueado {formatDate(achievement.unlockedAt)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <Badge
            variant="secondary"
            className={cn("text-xs", RARITY_COLORS[achievement.rarity])}
          >
            {RARITY_LABELS[achievement.rarity]}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function AchievementBadge({ achievement }: { achievement: Achievement }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs",
        achievement.unlocked
          ? RARITY_COLORS[achievement.rarity]
          : "bg-muted text-muted-foreground"
      )}
      title={achievement.description}
    >
      {achievement.unlocked ? (
        <Trophy className="h-3 w-3" />
      ) : (
        <Lock className="h-3 w-3" />
      )}
      {achievement.title}
    </div>
  );
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    first_steps: "Primeros Pasos",
    streaks: "Rachas",
    learning: "Aprendizaje",
    documents: "Documentos",
    mastery: "Maestría",
    performance: "Rendimiento",
    other: "Otros",
  };
  return labels[category] || category;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}
