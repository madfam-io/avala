"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const productItems = [
  {
    title: "Avala Learn",
    href: "/producto/learn",
    description: "Rutas de aprendizaje alineadas a EC",
  },
  {
    title: "Avala Assess",
    href: "/producto/assess",
    description: "Evaluación multi-método por criterio",
  },
  {
    title: "Avala Comply",
    href: "/producto/comply",
    description: "DC-3, SIRCE y Plan LFT automáticos",
  },
  {
    title: "Avala Badges",
    href: "/producto/badges",
    description: "Credenciales verificables Open Badges 3.0",
  },
  {
    title: "Avala Connect",
    href: "/producto/connect",
    description: "SSO, SCIM e integraciones HRIS",
  },
];

const solutionItems = [
  {
    title: "Para Empresas",
    href: "/soluciones/empresas",
    description: "Cumplimiento laboral sin complicaciones",
  },
  {
    title: "Para ECE/OC",
    href: "/soluciones/ece",
    description: "Gestiona candidatos y dictámenes",
  },
  {
    title: "Para Centros de Capacitación",
    href: "/soluciones/ccap",
    description: "Profesionaliza tu oferta formativa",
  },
];

const resourceItems = [
  { title: "Blog", href: "/blog", description: "Artículos y novedades" },
  {
    title: "Guías DC-3",
    href: "/recursos/guias-dc3",
    description: "Todo sobre cumplimiento laboral",
  },
  {
    title: "Explorar EC",
    href: "/explorar",
    description: "Navega los Estándares de Competencia",
  },
  {
    title: "API Docs",
    href: "/docs/api",
    description: "Documentación para desarrolladores",
  },
];

export function MarketingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            AVALA
          </span>
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList>
            {/* Producto */}
            <NavigationMenuItem>
              <NavigationMenuTrigger>Producto</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[500px] gap-3 p-4 md:grid-cols-2">
                  {productItems.map((item) => (
                    <ListItem
                      key={item.title}
                      title={item.title}
                      href={item.href}
                    >
                      {item.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Soluciones */}
            <NavigationMenuItem>
              <NavigationMenuTrigger>Soluciones</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4">
                  {solutionItems.map((item) => (
                    <ListItem
                      key={item.title}
                      title={item.title}
                      href={item.href}
                    >
                      {item.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Precios */}
            <NavigationMenuItem>
              <Link href="/precios" legacyBehavior passHref>
                <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                  Precios
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            {/* Recursos */}
            <NavigationMenuItem>
              <NavigationMenuTrigger>Recursos</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4">
                  {resourceItems.map((item) => (
                    <ListItem
                      key={item.title}
                      title={item.title}
                      href={item.href}
                    >
                      {item.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Iniciar sesión</Link>
          </Button>
          <Button asChild>
            <Link href="/registro">Prueba gratis</Link>
          </Button>
        </div>

        {/* Mobile Menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-[400px]">
            <div className="flex flex-col space-y-6 mt-6">
              {/* Mobile Product */}
              <MobileNavSection title="Producto" items={productItems} />
              <MobileNavSection title="Soluciones" items={solutionItems} />
              <Link
                href="/precios"
                className="text-lg font-medium"
                onClick={() => setMobileOpen(false)}
              >
                Precios
              </Link>
              <MobileNavSection title="Recursos" items={resourceItems} />

              <div className="pt-6 border-t space-y-3">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/login">Iniciar sesión</Link>
                </Button>
                <Button className="w-full" asChild>
                  <Link href="/registro">Prueba gratis</Link>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

function ListItem({
  className,
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"a"> & { href: string }) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

function MobileNavSection({
  title,
  items,
}: {
  title: string;
  items: { title: string; href: string; description: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-lg font-medium"
      >
        {title}
        <ChevronDown
          className={cn(
            "h-5 w-5 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="mt-2 ml-4 space-y-2">
          {items.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="block text-muted-foreground hover:text-foreground py-1"
            >
              {item.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
