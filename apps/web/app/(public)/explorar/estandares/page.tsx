"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchBox } from "@/components/renec/search-box";
import { ECList } from "@/components/renec/ec-card";
import { Pagination } from "@/components/renec/pagination";
import {
  searchEC,
  getSectors,
  type ECStandard,
  type PaginationInfo,
  type ECSearchParams,
  type Sector,
} from "@/lib/api/renec";

export default function EstandaresPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [items, setItems] = useState<ECStandard[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Get current params
  const currentParams: ECSearchParams = {
    page: Number(searchParams.get("page")) || 1,
    q: searchParams.get("q") || undefined,
    vigente: (searchParams.get("vigente") as "true" | "false" | "all") || "all",
    sector: searchParams.get("sector") || undefined,
    nivelCompetencia: searchParams.get("nivel")
      ? Number(searchParams.get("nivel"))
      : undefined,
    sortBy:
      (searchParams.get("sortBy") as ECSearchParams["sortBy"]) || "ecClave",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "asc",
  };

  // Update URL params
  const updateParams = useCallback(
    (updates: Partial<ECSearchParams>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === "" || value === "all") {
          params.delete(key === "nivelCompetencia" ? "nivel" : key);
        } else {
          params.set(key === "nivelCompetencia" ? "nivel" : key, String(value));
        }
      });

      // Reset to page 1 when filters change
      if (!updates.page) {
        params.delete("page");
      }

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [ecData, sectorData] = await Promise.all([
          searchEC(currentParams),
          sectors.length === 0 ? getSectors() : Promise.resolve(sectors),
        ]);

        setItems(ecData.items);
        setPagination(ecData.pagination);
        if (sectors.length === 0) {
          setSectors(sectorData as Sector[]);
        }
      } catch (error) {
        console.error("Error fetching EC data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Active filters count
  const activeFilters = [
    currentParams.vigente !== "all" && currentParams.vigente,
    currentParams.sector,
    currentParams.nivelCompetencia,
  ].filter(Boolean).length;

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Estándares de Competencia</h1>
        <p className="mt-2 text-muted-foreground">
          Explora los estándares de competencia laboral registrados en CONOCER
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBox
              defaultValue={currentParams.q}
              onSearch={(q) => updateParams({ q, page: 1 })}
              showAutocomplete={false}
              placeholder="Buscar por código, título o contenido..."
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="shrink-0"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filtros
            {activeFilters > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilters}
              </Badge>
            )}
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Vigencia Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Vigencia
                </label>
                <select
                  value={currentParams.vigente}
                  onChange={(e) =>
                    updateParams({
                      vigente: e.target.value as "true" | "false" | "all",
                    })
                  }
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="true">Vigentes</option>
                  <option value="false">No vigentes</option>
                </select>
              </div>

              {/* Sector Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Sector</label>
                <select
                  value={currentParams.sector || ""}
                  onChange={(e) => updateParams({ sector: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Todos los sectores</option>
                  {sectors.map((s) => (
                    <option key={s.sector} value={s.sector}>
                      {s.sector} ({s.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Level Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Nivel de Competencia
                </label>
                <select
                  value={currentParams.nivelCompetencia || ""}
                  onChange={(e) =>
                    updateParams({
                      nivelCompetencia: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Todos los niveles</option>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <option key={level} value={level}>
                      Nivel {level}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Ordenar por
                </label>
                <select
                  value={`${currentParams.sortBy}-${currentParams.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split("-");
                    updateParams({
                      sortBy: sortBy as ECSearchParams["sortBy"],
                      sortOrder: sortOrder as "asc" | "desc",
                    });
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="ecClave-asc">Código (A-Z)</option>
                  <option value="ecClave-desc">Código (Z-A)</option>
                  <option value="titulo-asc">Título (A-Z)</option>
                  <option value="titulo-desc">Título (Z-A)</option>
                  <option value="fechaPublicacion-desc">Más recientes</option>
                  <option value="fechaPublicacion-asc">Más antiguos</option>
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {activeFilters > 0 && (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    updateParams({
                      vigente: "all",
                      sector: undefined,
                      nivelCompetencia: undefined,
                    })
                  }
                >
                  <X className="mr-2 h-4 w-4" />
                  Limpiar filtros
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Active filter badges */}
        {activeFilters > 0 && (
          <div className="flex flex-wrap gap-2">
            {currentParams.vigente === "true" && (
              <Badge variant="secondary">
                Vigentes
                <button
                  onClick={() => updateParams({ vigente: "all" })}
                  className="ml-1 hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {currentParams.vigente === "false" && (
              <Badge variant="secondary">
                No vigentes
                <button
                  onClick={() => updateParams({ vigente: "all" })}
                  className="ml-1 hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {currentParams.sector && (
              <Badge variant="secondary">
                {currentParams.sector}
                <button
                  onClick={() => updateParams({ sector: undefined })}
                  className="ml-1 hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {currentParams.nivelCompetencia && (
              <Badge variant="secondary">
                Nivel {currentParams.nivelCompetencia}
                <button
                  onClick={() => updateParams({ nivelCompetencia: undefined })}
                  className="ml-1 hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-lg border bg-card p-4 animate-pulse"
            >
              <div className="h-6 w-24 bg-muted rounded mb-2" />
              <div className="h-4 w-full bg-muted rounded mb-2" />
              <div className="h-4 w-3/4 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <ECList items={items} />

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                pagination={pagination}
                onPageChange={(page) => updateParams({ page })}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
