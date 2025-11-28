import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  IsObject,
  IsDateString,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

// ============================================
// ENUMS
// ============================================

export enum CertificadorTipo {
  ECE = "ECE",
  OC = "OC",
}

export enum HarvestMode {
  PROBE = "probe",
  HARVEST = "harvest",
}

export enum HarvestStatus {
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum RenecComponent {
  EC_STANDARDS = "ec_standards",
  CERTIFICADORES = "certificadores",
  CENTROS = "centros",
  SECTORES = "sectores",
}

// ============================================
// CENTRO (Evaluation Center) DTOs
// ============================================

export class CreateCentroDto {
  @ApiProperty({ description: "RENEC Centro ID" })
  @IsString()
  centroId: string;

  @ApiProperty()
  @IsString()
  nombre: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  certificadorId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  estado?: string;

  @ApiPropertyOptional({ description: "INEGI state code (01-32)" })
  @IsString()
  @IsOptional()
  estadoInegi?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  municipio?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  domicilio?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  extension?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  correo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  coordinador?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sitioWeb?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  srcUrl?: string;

  @ApiPropertyOptional({
    description: "EC standard codes this center can evaluate",
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  ecStandardCodes?: string[];
}

export class UpdateCentroDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nombre?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  estado?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  estadoInegi?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  municipio?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  domicilio?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  correo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  coordinador?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  ecStandardCodes?: string[];
}

export class CentroQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  estadoInegi?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  municipio?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  certificadorId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ecStandardCode?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  skip?: number = 0;

  @ApiPropertyOptional({ default: 100 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Max(500)
  limit?: number = 100;
}

// ============================================
// CERTIFICADOR DTOs
// ============================================

export class CreateCertificadorDto {
  @ApiProperty({ description: "RENEC Certificador ID" })
  @IsString()
  certId: string;

  @ApiProperty({ enum: CertificadorTipo })
  @IsEnum(CertificadorTipo)
  tipo: CertificadorTipo;

  @ApiProperty()
  @IsString()
  nombreLegal: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  siglas?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  estatus?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  domicilioTexto?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  estado?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  estadoInegi?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  municipio?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  cp?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  correo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sitioWeb?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  representanteLegal?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  fechaAcreditacion?: string;

  @ApiPropertyOptional({ description: "Accredited EC standard codes" })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  estandaresAcreditados?: string[];

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  contactosAdicionales?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  srcUrl?: string;
}

export class CertificadorQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: CertificadorTipo })
  @IsEnum(CertificadorTipo)
  @IsOptional()
  tipo?: CertificadorTipo;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  estadoInegi?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ecStandardCode?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  skip?: number = 0;

