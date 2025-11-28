"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Flame, Star, Target } from "lucide-react";

interface UserProgressProps {
  totalPoints: number;
  level: number;
  pointsToNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  achievementsUnlocked: number;
  totalAchievements: number;
}

export function UserProgressCard({
  totalPoints,
  level,
  pointsToNextLevel,
  currentStreak,
  longestStreak,
  achievementsUnlocked,
  totalAchievements,
}: UserProgressProps) {
  const levelProgress = pointsToNextLevel > 0
    ? ((getLevelThreshold(level) - pointsToNextLevel) / getLevelThreshold(level)) * 100
    : 100;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Tu Progreso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Level and Points */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-lg px-3 py-1">
                Nivel {level}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {totalPoints.toLocaleString()} puntos
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {pointsToNextLevel > 0
                ? `${pointsToNextLevel} para nivel ${level + 1}`
                : "Nivel máximo"
              }
            </span>
          </div>
          <Progress value={levelProgress} className="h-3" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Current Streak */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
            <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/40">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{currentStreak}</p>
              <p className="text-xs text-muted-foreground">Racha actual</p>
            </div>
          </div>

          {/* Longest Streak */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/40">
              <Star className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{longestStreak}</p>
              <p className="text-xs text-muted-foreground">Mejor racha</p>
            </div>
          </div>

          {/* Achievements */}
          <div className="col-span-2 flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/40">
              <Target className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Logros desbloqueados</p>
                <span className="text-sm font-medium">
                  {achievementsUnlocked}/{totalAchievements}
                </span>
              </div>
              <Progress
                value={(achievementsUnlocked / totalAchievements) * 100}
                className="h-2 mt-1"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to get level threshold
function getLevelThreshold(level: number): number {
  const thresholds = [0, 100, 250, 500, 850, 1300, 1850, 2500, 3250, 4100, 5000];
  return thresholds[level] || thresholds[thresholds.length - 1];
}
