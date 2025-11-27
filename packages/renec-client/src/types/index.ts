/**
 * RENEC Client Type Definitions
 * Types for EC standards, certifiers, and evaluation centers from CONOCER's RENEC
 */

// ============================================
// EC Standards Types
// ============================================

export interface ECStandard {
  ecClave: string;           // EC code (e.g., "EC0217")
  titulo: string;            // Standard title
  version: string;           // Version number
  vigente: boolean;          // Is currently active
  sector?: string;           // Sector name
  sectorId?: string;         // Sector ID
  comite?: string;           // Committee name
  comiteId?: string;         // Committee ID
  descripcion?: string;      // Description
  competencias?: string[];   // List of competencies/elements
  nivel?: string;            // Competency level
  duracionHoras?: number;    // Duration in hours
  tipoNorma?: string;        // Standard type
  fechaPublicacion?: string; // Publication date (ISO)
  fechaVigencia?: string;    // Validity date (ISO)
  perfilEvaluador?: string;  // Evaluator profile requirements
  criteriosEvaluacion?: string[]; // Evaluation criteria
  renecUrl: string;          // Source URL
  extractedAt: string;       // Extraction timestamp (ISO)
  contentHash: string;       // SHA256 hash for change detection
  firstSeen?: string;        // First seen timestamp
  lastSeen?: string;         // Last seen timestamp
}

export interface ECElement {
  id: string;
  standardId: string;
  index: number;
  titulo: string;
  descripcion?: string;
}

export interface ECCriterion {
  id: string;
  elementId: string;
  type: 'desempeno' | 'conocimiento' | 'producto' | 'actitud';
  code: string;
  text: string;
  weight: number;
}

export type ECListingType = 'active' | 'inactive' | 'historical' | 'new' | 'unknown';

// ============================================
// Certifier Types (ECE/OC)
// ============================================

export type CertifierType = 'ECE' | 'OC';

export interface Certifier {
  certId: string;            // Unique certifier ID
  tipo: CertifierType;       // ECE or OC
  nombreLegal: string;       // Legal name
  siglas?: string;           // Abbreviation
  estatus: string;           // Status (ACTIVO, etc.)
  domicilioTexto?: string;   // Full address text
  estado?: string;           // State name
  estadoInegi?: string;      // INEGI 2-digit state code
  municipio?: string;        // Municipality
  cp?: string;               // Postal code
  telefono?: string;         // Phone number
  correo?: string;           // Email
  sitioWeb?: string;         // Website
  representanteLegal?: string; // Legal representative
  fechaAcreditacion?: string; // Accreditation date (ISO)
  estandaresAcreditados?: string[]; // List of EC codes
  srcUrl: string;            // Source URL
  extractedAt: string;       // Extraction timestamp
  rowHash: string;           // SHA256 hash for change detection
  firstSeen?: string;
  lastSeen?: string;
}

export interface ECEAccreditation {
  certId: string;
  ecClave: string;
  acreditadoDesde?: string;  // Accreditation start date
  runId: string;             // Harvest run ID
  extractedAt: string;
}

// ============================================
// Evaluation Center Types
// ============================================

export interface EvaluationCenter {
  centroId: string;          // Unique center ID
  nombre: string;            // Center name
  certId?: string;           // Parent certifier ID
  estado?: string;           // State name
  estadoInegi?: string;      // INEGI state code
  municipio?: string;        // Municipality
  direccion?: string;        // Address
  cp?: string;               // Postal code
  telefono?: string;         // Phone
  correo?: string;           // Email
  estandaresOfrecidos?: string[]; // EC codes offered
  srcUrl: string;            // Source URL
  extractedAt: string;
  firstSeen?: string;
  lastSeen?: string;
}

export interface CenterECOffering {
  centroId: string;
  ecClave: string;
  runId: string;
  extractedAt: string;
}

// ============================================
// Sector/Committee Types
// ============================================

