/**
 * RENEC Data Extraction Types
 * Long-term implementation for comprehensive data capture
 */

// ============================================
// Core Entity Types
// ============================================

export interface ECStandard {
  // From API
  idEstandarCompetencia: string;
  idSectorProductivo: string;
  codigo: string;
  nivel: string;
  titulo: string;
  comite: string;
  secProductivo: string;

  // Extended from detail pages
  descripcion?: string;
  ocupaciones?: string[];
  fechaPublicacionDOF?: string;
  urlPDF?: string;
}

export interface ECDetail {
  codigo: string;
  extractedAt: string;
  certificadores: CertifierReference[];
  centrosCapacitacion: TrainingCenterReference[];
  comiteInfo?: CommitteeInfo;
}

export interface Certifier {
  id: string; // Normalized name hash
  nombre: string;
  nombreNormalizado: string;
  tipo: CertifierType;
  ecCodigos: string[];
  ecCount: number;
  firstSeen: string;
  lastSeen: string;
}

export interface CertifierReference {
  nombre: string;
  tipo?: CertifierType;
}

export type CertifierType =
  | "ECE"
  | "OC"
  | "GOBIERNO"
  | "UNIVERSIDAD"
  | "UNKNOWN";

export interface TrainingCenter {
  id: string;
  nombre: string;
  nombreNormalizado: string;
  cursos: string[];
  ecCodigos: string[];
  firstSeen: string;
  lastSeen: string;
}

export interface TrainingCenterReference {
  nombre: string;
  curso?: string;
}

export interface Committee {
  nombre: string;
  nombreNormalizado: string;
  ecCount: number;
  ecCodigos: string[];
  presidente?: string;
  vicepresidente?: string;
  contacto?: CommitteeContact;
}

export interface CommitteeInfo {
  integrantes?: string[];
  presidente?: string;
  vicepresidente?: string;
  contacto?: CommitteeContact;
}

export interface CommitteeContact {
  nombre?: string;
  direccion?: string;
  colonia?: string;
  localidad?: string;
  delegacion?: string;
  entidad?: string;
  telefono?: string;
  email?: string;
}

export interface Sector {
  id: string;
  nombre: string;
  tipo: "productivo" | "organizacional";
  ecCount?: number;
}

// ============================================
// Extraction State Types
// ============================================

export interface ExtractionState {
  version: string;
  startedAt: string;
  lastUpdated: string;
  status: ExtractionStatus;

  // Progress tracking
  progress: {
    ecsTotal: number;
    ecsProcessed: number;
    ecsWithDetails: number;
    ecsFailed: string[];
    lastProcessedEC: string | null;
  };

  // Statistics
  stats: ExtractionStats;

  // Checkpoint data
  checkpoint: {
    currentBatch: number;
    totalBatches: number;
    batchSize: number;
  };
}

export type ExtractionStatus =
  | "idle"
  | "initializing"
  | "extracting_ecs"
  | "extracting_details"
  | "extracting_certifiers"
  | "processing"
  | "completed"
  | "paused"
  | "error";

export interface ExtractionStats {
  ecStandards: number;
  sectors: number;
  committees: number;
  uniqueCertifiers: number;
  uniqueTrainingCenters: number;
  certifiersByType: Record<CertifierType, number>;
  ecsWithCertifiers: number;
  ecsWithTrainingCenters: number;
  avgCertifiersPerEC: number;
  topCertifiers: { nombre: string; ecCount: number }[];
}

// ============================================
// Configuration Types
// ============================================

export interface ExtractorConfig {
  // Output paths
  outputDir: string;
  checkpointDir: string;

  // Rate limiting
  requestDelayMs: number;
  batchSize: number;
  maxRetries: number;
  retryDelayMs: number;

  // Browser settings
  headless: boolean;
  timeout: number;

  // Extraction options
  skipIfExists: boolean;
  incrementalUpdate: boolean;
  maxECsToProcess?: number;

  // Logging
  verbose: boolean;
  logFile?: string;
}

export const DEFAULT_CONFIG: ExtractorConfig = {
  outputDir: "./data/extracted",
  checkpointDir: "./data/checkpoints",

  requestDelayMs: 1500, // 1.5s between requests
  batchSize: 50,
  maxRetries: 3,
  retryDelayMs: 5000,

  headless: true,
  timeout: 60000,

  skipIfExists: true,
  incrementalUpdate: true,

  verbose: true,
};

// ============================================
// Data Store Types
// ============================================

export interface DataStore {
  // Core data
  ecStandards: Map<string, ECStandard>;
  ecDetails: Map<string, ECDetail>;
  certifiers: Map<string, Certifier>;
  trainingCenters: Map<string, TrainingCenter>;
  committees: Map<string, Committee>;
  sectors: Map<string, Sector>;

  // Metadata
  metadata: {
    version: string;
    lastFullExtraction: string | null;
    lastIncrementalUpdate: string | null;
    apiEndpoints: string[];
  };
}

// ============================================
// Event Types
// ============================================

export type ExtractorEvent =
  | { type: "started"; timestamp: string }
  | { type: "progress"; processed: number; total: number; current: string }
  | {
      type: "ec_extracted";
      codigo: string;
      certifiers: number;
      training: number;
    }
  | { type: "batch_complete"; batch: number; total: number }
  | { type: "checkpoint_saved"; path: string }
  | { type: "error"; message: string; codigo?: string }
  | { type: "completed"; stats: ExtractionStats };

export type ExtractorEventHandler = (event: ExtractorEvent) => void;
