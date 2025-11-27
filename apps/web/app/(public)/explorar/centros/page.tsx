"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Filter, X, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchBox } from "@/components/renec/search-box";
import { CenterList } from "@/components/renec/center-card";
import { Pagination } from "@/components/renec/pagination";
import {
  searchCenters,
  searchNearby,
  getEstados,
  type Center,
  type CenterWithDistance,
  type PaginationInfo,
  type CenterSearchParams,
  type Estado,
} from "@/lib/api/renec";

export default function CentrosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [items, setItems] = useState<(Center | CenterWithDistance)[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [nearbyMode, setNearbyMode] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get current params
  const currentParams: CenterSearchParams = {
    page: Number(searchParams.get("page")) || 1,
    q: searchParams.get("q") || undefined,
    activo: (searchParams.get("activo") as "true" | "false" | "all") || "true",
    estado: searchParams.get("estado") || undefined,
    municipio: searchParams.get("municipio") || undefined,
    ecCode: searchParams.get("ecCode") || undefined,
    sortBy:
      (searchParams.get("sortBy") as CenterSearchParams["sortBy"]) || "nombre",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "asc",
  };

  // Update URL params
  const updateParams = useCallback(
    (updates: Partial<CenterSearchParams>) => {
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
    [router, searchParams]
  );

  // Get user location
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Tu navegador no soporta geolocalización");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setNearbyMode(true);
        setLocationError(null);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Permiso de ubicación denegado");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Ubicación no disponible");
            break;
          case error.TIMEOUT:
            setLocationError("Tiempo de espera agotado");
            break;
          default:
            setLocationError("Error al obtener ubicación");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch estados for filter dropdown
        if (estados.length === 0) {
          const estadoData = await getEstados();
          setEstados(estadoData);
        }

        // Fetch centers based on mode
        if (nearbyMode && userLocation) {
          const nearbyData = await searchNearby({
            lat: userLocation.lat,
            lng: userLocation.lng,
            radiusKm: 100,
            limit: 50,
            ecCode: currentParams.ecCode,
            activo: currentParams.activo,
          });
          setItems(nearbyData.centers);
          setPagination(null);
        } else {
          const centerData = await searchCenters(currentParams);
          setItems(centerData.items);
          setPagination(centerData.pagination);
        }
      } catch (error) {
        console.error("Error fetching center data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [searchParams, nearbyMode, userLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  // Active filters count
  const activeFilters = [
    currentParams.activo !== "true" && currentParams.activo,
    currentParams.estado,
    currentParams.municipio,
    currentParams.ecCode,
  ].filter(Boolean).length;

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Centros de Evaluación</h1>
        <p className="mt-2 text-muted-foreground">
          Encuentra centros de evaluación donde puedes certificar tus
          competencias laborales
        </p>
      </div>

      {/* Location Toggle */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-orange-50 to-orange-100/50">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-orange-100 p-2">
            <Navigation className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-medium">Buscar centros cercanos</h3>
            <p className="text-sm text-muted-foreground">
              {nearbyMode && userLocation
                ? "Mostrando centros ordenados por distancia"
                : "Usa tu ubicación para encontrar centros cerca de ti"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {nearbyMode ? (
            <Button
              variant="outline"
              onClick={() => {
                setNearbyMode(false);
                setUserLocation(null);
              }}
            >
              <X className="mr-2 h-4 w-4" />
              Desactivar
            </Button>
          ) : (
            <Button onClick={requestLocation}>
              <MapPin className="mr-2 h-4 w-4" />
              Usar mi ubicación
            </Button>
          )}
        </div>
        {locationError && (
          <p className="text-sm text-destructive">{locationError}</p>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBox
              defaultValue={currentParams.q}
              onSearch={(q) => updateParams({ q, page: 1 })}
              showAutocomplete={false}
              placeholder="Buscar por nombre, dirección..."
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
                      {e.estado} ({e.centers})
                    </option>
                  ))}
                </select>
              </div>

              {/* Municipio Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Municipio
                </label>
                <input
                  type="text"
                  value={currentParams.municipio || ""}
                  onChange={(e) => updateParams({ municipio: e.target.value })}
                  placeholder="Escribe un municipio..."
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>

              {/* Activo Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Estatus</label>
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
                      sortBy: sortBy as CenterSearchParams["sortBy"],
                      sortOrder: sortOrder as "asc" | "desc",
                    });
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  disabled={nearbyMode}
                >
                  <option value="nombre-asc">Nombre (A-Z)</option>
                  <option value="nombre-desc">Nombre (Z-A)</option>
                  <option value="estado-asc">Estado (A-Z)</option>
                  <option value="estado-desc">Estado (Z-A)</option>
                  <option value="municipio-asc">Municipio (A-Z)</option>
                </select>
              </div>
            </div>

            {/* EC Code Filter */}
            {currentParams.ecCode && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  Mostrando centros para:{" "}
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
                      activo: "true",
                      estado: undefined,
                      municipio: undefined,
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
        {(activeFilters > 0 || nearbyMode) && (
          <div className="flex flex-wrap gap-2">
            {nearbyMode && (
              <Badge variant="default" className="bg-orange-100 text-orange-700">
                <Navigation className="mr-1 h-3 w-3" />
                Centros cercanos
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
            {currentParams.municipio && (
              <Badge variant="secondary">
                {currentParams.municipio}
                <button
                  onClick={() => updateParams({ municipio: undefined })}
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
          <CenterList items={items} showDistance={nearbyMode} />

          {pagination && pagination.totalPages > 1 && !nearbyMode && (
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
