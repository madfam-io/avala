"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchBox } from "@/components/renec/search-box";
import { CertifierList } from "@/components/renec/certifier-card";
import { Pagination } from "@/components/renec/pagination";
import {
  searchCertifiers,
  getEstados,
  type Certifier,
  type PaginationInfo,
  type CertifierSearchParams,
  type Estado,
} from "@/lib/api/renec";

function CertificadoresContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [items, setItems] = useState<Certifier[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Get current params
  const currentParams: CertifierSearchParams = {
    page: Number(searchParams.get("page")) || 1,
    q: searchParams.get("q") || undefined,
    tipo: (searchParams.get("tipo") as "ECE" | "OC" | "all") || "all",
    activo: (searchParams.get("activo") as "true" | "false" | "all") || "true",
    estado: searchParams.get("estado") || undefined,
    ecCode: searchParams.get("ecCode") || undefined,
    sortBy:
      (searchParams.get("sortBy") as CertifierSearchParams["sortBy"]) ||
      "razonSocial",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "asc",
  };

  // Update URL params
  const updateParams = useCallback(
    (updates: Partial<CertifierSearchParams>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === "" || value === "all") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      // Reset to page 1 when filters change
      if (!updates.page) {
        params.delete("page");
      }

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [certData, estadoData] = await Promise.all([
          searchCertifiers(currentParams),
          estados.length === 0 ? getEstados() : Promise.resolve(estados),
        ]);

        setItems(certData.items);
        setPagination(certData.pagination);
        if (estados.length === 0) {
          setEstados(estadoData as Estado[]);
        }
      } catch (error) {
        console.error("Error fetching certifier data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Active filters count
  const activeFilters = [
    currentParams.tipo !== "all" && currentParams.tipo,
    currentParams.activo !== "true" && currentParams.activo,
    currentParams.estado,
    currentParams.ecCode,
  ].filter(Boolean).length;

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Certificadores</h1>
        <p className="mt-2 text-muted-foreground">
          Entidades de Certificación y Evaluación (ECE) y Organismos
          Certificadores (OC) autorizados por CONOCER
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
              placeholder="Buscar por nombre, RFC..."
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
              {/* Tipo Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo</label>
                <select
                  value={currentParams.tipo}
                  onChange={(e) =>
                    updateParams({
                      tipo: e.target.value as "ECE" | "OC" | "all",
                    })
                  }
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="ECE">ECE - Entidad de Certificación</option>
                  <option value="OC">OC - Organismo Certificador</option>
                </select>
              </div>

              {/* Estado Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Estado</label>
                <select
                  value={currentParams.estado || ""}
                  onChange={(e) => updateParams({ estado: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Todos los estados</option>
                  {estados.map((e) => (
                    <option key={e.estado} value={e.estado}>
                      {e.estado} ({e.certifiers})
                    </option>
                  ))}
                </select>
              </div>

              {/* Activo Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Estatus
                </label>
                <select
                  value={currentParams.activo}
                  onChange={(e) =>
                    updateParams({
                      activo: e.target.value as "true" | "false" | "all",
                    })
                  }
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                  <option value="all">Todos</option>
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
                      sortBy: sortBy as CertifierSearchParams["sortBy"],
                      sortOrder: sortOrder as "asc" | "desc",
                    });
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="razonSocial-asc">Nombre (A-Z)</option>
                  <option value="razonSocial-desc">Nombre (Z-A)</option>
                  <option value="estado-asc">Estado (A-Z)</option>
                  <option value="estado-desc">Estado (Z-A)</option>
                  <option value="lastSyncedAt-desc">Más recientes</option>
                </select>
              </div>
            </div>

            {/* EC Code Filter */}
            {currentParams.ecCode && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  Mostrando certificadores para:{" "}
                  <Badge variant="outline">{currentParams.ecCode}</Badge>
                </p>
              </div>
            )}

            {/* Clear Filters */}
            {activeFilters > 0 && (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    updateParams({
                      tipo: "all",
                      activo: "true",
                      estado: undefined,
                      ecCode: undefined,
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
            {currentParams.tipo !== "all" && (
              <Badge variant="secondary">
                {currentParams.tipo}
                <button
                  onClick={() => updateParams({ tipo: "all" })}
                  className="ml-1 hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {currentParams.activo === "false" && (
              <Badge variant="secondary">
                Inactivos
                <button
                  onClick={() => updateParams({ activo: "true" })}
                  className="ml-1 hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {currentParams.activo === "all" && (
              <Badge variant="secondary">
                Todos los estatus
                <button
                  onClick={() => updateParams({ activo: "true" })}
                  className="ml-1 hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {currentParams.estado && (
              <Badge variant="secondary">
                {currentParams.estado}
                <button
                  onClick={() => updateParams({ estado: undefined })}
                  className="ml-1 hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {currentParams.ecCode && (
              <Badge variant="secondary">
                EC: {currentParams.ecCode}
                <button
                  onClick={() => updateParams({ ecCode: undefined })}
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
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-lg border bg-card p-4 animate-pulse"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-muted rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 w-16 bg-muted rounded mb-2" />
                  <div className="h-5 w-full bg-muted rounded mb-2" />
                  <div className="h-4 w-24 bg-muted rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <CertifierList items={items} />

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

function LoadingFallback() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-96 bg-muted rounded mt-2 animate-pulse" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-4 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 bg-muted rounded-lg" />
              <div className="flex-1">
                <div className="h-4 w-16 bg-muted rounded mb-2" />
                <div className="h-5 w-full bg-muted rounded mb-2" />
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CertificadoresPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CertificadoresContent />
    </Suspense>
  );
}
