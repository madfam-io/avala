/**
 * RENEC API Client
 *
 * Type-safe client for the RENEC Explorer API endpoints.
 */

// Base API URL - adjust based on environment
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ============================================
// Types
// ============================================

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ECStandard {
  id: string;
  ecClave: string;
  titulo: string;
  version: string;
  vigente: boolean;
  sector: string | null;
  nivelCompetencia: number | null;
  fechaPublicacion: string | null;
  proposito: string | null;
  lastSyncedAt: string;
  certifierCount: number;
  centerCount: number;
}

export interface ECDetail extends ECStandard {
  competencias: unknown[];
  elementosJson: unknown[];
  critDesempeno: unknown[];
  critConocimiento: unknown[];
  critProducto: unknown[];
  certifiers: CertifierSummary[];
  centers: CenterSummary[];
}

export interface Certifier {
  id: string;
  certId: string;
  tipo: "ECE" | "OC";
  razonSocial: string;
  nombreComercial: string | null;
  activo: boolean;
  estado: string | null;
  estadoInegi: string | null;
  telefono: string | null;
  email: string | null;
  sitioWeb: string | null;
  lastSyncedAt: string;
  ecCount: number;
  centerCount: number;
}

export interface CertifierSummary {
  id: string;
  razonSocial: string;
  tipo: "ECE" | "OC";
}

export interface Center {
  id: string;
  centerId: string;
  nombre: string;
  activo: boolean;
  estado: string | null;
  estadoInegi: string | null;
  municipio: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  latitud: number | null;
  longitud: number | null;
  lastSyncedAt: string;
  ecCount: number;
  certifier: CertifierSummary | null;
}

export interface CenterSummary {
  id: string;
  nombre: string;
  estado: string | null;
}

export interface CenterWithDistance extends Center {
  distance: number;
}

export interface RenecStats {
  overview: {
    ecStandards: { total: number; active: number };
    certifiers: { total: number; active: number };
    centers: { total: number; active: number };
    lastSyncAt: string | null;
  };
  distributions: {
    ecBySector: Array<{ sector: string; count: number }>;
    certifiersByState: Array<{ estado: string; count: number }>;
    centersByState: Array<{ estado: string; count: number }>;
  };
}

export interface AutocompleteResult {
  ec: Array<{ id: string; code: string; title: string }>;
  certifiers: Array<{ id: string; name: string; type: string; estado: string | null }>;
  centers: Array<{ id: string; name: string; estado: string | null; municipio: string | null }>;
}

export interface Estado {
  estado: string;
  inegi: string | null;
  certifiers: number;
  centers: number;
}

export interface Sector {
  sector: string;
  count: number;
}

// ============================================
// Search Parameters
// ============================================

export interface ECSearchParams {
  page?: number;
  limit?: number;
  q?: string;
  vigente?: "true" | "false" | "all";
  sector?: string;
  nivelCompetencia?: number;
  sortBy?: "ecClave" | "titulo" | "fechaPublicacion" | "lastSyncedAt";
  sortOrder?: "asc" | "desc";
  hasCertifiers?: "true" | "false";
  hasCenters?: "true" | "false";
}

export interface CertifierSearchParams {
  page?: number;
  limit?: number;
  q?: string;
  tipo?: "ECE" | "OC" | "all";
  activo?: "true" | "false" | "all";
  estado?: string;
  ecCode?: string;
  sortBy?: "razonSocial" | "estado" | "lastSyncedAt";
  sortOrder?: "asc" | "desc";
}

export interface CenterSearchParams {
  page?: number;
  limit?: number;
  q?: string;
  activo?: "true" | "false" | "all";
  estado?: string;
  municipio?: string;
  ecCode?: string;
  certifierId?: string;
  sortBy?: "nombre" | "estado" | "municipio" | "lastSyncedAt";
  sortOrder?: "asc" | "desc";
}

export interface NearbySearchParams {
  lat: number;
  lng: number;
  radiusKm?: number;
  limit?: number;
  ecCode?: string;
  activo?: "true" | "false" | "all";
}

// ============================================
// API Responses
// ============================================

interface ECListResponse {
  items: ECStandard[];
  pagination: PaginationInfo;
  filters: {
    q?: string;
    vigente: string;
    sector?: string;
    nivelCompetencia?: number;
  };
}

interface CertifierListResponse {
  items: Certifier[];
  pagination: PaginationInfo;
}

interface CenterListResponse {
  items: Center[];
  pagination: PaginationInfo;
}

interface NearbyResponse {
  origin: { lat: number; lng: number };
  radiusKm: number;
  total: number;
  centers: CenterWithDistance[];
}

// ============================================
// API Functions
// ============================================

async function fetchAPI<T>(endpoint: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(`${API_BASE}/renec${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
    },
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Stats & Overview
export async function getStats(estado?: string): Promise<RenecStats> {
  return fetchAPI<RenecStats>("/stats", { estado });
}

// Autocomplete
export async function autocomplete(
  q: string,
  type: "ec" | "certifier" | "center" | "all" = "all",
  limit = 10
): Promise<AutocompleteResult> {
  return fetchAPI<AutocompleteResult>("/autocomplete", { q, type, limit });
}

// EC Standards
export async function searchEC(params: ECSearchParams = {}): Promise<ECListResponse> {
  return fetchAPI<ECListResponse>("/ec", params as Record<string, string | number | undefined>);
}

export async function getEC(id: string): Promise<ECDetail> {
  return fetchAPI<ECDetail>(`/ec/${id}`);
}

export async function getECByCode(code: string): Promise<ECDetail> {
  return fetchAPI<ECDetail>(`/ec/code/${code}`);
}

export async function getSectors(): Promise<Sector[]> {
  return fetchAPI<Sector[]>("/ec/sectors");
}

// Certifiers
export async function searchCertifiers(params: CertifierSearchParams = {}): Promise<CertifierListResponse> {
  return fetchAPI<CertifierListResponse>("/certifiers", params as Record<string, string | number | undefined>);
}

export async function getCertifier(id: string): Promise<Certifier & { ecStandards: ECStandard[]; centers: Center[] }> {
  return fetchAPI(`/certifiers/${id}`);
}

// Centers
export async function searchCenters(params: CenterSearchParams = {}): Promise<CenterListResponse> {
  return fetchAPI<CenterListResponse>("/centers", params as Record<string, string | number | undefined>);
}

export async function getCenter(id: string): Promise<Center & { ecStandards: ECStandard[] }> {
  return fetchAPI(`/centers/${id}`);
}

export async function getCentersByState(estado: string): Promise<{
  estado: string;
  total: number;
  byMunicipio: Record<string, Center[]>;
}> {
  return fetchAPI(`/centers/by-state/${encodeURIComponent(estado)}`);
}

export async function searchNearby(params: NearbySearchParams): Promise<NearbyResponse> {
  return fetchAPI<NearbyResponse>("/centers/nearby", params as Record<string, string | number | undefined>);
}

// Reference Data
export async function getEstados(): Promise<Estado[]> {
  return fetchAPI<Estado[]>("/estados");
}
