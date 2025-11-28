"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  autocomplete,
  trackSearch,
  type AutocompleteResult,
} from "@/lib/api/renec";

interface SearchBoxProps {
  placeholder?: string;
  className?: string;
  defaultValue?: string;
  onSearch?: (query: string) => void;
  showAutocomplete?: boolean;
}

export function SearchBox({
  placeholder = "Buscar estándares, certificadores, centros...",
  className,
  defaultValue = "",
  onSearch,
  showAutocomplete = true,
}: SearchBoxProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState(defaultValue);
  const [results, setResults] = React.useState<AutocompleteResult | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Debounced autocomplete
  React.useEffect(() => {
    if (!showAutocomplete || query.length < 2) {
      setResults(null);
      setIsOpen(false);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await autocomplete(query, "all", 5);
        setResults(data);
        setIsOpen(true);
      } catch (error) {
        console.error("Autocomplete error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, showAutocomplete]);

  // Close on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpen(false);

    // Track the search
    trackSearch({
      query,
      searchType: "GENERAL",
      resultCount: results
        ? results.ec.length + results.certifiers.length + results.centers.length
        : 0,
    });

    if (onSearch) {
      onSearch(query);
    } else {
      router.push(`/explorar/estandares?q=${encodeURIComponent(query)}`);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults(null);
    inputRef.current?.focus();
  };

  const handleSelect = (type: "ec" | "certifier" | "center", id: string) => {
    setIsOpen(false);
    switch (type) {
      case "ec":
        router.push(`/explorar/estandares/${id}`);
        break;
      case "certifier":
        router.push(`/explorar/certificadores/${id}`);
        break;
      case "center":
        router.push(`/explorar/centros/${id}`);
        break;
    }
  };

  const hasResults =
    results &&
    (results.ec.length > 0 ||
      results.certifiers.length > 0 ||
      results.centers.length > 0);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => hasResults && setIsOpen(true)}
            placeholder={placeholder}
            className="h-12 w-full rounded-lg border border-input bg-background pl-10 pr-20 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button type="submit" size="sm" className="h-8">
              Buscar
            </Button>
          </div>
        </div>
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && hasResults && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border bg-popover p-2 shadow-lg">
          {/* EC Standards */}
          {results.ec.length > 0 && (
            <div className="mb-2">
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                Estándares de Competencia
              </div>
              {results.ec.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect("ec", item.id)}
                  className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                >
                  <span className="font-medium text-primary">{item.code}</span>
                  <span className="ml-2 text-muted-foreground line-clamp-1">
                    {item.title}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Certifiers */}
          {results.certifiers.length > 0 && (
            <div className="mb-2">
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                Certificadores
              </div>
              {results.certifiers.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect("certifier", item.id)}
                  className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                >
                  <span className="font-medium">{item.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {item.type} • {item.estado || "Sin ubicación"}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Centers */}
          {results.centers.length > 0 && (
            <div>
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                Centros de Evaluación
              </div>
              {results.centers.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect("center", item.id)}
                  className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                >
                  <span className="font-medium">{item.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {[item.municipio, item.estado].filter(Boolean).join(", ") ||
                      "Sin ubicación"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {isLoading && query.length >= 2 && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border bg-popover p-4 text-center text-sm text-muted-foreground shadow-lg">
          Buscando...
        </div>
      )}
    </div>
  );
}
