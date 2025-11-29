"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowRight, Sparkles, X } from "lucide-react";
import { RoleSwitcher, DemoRole } from "./role-switcher";
import { DEMO_TENANT } from "../_data/demo-seed";

interface DemoHeaderProps {
  currentRole: DemoRole;
}

export function DemoHeader({ currentRole }: DemoHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-primary to-blue-600 text-white px-4 py-2">
        <div className="container flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>
              <strong>Modo Demo</strong> — Explora Avala como{" "}
              <span className="underline underline-offset-2">
                {DEMO_TENANT.name}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/registro"
              className="hidden sm:flex items-center gap-1 hover:underline"
            >
              Iniciar prueba gratis
              <ArrowRight className="h-3 w-3" />
            </Link>
            <Link href="/" className="hover:opacity-80">
              <X className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container flex h-14 items-center justify-between">
        {/* Logo & Tenant */}
        <div className="flex items-center gap-4">
          <Link href="/demo" className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg hidden sm:inline">Avala</span>
          </Link>
          <div className="hidden md:flex items-center gap-2 pl-4 border-l">
            <span className="text-2xl">{DEMO_TENANT.logo}</span>
            <div>
              <div className="text-sm font-medium">{DEMO_TENANT.name}</div>
              <div className="text-xs text-muted-foreground">
                {DEMO_TENANT.industry}
              </div>
            </div>
          </div>
        </div>

        {/* Role Switcher */}
        <div className="flex items-center gap-4">
          <RoleSwitcher currentRole={currentRole} compact />
          <Button size="sm" asChild className="hidden sm:flex">
            <Link href="/registro">
              Prueba Gratis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