  @ApiPropertyOptional({ default: 100 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Max(500)
  limit?: number = 100;
}

// ============================================
// RENEC EC STANDARD DTOs
// ============================================

export class CreateRenecECDto {
  @ApiProperty({ description: "EC code (e.g., EC0249)" })
  @IsString()
  ecClave: string;

  @ApiProperty()
  @IsString()
  titulo: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  version?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  vigente?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sector?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sectorId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  comite?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  comiteId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  competencias?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nivel?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  duracionHoras?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tipoNorma?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  fechaPublicacion?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  fechaVigencia?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  perfilEvaluador?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  criteriosEvaluacion?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  renecUrl?: string;
}

export class RenecECQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sector?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  comite?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  vigente?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  skip?: number = 0;

  @ApiPropertyOptional({ default: 100 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Max(500)
  limit?: number = 100;
}

// ============================================
// SECTOR DTOs
// ============================================

export class CreateSectorDto {
  @ApiProperty()
  @IsString()
  sectorId: string;

  @ApiProperty()
  @IsString()
  nombre: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  numComites?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  numEstandares?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  srcUrl?: string;
}

// ============================================
// HARVEST/SYNC DTOs
// ============================================

export class StartHarvestDto {
  @ApiProperty({ enum: HarvestMode, default: HarvestMode.PROBE })
  @IsEnum(HarvestMode)
  mode: HarvestMode;

  @ApiPropertyOptional({
    description: "Components to harvest",
    type: [String],
    enum: RenecComponent,
  })
  @IsArray()
  @IsEnum(RenecComponent, { each: true })
  @IsOptional()
  components?: RenecComponent[];

  @ApiPropertyOptional({ description: "Max pages to crawl", default: 500 })
  @IsNumber()
  @IsOptional()
  @Max(5000)
  maxPages?: number;

  @ApiPropertyOptional({ description: "Concurrent requests", default: 5 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  concurrency?: number;
}

export class HarvestRunDto {
  @ApiProperty()
  harvestId: string;

  @ApiProperty({ enum: HarvestMode })
  mode: HarvestMode;

  @ApiProperty({ enum: HarvestStatus })
  status: HarvestStatus;

  @ApiProperty()
  startTime: Date;

  @ApiPropertyOptional()
  endTime?: Date;

  @ApiProperty()
  itemsScraped: number;

  @ApiProperty()
  pagesCrawled: number;

  @ApiProperty()
  errors: number;

  @ApiPropertyOptional()
  metadata?: Record<string, unknown>;
}

// ============================================
// SEARCH DTOs
// ============================================

export class RenecSearchDto {
  @ApiProperty()
  @IsString()
  q: string;

  @ApiPropertyOptional({
    description: "Filter by type",
    enum: ["centro", "certificador", "ec", "sector"],
  })
  @IsString()
  @IsOptional()
  type?: "centro" | "certificador" | "ec" | "sector";

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  skip?: number = 0;

  @ApiPropertyOptional({ default: 50 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Max(200)
  limit?: number = 50;
}

export class RenecSearchResultDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: "centro" | "certificador" | "ec" | "sector";

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  subtitle?: string;

  @ApiPropertyOptional()
  location?: string;

  @ApiProperty()
  score: number;
}

// ============================================
// STATS DTOs
// ============================================

export class RenecStatsDto {
  @ApiProperty()
  totalCentros: number;

  @ApiProperty()
  totalCertificadores: number;

  @ApiProperty()
  totalECStandards: number;

  @ApiProperty()
  totalSectores: number;

  @ApiProperty()
  lastHarvestDate: Date | null;

  @ApiProperty()
  lastHarvestStatus: HarvestStatus | null;

  @ApiProperty()
  dataFreshness: {
    centros: number;
    certificadores: number;
    ecStandards: number;
  };
}

// ============================================
// VALIDATION PATTERNS (from renec-harvester)
// ============================================

export const RENEC_VALIDATION_PATTERNS = {
  ec_code: /^EC\d{4}(\.\d{2})?$/,
  oec_code: /^OC\d{3,4}$/,
  ce_code: /^CE\d{4,5}$/,
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^[\d\s\-\+\(\)]+$/,
  rfc: /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/,
  curp: /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/,
};

// INEGI State codes mapping
export const ESTADO_INEGI_MAP: Record<string, string> = {
  Aguascalientes: "01",
  "Baja California": "02",
  "Baja California Sur": "03",
  Campeche: "04",
  Coahuila: "05",
  Colima: "06",
  Chiapas: "07",
  Chihuahua: "08",
  "Ciudad de México": "09",
  CDMX: "09",
  "Distrito Federal": "09",
  Durango: "10",
  Guanajuato: "11",
  Guerrero: "12",
  Hidalgo: "13",
  Jalisco: "14",
  México: "15",
  "Estado de México": "15",
  Michoacán: "16",
  Morelos: "17",
  Nayarit: "18",
  "Nuevo León": "19",
  Oaxaca: "20",
  Puebla: "21",
  Querétaro: "22",
  "Quintana Roo": "23",
  "San Luis Potosí": "24",
  Sinaloa: "25",
  Sonora: "26",
  Tabasco: "27",
  Tamaulipas: "28",
  Tlaxcala: "29",
  Veracruz: "30",
  Yucatán: "31",
  Zacatecas: "32",
};
