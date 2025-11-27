/**
 * Geocoding Service
 *
 * Converts addresses to lat/lng coordinates for map functionality.
 * Supports multiple providers with fallback.
 */

import type { PrismaClient } from "@prisma/client";

// Configuration from environment
const GEOCODING_CONFIG = {
  provider: process.env.GEOCODING_PROVIDER || "nominatim", // 'nominatim' | 'google' | 'mapbox'
  googleApiKey: process.env.GOOGLE_MAPS_API_KEY || "",
  mapboxToken: process.env.MAPBOX_ACCESS_TOKEN || "",
  rateLimitMs: parseInt(process.env.GEOCODING_RATE_LIMIT_MS || "1000", 10), // 1 req/sec for free APIs
  maxRetries: 3,
};

interface GeocodingResult {
  lat: number;
  lng: number;
  confidence: number; // 0-1, how confident the geocoding is
  source: string;
}

interface GeocodingInput {
  address?: string;
  municipio?: string;
  estado?: string;
  codigoPostal?: string;
}

/**
 * Rate limiter to respect API limits
 */
let lastRequestTime = 0;
async function rateLimitedRequest<T>(fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < GEOCODING_CONFIG.rateLimitMs) {
    await new Promise((resolve) =>
      setTimeout(resolve, GEOCODING_CONFIG.rateLimitMs - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();
  return fn();
}

/**
 * Build a geocoding query string from input
 */
function buildQueryString(input: GeocodingInput): string {
  const parts = [
    input.address,
    input.municipio,
    input.estado,
    input.codigoPostal,
    "México", // Always include country for better results
  ].filter(Boolean);

  return parts.join(", ");
}

/**
 * Geocode using OpenStreetMap Nominatim (free, no API key required)
 */
async function geocodeWithNominatim(
  query: string
): Promise<GeocodingResult | null> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "mx");

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Avala/1.0 (https://avala.mx)",
      },
    });

    if (!response.ok) {
      console.error("Nominatim error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return null;
    }

    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      confidence: parseFloat(result.importance) || 0.5,
      source: "nominatim",
    };
  } catch (error) {
    console.error("Nominatim geocoding error:", error);
    return null;
  }
}

/**
 * Geocode using Google Maps API (requires API key)
 */
async function geocodeWithGoogle(
  query: string
): Promise<GeocodingResult | null> {
  const { googleApiKey } = GEOCODING_CONFIG;

  if (!googleApiKey) {
    return null;
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", query);
    url.searchParams.set("key", googleApiKey);
    url.searchParams.set("region", "mx");

    const response = await fetch(url.toString());

    if (!response.ok) {
      console.error("Google geocoding error:", response.status);
      return null;
    }

    const data = await response.json();

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      return null;
    }

    const result = data.results[0];
    const location = result.geometry.location;

    // Map Google's location_type to confidence
    const confidenceMap: Record<string, number> = {
      ROOFTOP: 1.0,
      RANGE_INTERPOLATED: 0.8,
      GEOMETRIC_CENTER: 0.6,
      APPROXIMATE: 0.4,
    };

    return {
      lat: location.lat,
      lng: location.lng,
      confidence: confidenceMap[result.geometry.location_type] || 0.5,
      source: "google",
    };
  } catch (error) {
    console.error("Google geocoding error:", error);
    return null;
  }
}

/**
 * Geocode using Mapbox API (requires token)
 */
