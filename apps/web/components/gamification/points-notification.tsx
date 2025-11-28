"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Star, Trophy, Flame, Zap } from "lucide-react";

interface PointsNotificationProps {
  points: number;
  reason?: string;
  type?: "points" | "achievement" | "streak" | "levelUp";
  onComplete?: () => void;
}

export function PointsNotification({
  points,
  reason,
  type = "points",
  onComplete,
}: PointsNotificationProps) {
  const [visible, setVisible] = useState(true);
  const [animating, setAnimating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimating(false);
      setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 300);
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  const Icon = {
    points: Star,
    achievement: Trophy,
    streak: Flame,
    levelUp: Zap,
  }[type];

  const colors = {
    points: "from-yellow-400 to-orange-500",
    achievement: "from-purple-400 to-pink-500",
    streak: "from-orange-400 to-red-500",
    levelUp: "from-blue-400 to-cyan-500",
  }[type];

  return (
    <div
      className={cn(
        "fixed top-20 right-4 z-50 transition-all duration-300",
        animating ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg",
          "bg-gradient-to-r text-white",
          colors
        )}
      >
        <div className="p-2 bg-white/20 rounded-full">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-bold text-lg">+{points} puntos</p>
          {reason && <p className="text-sm text-white/80">{reason}</p>}
        </div>
      </div>
    </div>
  );
}

// Hook to manage notifications queue
export function usePointsNotifications() {
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      points: number;
      reason?: string;
      type?: "points" | "achievement" | "streak" | "levelUp";
    }>
  >([]);

  const showNotification = (
    points: number,
    reason?: string,
    type?: "points" | "achievement" | "streak" | "levelUp"
  ) => {
    const id = Math.random().toString(36).slice(2);
    setNotifications((prev) => [...prev, { id, points, reason, type }]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return {
    notifications,
    showNotification,
    removeNotification,
  };
}

// Component to render all notifications
export function PointsNotificationsContainer({
  notifications,
  onRemove,
}: {
  notifications: Array<{
    id: string;
    points: number;
    reason?: string;
    type?: "points" | "achievement" | "streak" | "levelUp";
  }>;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{ transform: `translateY(${index * 70}px)` }}
        >
          <PointsNotification
            points={notification.points}
            reason={notification.reason}
            type={notification.type}
            onComplete={() => onRemove(notification.id)}
          />
        </div>
      ))}
    </div>
  );
}
