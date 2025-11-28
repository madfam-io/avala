"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Trophy, Medal, Crown, Flame } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  points: number;
  level: number;
  streak: number;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  userRank?: {
    rank: number;
    points: number;
    level: number;
  };
  title?: string;
}

export function Leaderboard({
  entries,
  currentUserId,
  userRank,
  title = "Tabla de Líderes"
}: LeaderboardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.map((entry) => (
          <LeaderboardRow
            key={entry.userId}
            entry={entry}
            isCurrentUser={entry.userId === currentUserId}
          />
        ))}

        {/* Show current user if not in top entries */}
        {userRank && currentUserId && !entries.find(e => e.userId === currentUserId) && (
          <>
            <div className="flex items-center gap-2 py-2">
              <span className="text-xs text-muted-foreground">•••</span>
            </div>
            <LeaderboardRow
              entry={{
                rank: userRank.rank,
                userId: currentUserId,
                userName: "Tú",
                points: userRank.points,
                level: userRank.level,
                streak: 0,
              }}
              isCurrentUser={true}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function LeaderboardRow({
  entry,
  isCurrentUser
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}) {
  const initials = entry.userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-colors",
        isCurrentUser
          ? "bg-primary/10 border border-primary/20"
          : "hover:bg-muted/50",
        entry.rank <= 3 && "bg-gradient-to-r",
        entry.rank === 1 && "from-yellow-50 to-yellow-100/50 dark:from-yellow-950/20 dark:to-yellow-900/10",
        entry.rank === 2 && "from-gray-50 to-gray-100/50 dark:from-gray-950/20 dark:to-gray-900/10",
        entry.rank === 3 && "from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10"
      )}
    >
      {/* Rank */}
      <div className="w-8 flex justify-center">
        {entry.rank === 1 && <Crown className="h-6 w-6 text-yellow-500" />}
        {entry.rank === 2 && <Medal className="h-6 w-6 text-gray-400" />}
        {entry.rank === 3 && <Medal className="h-6 w-6 text-orange-400" />}
        {entry.rank > 3 && (
          <span className="text-lg font-bold text-muted-foreground">
            {entry.rank}
          </span>
        )}
      </div>

      {/* Avatar */}
      <Avatar className="h-10 w-10">
        <AvatarFallback className={cn(
          entry.rank === 1 && "bg-yellow-100 text-yellow-700",
          entry.rank === 2 && "bg-gray-100 text-gray-700",
          entry.rank === 3 && "bg-orange-100 text-orange-700",
          entry.rank > 3 && "bg-muted"
        )}>
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-medium truncate",
            isCurrentUser && "text-primary"
          )}>
            {entry.userName}
          </span>
          {isCurrentUser && (
            <Badge variant="outline" className="text-xs">
              Tú
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Nivel {entry.level}</span>
          {entry.streak > 0 && (
            <>
              <span>•</span>
              <span className="flex items-center gap-0.5">
                <Flame className="h-3 w-3 text-orange-500" />
                {entry.streak} días
              </span>
            </>
          )}
        </div>
      </div>

      {/* Points */}
      <div className="text-right">
        <p className="font-bold text-lg">{entry.points.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">puntos</p>
      </div>
    </div>
  );
}
