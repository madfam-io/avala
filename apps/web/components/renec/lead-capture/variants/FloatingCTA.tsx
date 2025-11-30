"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FloatingCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const pageHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercentage = (scrollY / pageHeight) * 100;

      if (scrollPercentage > 40 && !isDismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDismissed]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 animate-in slide-in-from-bottom-4 duration-300">
      <div className="relative rounded-lg border bg-card p-4 shadow-lg max-w-sm">
        <button
          onClick={() => {
            setIsVisible(false);
            setIsDismissed(true);
          }}
          className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="font-medium pr-6">¿Listo para certificarte?</p>
        <p className="text-sm text-muted-foreground mt-1 mb-3">
          Comienza tu prueba gratuita de 14 días.
        </p>
        <Button size="sm" className="w-full" asChild>
          <Link href="/demo">
            Comenzar gratis
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
