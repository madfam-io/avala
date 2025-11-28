"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Flame, Calendar } from "lucide-react";

interface DailyActivity {
  activityDate: Date;
  pointsEarned: number;
}

interface StreakCalendarProps {
  activities: DailyActivity[];
  currentStreak: number;
  longestStreak: number;
}

export function StreakCalendar({
  activities,
  currentStreak,
  longestStreak,
}: StreakCalendarProps) {
  const today = new Date();
  const activitySet = new Set(
    activities.map((a) => new Date(a.activityDate).toDateString())
  );

  // Generate last 35 days (5 weeks)
  const days = Array.from({ length: 35 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (34 - i));
    return date;
  });

  // Group by week
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          Actividad Diaria
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Streak Stats */}
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/40">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{currentStreak}</p>
              <p className="text-xs text-muted-foreground">Racha actual</p>
            </div>
          </div>
          <div className="h-10 w-px bg-border" />
          <div>
            <p className="text-lg font-semibold">{longestStreak}</p>
            <p className="text-xs text-muted-foreground">Mejor racha</p>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-1">
          {/* Day labels */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {["L", "M", "M", "J", "V", "S", "D"].map((day, i) => (
              <div
                key={i}
                className="text-xs text-center text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {week.map((date, dayIndex) => {
                const isActive = activitySet.has(date.toDateString());
                const isToday = date.toDateString() === today.toDateString();
                const isFuture = date > today;

                return (
                  <div
                    key={dayIndex}
                    className={cn(
                      "aspect-square rounded-sm flex items-center justify-center text-xs transition-colors",
                      isFuture && "bg-transparent",
                      !isFuture && !isActive && "bg-muted",
                      isActive && "bg-green-500 text-white",
                      isToday && "ring-2 ring-primary ring-offset-1"
                    )}
                    title={`${date.toLocaleDateString("es-MX")}${isActive ? " - Activo" : ""}`}
                  >
                    {isActive && <Flame className="h-3 w-3" />}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-muted" />
            <span>Sin actividad</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            <span>Día activo</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