async function geocodeWithMapbox(
  query: string
): Promise<GeocodingResult | null> {
  const { mapboxToken } = GEOCODING_CONFIG;

  if (!mapboxToken) {
    return null;
  }

  try {
    const url = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`
    );
    url.searchParams.set("access_token", mapboxToken);
    url.searchParams.set("country", "mx");
    url.searchParams.set("limit", "1");

    const response = await fetch(url.toString());

    if (!response.ok) {
      console.error("Mapbox geocoding error:", response.status);
      return null;
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      return null;
    }

    const feature = data.features[0];
    const [lng, lat] = feature.center;

    return {
      lat,
      lng,
      confidence: feature.relevance || 0.5,
      source: "mapbox",
    };
  } catch (error) {
    console.error("Mapbox geocoding error:", error);
    return null;
  }
}

/**
 * Main geocoding function with provider fallback
 */
export async function geocode(
  input: GeocodingInput
): Promise<GeocodingResult | null> {
  const query = buildQueryString(input);

  if (!query || query === "México") {
    return null;
  }

  return rateLimitedRequest(async () => {
    const { provider } = GEOCODING_CONFIG;

    // Try primary provider first
    let result: GeocodingResult | null = null;

    switch (provider) {
      case "google":
        result = await geocodeWithGoogle(query);
        break;
      case "mapbox":
        result = await geocodeWithMapbox(query);
        break;
      case "nominatim":
      default:
        result = await geocodeWithNominatim(query);
        break;
    }

    // Fallback to Nominatim if primary fails
    if (!result && provider !== "nominatim") {
      result = await geocodeWithNominatim(query);
    }

    return result;
  });
}

/**
 * Geocode a single center and update the database
 */
export async function geocodeCenter(
  prisma: PrismaClient,
  centerId: string
): Promise<boolean> {
  try {
    const center = await prisma.renecCenter.findUnique({
      where: { id: centerId },
    });

    if (!center) {
      return false;
    }

    // Skip if already geocoded recently (within 30 days)
    if (center.geocodedAt) {
      const daysSinceGeocoded =
        (Date.now() - center.geocodedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceGeocoded < 30) {
        return true;
      }
    }

    const result = await geocode({
      address: center.direccion || undefined,
      municipio: center.municipio || undefined,
      estado: center.estado || undefined,
      codigoPostal: center.codigoPostal || undefined,
    });

    if (result && result.confidence >= 0.3) {
      await prisma.renecCenter.update({
        where: { id: centerId },
        data: {
          latitud: result.lat,
          longitud: result.lng,
          geocodedAt: new Date(),
        },
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error geocoding center ${centerId}:`, error);
    return false;
  }
}

/**
 * Batch geocode all centers without coordinates
 */
export async function geocodeAllCenters(
  prisma: PrismaClient,
  options: {
    batchSize?: number;
    onProgress?: (processed: number, total: number) => void;
  } = {}
): Promise<{ processed: number; geocoded: number; failed: number }> {
  const { batchSize = 100, onProgress } = options;

  // Find centers without coordinates
  const centersToGeocode = await prisma.renecCenter.findMany({
    where: {
      OR: [{ latitud: null }, { longitud: null }],
      // Must have at least some address info
      OR: [
        { direccion: { not: null } },
        { municipio: { not: null } },
        { codigoPostal: { not: null } },
      ],
    },
    select: { id: true },
  });

  const total = centersToGeocode.length;
  let processed = 0;
  let geocoded = 0;
  let failed = 0;

  // Process in batches
  for (let i = 0; i < centersToGeocode.length; i += batchSize) {
    const batch = centersToGeocode.slice(i, i + batchSize);

    for (const center of batch) {
      const success = await geocodeCenter(prisma, center.id);
      processed++;

      if (success) {
        geocoded++;
      } else {
        failed++;
      }

      onProgress?.(processed, total);
    }

    // Log progress every batch
    console.log(
      `Geocoding progress: ${processed}/${total} (${geocoded} success, ${failed} failed)`
    );
  }

  return { processed, geocoded, failed };
}

/**
 * Get geocoding statistics
 */
export async function getGeocodingStats(prisma: PrismaClient): Promise<{
  total: number;
  geocoded: number;
  pending: number;
  percentComplete: number;
}> {
  const [total, geocoded] = await Promise.all([
    prisma.renecCenter.count(),
    prisma.renecCenter.count({
      where: {
        latitud: { not: null },
        longitud: { not: null },
      },
    }),
  ]);

  return {
    total,
    geocoded,
    pending: total - geocoded,
    percentComplete: total > 0 ? Math.round((geocoded / total) * 100) : 0,
  };
}
