"use client";

import * as React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { MapPin, Navigation, Loader2, ZoomIn, ZoomOut, Locate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Center } from "@/lib/api/renec";

// Leaflet types
declare global {
  interface Window {
    L: typeof import("leaflet");
  }
}

interface CenterMapProps {
  centers: Center[];
  userLocation?: { lat: number; lng: number } | null;
  onCenterClick?: (center: Center) => void;
  onBoundsChange?: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => void;
  className?: string;
  height?: string;
  showUserLocation?: boolean;
  selectedCenterId?: string;
}

// Mexico bounds for initial view
const MEXICO_BOUNDS = {
  center: { lat: 23.6345, lng: -102.5528 },
  zoom: 5,
};

export function CenterMap({
  centers,
  userLocation,
  onCenterClick,
  onBoundsChange,
  className,
  height = "400px",
  showUserLocation = true,
  selectedCenterId,
}: CenterMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);

  // Load Leaflet dynamically
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if Leaflet is already loaded
    if (window.L) {
      setIsLoading(false);
      return;
    }

    // Load Leaflet CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setIsLoading(false);
    document.head.appendChild(script);

    return () => {
      // Cleanup (optional - Leaflet is cached anyway)
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (isLoading || !mapRef.current || !window.L) return;
    if (mapInstanceRef.current) return; // Already initialized

    const L = window.L;

    // Create map
    const map = L.map(mapRef.current, {
      center: [MEXICO_BOUNDS.center.lat, MEXICO_BOUNDS.center.lng],
      zoom: MEXICO_BOUNDS.zoom,
      zoomControl: false, // We'll add custom controls
    });

    // Add tile layer (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Handle bounds change
    map.on("moveend", () => {
      const bounds = map.getBounds();
      onBoundsChange?.({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [isLoading, onBoundsChange]);

  // Update markers when centers change
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;

    const L = window.L;
    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Create custom icon
    const createIcon = (isSelected: boolean) =>
      L.divIcon({
        className: "custom-marker",
        html: `
          <div class="relative">
            <div class="${
              isSelected
                ? "bg-primary text-primary-foreground"
                : "bg-orange-500 text-white"
            } rounded-full p-2 shadow-lg transform ${isSelected ? "scale-125" : ""} transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

    // Add markers for centers with coordinates
    centers.forEach((center) => {
      if (center.latitud && center.longitud) {
        const isSelected = center.id === selectedCenterId;
        const marker = L.marker([center.latitud, center.longitud], {
          icon: createIcon(isSelected),
        });

        // Create popup content
        const popupContent = `
          <div class="p-2 min-w-[200px]">
            <h3 class="font-semibold text-sm mb-1">${center.nombre}</h3>
            <p class="text-xs text-gray-600 mb-2">
              ${[center.municipio, center.estado].filter(Boolean).join(", ")}
            </p>
            ${
              center.distance
                ? `<p class="text-xs text-orange-600 mb-2">📍 ${center.distance.toFixed(1)} km</p>`
                : ""
            }
            <a
              href="/explorar/centros/${center.id}"
              class="text-xs text-blue-600 hover:underline"
            >
              Ver detalles →
            </a>
          </div>
        `;

        marker.bindPopup(popupContent);

        marker.on("click", () => {
          onCenterClick?.(center);
        });

        marker.addTo(map);
        markersRef.current.push(marker);
      }
    });

    // Fit bounds to show all markers if we have any
    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, [centers, selectedCenterId, onCenterClick]);

  // Update user location marker
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L || !showUserLocation) return;

    const L = window.L;
    const map = mapInstanceRef.current;

    // Remove existing user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      // Create user location marker
      const userIcon = L.divIcon({
        className: "user-marker",
        html: `
          <div class="relative">
            <div class="bg-blue-500 rounded-full p-2 shadow-lg border-2 border-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="text-white">
                <circle cx="12" cy="12" r="10"/>
              </svg>
            </div>
            <div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-25"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      });

      marker.bindPopup("Tu ubicación");
      marker.addTo(map);
      userMarkerRef.current = marker;
    }
  }, [userLocation, showUserLocation]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    mapInstanceRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    mapInstanceRef.current?.zoomOut();
  }, []);

  // Locate user
  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        mapInstanceRef.current?.setView([latitude, longitude], 12);
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  // Center on selected marker
  useEffect(() => {
    if (!selectedCenterId || !mapInstanceRef.current) return;

    const center = centers.find((c) => c.id === selectedCenterId);
    if (center?.latitud && center?.longitud) {
      mapInstanceRef.current.setView([center.latitud, center.longitud], 14);
    }
  }, [selectedCenterId, centers]);

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted rounded-lg",
          className
        )}
        style={{ height }}
      >
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative rounded-lg overflow-hidden", className)}>
      {/* Map container */}
      <div ref={mapRef} style={{ height }} className="w-full" />

      {/* Custom controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomIn}
          className="h-8 w-8 bg-background shadow-md"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomOut}
          className="h-8 w-8 bg-background shadow-md"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleLocate}
          disabled={isLocating}
          className="h-8 w-8 bg-background shadow-md"
        >
          {isLocating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Locate className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-2 shadow-md z-[1000]">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded-full" />
            <span>Centro</span>
          </div>
          {showUserLocation && userLocation && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span>Tu ubicación</span>
            </div>
          )}
        </div>
      </div>

      {/* No results message */}
      {centers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-[1000]">
          <div className="text-center p-4">
            <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No hay centros para mostrar en el mapa
            </p>
          </div>
        </div>
      )}

      {/* Leaflet custom styles */}
      <style jsx global>{`
        .custom-marker,
        .user-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
        }
        .leaflet-popup-content {
          margin: 8px;
        }
      `}</style>
    </div>
  );
}

// Mini map for single center
export function CenterMiniMap({
  center,
  className,
}: {
  center: { latitud?: number | null; longitud?: number | null; nombre: string };
  className?: string;
}) {
  if (!center.latitud || !center.longitud) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted rounded-lg h-48",
          className
        )}
      >
        <div className="text-center text-muted-foreground">
          <MapPin className="h-6 w-6 mx-auto mb-2" />
          <p className="text-sm">Ubicación no disponible</p>
        </div>
      </div>
    );
  }

  return (
    <CenterMap
      centers={[
        {
          id: "single",
          centerId: "single",
          nombre: center.nombre,
          latitud: center.latitud,
          longitud: center.longitud,
          activo: true,
          estado: null,
          municipio: null,
          ecCount: 0,
          lastSyncedAt: new Date().toISOString(),
        },
      ]}
      className={className}
      height="200px"
      showUserLocation={false}
    />
  );
}