export interface Sector {
  sectorId: string;
  nombre: string;
  srcUrl: string;
  firstSeen?: string;
  lastSeen?: string;
}

export interface Comite {
  comiteId: string;
  nombre: string;
  sectorId?: string;
  srcUrl: string;
  firstSeen?: string;
  lastSeen?: string;
}

// ============================================
// Configuration Types
// ============================================

export interface RenecClientConfig {
  baseUrl: string;
  timezone: string;
  headless: boolean;
  politeDelayMs: [number, number]; // [min, max]
  retries: number;
  timeoutSec: number;
  userAgent?: string;
}

export const DEFAULT_CONFIG: RenecClientConfig = {
  baseUrl: 'https://conocer.gob.mx',
  timezone: 'America/Mexico_City',
  headless: true,
  politeDelayMs: [600, 1200],
  retries: 3,
  timeoutSec: 30,
  userAgent: 'AVALA-RenecClient/1.0 (+https://avala.mx)',
};

// ============================================
// Validation Patterns
// ============================================

export const VALIDATION_PATTERNS = {
  ecCode: /^EC\d{4}(\.\d{2})?$/,
  oecCode: /^OC\d{3,4}$/,
  ceCode: /^CE\d{4,5}$/,
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^[\d\s\-\+\(\)]+$/,
  rfc: /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/,
  curp: /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/,
} as const;

// ============================================
// RENEC Endpoints
// ============================================

export const RENEC_ENDPOINTS = {
  ec: {
    active: '/RENEC/controlador.do?comp=ESLACT',
    inactive: '/RENEC/controlador.do?comp=ESLINACT',
    historical: '/RENEC/controlador.do?comp=ESLHIST',
    new: '/RENEC/controlador.do?comp=ECNew',
    search: '/RENEC/controlador.do?comp=ES',
    detail: '/RENEC/controlador.do?comp=EC&ec=',
  },
  certifier: {
    eceList: '/RENEC/controlador.do?comp=ECE',
    ocList: '/RENEC/controlador.do?comp=OC',
    detail: '/RENEC/controlador.do?comp=CERT&id=',
  },
  center: {
    list: '/RENEC/controlador.do?comp=CE',
    detail: '/RENEC/controlador.do?comp=CE&id=',
  },
  irHub: '/RENEC/controlador.do?comp=IR',
} as const;

// ============================================
// Mexican State INEGI Mapping
// ============================================

export const ESTADO_INEGI_MAP: Record<string, string> = {
  'AGUASCALIENTES': '01',
  'BAJA CALIFORNIA': '02',
  'BAJA CALIFORNIA SUR': '03',
  'CAMPECHE': '04',
  'COAHUILA': '05',
  'COAHUILA DE ZARAGOZA': '05',
  'COLIMA': '06',
  'CHIAPAS': '07',
  'CHIHUAHUA': '08',
  'CIUDAD DE MÉXICO': '09',
  'DISTRITO FEDERAL': '09',
  'CDMX': '09',
  'DURANGO': '10',
  'GUANAJUATO': '11',
  'GUERRERO': '12',
  'HIDALGO': '13',
  'JALISCO': '14',
  'MÉXICO': '15',
  'ESTADO DE MÉXICO': '15',
  'MICHOACÁN': '16',
  'MICHOACÁN DE OCAMPO': '16',
  'MORELOS': '17',
  'NAYARIT': '18',
  'NUEVO LEÓN': '19',
  'OAXACA': '20',
  'PUEBLA': '21',
  'QUERÉTARO': '22',
  'QUINTANA ROO': '23',
  'SAN LUIS POTOSÍ': '24',
  'SINALOA': '25',
  'SONORA': '26',
  'TABASCO': '27',
  'TAMAULIPAS': '28',
  'TLAXCALA': '29',
  'VERACRUZ': '30',
  'VERACRUZ DE IGNACIO DE LA LLAVE': '30',
  'YUCATÁN': '31',
  'ZACATECAS': '32',
};
