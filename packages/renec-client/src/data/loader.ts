/**
 * Data loader for extracted CONOCER/RENEC data
 * Provides typed access to committees, EC standards, and related data
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Types for extracted data
export interface Committee {
  id: number;
  clave: string;
  nombre: string;
  presidente?: string;
  vicepresidente?: string;
  puestoPresidente?: string;
  puestoVicepresidente?: string;
  calleNumero?: string;
  colonia?: string;
  codigoPostal?: number;
  localidad?: string;
  delegacionStr?: string;
  entidadStr?: string;
  telefonos?: string;
  correo?: string;
  url?: string;
  fax?: string;
  contacto?: string;
  idSectorProductivo?: number;
  sectorProductivoStr?: string;
  fechaIntegracion?: number;
  estandaresAsociados?: AssociatedEC[];
}

export interface AssociatedEC {
  idEstandarCompetencia?: number | null;
  codigo: string;
  nivel?: string | null;
  titulo: string;
  sectorProductivo?: string | null;
  nombre?: string | null;
  operativo?: boolean | null;
}

export interface ECStandard {
  idEstandarCompetencia: number;
  codigo: string;
  nivel: string;
  titulo: string;
  sectorProductivo?: {
    idSectorProductivo: number;
    nombre: string;
  };
  comiteGestion?: {
    idComite: number;
    nombre: string;
  };
  fechaPublicacion?: number;
  fechaInicio?: number;
  fechaVigenciaFin?: number;
  descripcionGeneral?: string;
  ocupaciones?: string;
}

export interface ExtractionStats {
  extraction_date: string;
  committees: {
    total: number;
    with_president: number;
    with_email: number;
    with_phone: number;
    with_ecs: number;
    total_ec_associations: number;
  };
  ec_standards: {
    total_from_api: number;
    unique_from_committees: number;
    by_sector?: Record<string, number>;
  };
  sectors: Record<string, number>;
  states: Record<string, number>;
}

// Data paths
const DATA_DIR = join(__dirname, '../../data/extracted');

/**
 * Load committees data
 */
export function loadCommittees(): Committee[] {
  const filePath = join(DATA_DIR, 'committees_complete.json');
  if (!existsSync(filePath)) {
    console.warn('Committees data not found. Run extraction first.');
    return [];
  }
  const data = readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

/**
 * Load EC standards from API extraction
 */
export function loadECStandards(): ECStandard[] {
  const filePath = join(DATA_DIR, 'ec_standards_api.json');
  if (!existsSync(filePath)) {
    console.warn('EC standards data not found. Run extraction first.');
    return [];
  }
  const data = readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

/**
 * Load extraction statistics
 */
export function loadStats(): ExtractionStats | null {
  const filePath = join(DATA_DIR, 'extraction_stats.json');
  if (!existsSync(filePath)) {
    return null;
  }
  const data = readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

/**
 * Load EC codes referenced by committees
 */
export function loadECCodesFromCommittees(): string[] {
  const filePath = join(DATA_DIR, 'ec_codes_from_committees.json');
  if (!existsSync(filePath)) {
    return [];
  }
  const data = readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

// Query helpers

/**
 * Find committee by ID
 */
export function findCommitteeById(id: number): Committee | undefined {
  const committees = loadCommittees();
  return committees.find(c => c.id === id);
}

/**
 * Find committee by clave
 */
export function findCommitteeByClave(clave: string): Committee | undefined {
  const committees = loadCommittees();
  return committees.find(c => c.clave === clave);
}

/**
 * Find committees by sector
 */
export function findCommitteesBySector(sector: string): Committee[] {
  const committees = loadCommittees();
  return committees.filter(c =>
    c.sectorProductivoStr?.toLowerCase().includes(sector.toLowerCase())
  );
}

/**
 * Find committees by state
 */
export function findCommitteesByState(state: string): Committee[] {
  const committees = loadCommittees();
  return committees.filter(c =>
    c.entidadStr?.toLowerCase().includes(state.toLowerCase())
  );
}

/**
 * Find EC standard by codigo
 */
export function findECByCodigo(codigo: string): ECStandard | undefined {
  const standards = loadECStandards();
  return standards.find(ec => ec.codigo === codigo);
}

/**
 * Find EC standards by sector
 */
export function findECsBySector(sector: string): ECStandard[] {
  const standards = loadECStandards();
  return standards.filter(ec =>
    ec.sectorProductivo?.nombre?.toLowerCase().includes(sector.toLowerCase())
  );
}

/**
 * Find committees that have a specific EC standard
 */
export function findCommitteesWithEC(ecCodigo: string): Committee[] {
  const committees = loadCommittees();
  return committees.filter(c =>
    c.estandaresAsociados?.some(ec => ec.codigo === ecCodigo)
  );
}

/**
 * Get all EC codes from a committee
 */
export function getECCodesForCommittee(committeeId: number): string[] {
  const committee = findCommitteeById(committeeId);
  if (!committee?.estandaresAsociados) return [];
  return committee.estandaresAsociados
    .map(ec => ec.codigo)
    .filter((c): c is string => !!c);
}

/**
 * Search committees by text (searches name, president, sector)
 */
export function searchCommittees(query: string): Committee[] {
  const committees = loadCommittees();
  const lowerQuery = query.toLowerCase();
  return committees.filter(c =>
    c.nombre?.toLowerCase().includes(lowerQuery) ||
    c.presidente?.toLowerCase().includes(lowerQuery) ||
    c.sectorProductivoStr?.toLowerCase().includes(lowerQuery) ||
    c.clave?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Search EC standards by text (searches codigo, titulo)
 */
export function searchECStandards(query: string): ECStandard[] {
  const standards = loadECStandards();
  const lowerQuery = query.toLowerCase();
  return standards.filter(ec =>
    ec.codigo?.toLowerCase().includes(lowerQuery) ||
    ec.titulo?.toLowerCase().includes(lowerQuery)
  );
}

// Summary helpers

/**
 * Get summary of all sectors with committee counts
 */
export function getSectorSummary(): Map<string, number> {
  const committees = loadCommittees();
  const sectors = new Map<string, number>();
  for (const c of committees) {
    const sector = c.sectorProductivoStr || 'Sin sector';
    sectors.set(sector, (sectors.get(sector) || 0) + 1);
  }
  return sectors;
}

/**
 * Get summary of all states with committee counts
 */
export function getStateSummary(): Map<string, number> {
  const committees = loadCommittees();
  const states = new Map<string, number>();
  for (const c of committees) {
    const state = c.entidadStr || 'Sin estado';
    states.set(state, (states.get(state) || 0) + 1);
  }
  return states;
}
