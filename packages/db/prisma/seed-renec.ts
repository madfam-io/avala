/**
 * RENEC Production Seed Script
 *
 * Seeds the database with real RENEC data from harvested JSON files
 * or triggers a live harvest if no cached data is available.
 *
 * Usage:
 *   pnpm db:seed:renec                    # Seed from cached data
 *   pnpm db:seed:renec --fresh            # Harvest fresh data first
 *   pnpm db:seed:renec --data ./data      # Specify data directory
 */

import { PrismaClient } from "@prisma/client";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

interface CLIArgs {
  dataDir: string;
  fresh: boolean;
  verbose: boolean;
}

interface ECStandard {
  code?: string;
  ecClave?: string;
  title?: string;
  titulo?: string;
  version?: string;
  active?: boolean;
  vigente?: boolean;
  sector?: string;
  level?: number;
  nivelCompetencia?: number;
  purpose?: string;
  proposito?: string;
  url?: string;
  sourceUrl?: string;
}

interface Certifier {
  id?: string;
  certId?: string;
  name?: string;
  razonSocial?: string;
  tradeName?: string;
  nombreComercial?: string;
  active?: boolean;
  activo?: boolean;
  address?: string;
  direccion?: string;
  phone?: string;
  telefono?: string;
  email?: string;
  correo?: string;
  website?: string;
  sitioWeb?: string;
  legalRep?: string;
  representanteLegal?: string;
  state?: string;
  estado?: string;
  url?: string;
  sourceUrl?: string;
}

interface Center {
  id?: string;
  centerId?: string;
  name?: string;
  nombre?: string;
  active?: boolean;
  activo?: boolean;
  address?: string;
  direccion?: string;
  phone?: string;
  telefono?: string;
  email?: string;
  correo?: string;
  state?: string;
  estado?: string;
  municipality?: string;
  municipio?: string;
  zipCode?: string;
  codigoPostal?: string;
  certifierId?: string;
  url?: string;
  sourceUrl?: string;
}

// INEGI State codes mapping
const ESTADO_INEGI_MAP: Record<string, string> = {
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

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const result: CLIArgs = {
    dataDir: "./data/renec",
    fresh: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case "--data":
      case "-d":
        result.dataDir = next;
        i++;
        break;
      case "--fresh":
      case "-f":
        result.fresh = true;
        break;
      case "--verbose":
      case "-v":
        result.verbose = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
    }
  }

  return result;
}

function printHelp() {
  console.log(`
RENEC Production Seed Script

Seeds the database with real RENEC (CONOCER) competency data.

Usage:
  pnpm db:seed:renec [options]

Options:
  -d, --data <dir>    Directory containing harvested JSON files (default: ./data/renec)
  -f, --fresh         Run a fresh harvest before seeding
  -v, --verbose       Enable verbose logging
  -h, --help          Show this help message

Data Files Expected:
  - ec-standards.json     EC competency standards
  - certifiers.json       Certification entities (ECE/OC)
  - centers.json          Evaluation centers

Examples:
  # Seed from default data directory
  pnpm db:seed:renec

  # Seed from specific directory
  pnpm db:seed:renec --data /path/to/renec/data

  # Run fresh harvest first, then seed
  pnpm db:seed:renec --fresh
`);
}

function log(message: string, verbose: boolean) {
  if (verbose) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
}

function normalizeEstadoInegi(estado: string | null | undefined): string | null {
  if (!estado) return null;
  const normalized = estado.trim();
  return ESTADO_INEGI_MAP[normalized] || null;
}

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.length === 10) return `+52${digits}`;
  return digits;
}

async function runFreshHarvest(dataDir: string): Promise<void> {
  console.log("🌾 Running fresh RENEC harvest...");
  console.log("   This may take several minutes.\n");

  try {
    // Dynamic import of the renec-client
    const { harvestAll } = await import("@avala/renec-client");
    const { writeFileSync, mkdirSync } = await import("fs");

    // Ensure output directory exists
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    const config = {
      headless: true,
      politeDelayMs: [800, 1500] as [number, number],
    };

    const data = await harvestAll(config);

    // Save harvested data
    const files = [
      { name: "ec-standards.json", data: data.ecStandards },
      { name: "certifiers.json", data: data.certifiers },
      { name: "centers.json", data: data.centers },
      { name: "sectors.json", data: data.sectors },
      { name: "harvest-metadata.json", data: { harvestedAt: new Date().toISOString() } },
    ];

    for (const file of files) {
      const path = join(dataDir, file.name);
      writeFileSync(path, JSON.stringify(file.data, null, 2));
      console.log(`   ✅ Saved ${file.name}`);
    }

    console.log("\n   Harvest complete!\n");
  } catch (error) {
    console.error("❌ Failed to run harvest:", error);
    console.log("   Please run the harvest CLI separately:");
    console.log("   cd packages/renec-client && pnpm harvest\n");
    throw error;
  }
}

function loadJsonFile<T>(filePath: string, name: string): T[] {
  if (!existsSync(filePath)) {
    console.log(`   ⚠️  ${name} not found at ${filePath}`);
    return [];
  }

  try {
    const content = readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.log(`   ⚠️  Failed to parse ${name}:`, error);
    return [];
  }
}

async function seedECStandards(ecStandards: ECStandard[], verbose: boolean): Promise<number> {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const ec of ecStandards) {
    const ecClave = ec.code || ec.ecClave;
    if (!ecClave) {
      skipped++;
      continue;
    }

    try {
      const existing = await prisma.renecEC.findUnique({
        where: { ecClave },
      });

      const data = {
        titulo: ec.title || ec.titulo || "",
        version: ec.version || "01",
        vigente: ec.active !== false && ec.vigente !== false,
        sector: ec.sector || null,
        nivelCompetencia: ec.level || ec.nivelCompetencia || null,
        proposito: ec.purpose || ec.proposito || null,
        competencias: [],
        elementosJson: [],
        critDesempeno: [],
        critConocimiento: [],
        critProducto: [],
        sourceUrl: ec.url || ec.sourceUrl || null,
        lastSyncedAt: new Date(),
      };

      if (existing) {
        await prisma.renecEC.update({
          where: { ecClave },
          data,
        });
        updated++;
      } else {
        await prisma.renecEC.create({
          data: {
            ecClave,
            ...data,
          },
        });
        created++;
      }

      log(`EC ${ecClave}: ${existing ? "updated" : "created"}`, verbose);
    } catch (error) {
      log(`Error processing EC ${ecClave}: ${error}`, verbose);
      skipped++;
    }
  }

  return created + updated;
}

async function seedCertifiers(certifiers: Certifier[], verbose: boolean): Promise<number> {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const cert of certifiers) {
    const certId = cert.id || cert.certId;
    if (!certId) {
      skipped++;
      continue;
    }

    try {
      const existing = await prisma.renecCertifier.findUnique({
        where: { certId },
      });

      const estado = cert.state || cert.estado;
      const data = {
        razonSocial: cert.name || cert.razonSocial || "",
        nombreComercial: cert.tradeName || cert.nombreComercial || null,
        activo: cert.active !== false && cert.activo !== false,
        direccion: cert.address || cert.direccion || null,
        telefono: normalizePhone(cert.phone || cert.telefono),
        email: cert.email || cert.correo || null,
        sitioWeb: cert.website || cert.sitioWeb || null,
        representanteLegal: cert.legalRep || cert.representanteLegal || null,
        estado: estado || null,
        estadoInegi: normalizeEstadoInegi(estado),
        sourceUrl: cert.url || cert.sourceUrl || null,
        lastSyncedAt: new Date(),
      };

      if (existing) {
        await prisma.renecCertifier.update({
          where: { certId },
          data,
        });
        updated++;
      } else {
        await prisma.renecCertifier.create({
          data: {
            certId,
            ...data,
          },
        });
        created++;
      }

      log(`Certifier ${certId}: ${existing ? "updated" : "created"}`, verbose);
    } catch (error) {
      log(`Error processing certifier ${certId}: ${error}`, verbose);
      skipped++;
    }
  }

  return created + updated;
}

async function seedCenters(centers: Center[], verbose: boolean): Promise<number> {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const center of centers) {
    const centerId = center.id || center.centerId;
    if (!centerId) {
      skipped++;
      continue;
    }

    try {
      const existing = await prisma.renecCenter.findUnique({
        where: { centerId },
      });

      const estado = center.state || center.estado;
      const data = {
        nombre: center.name || center.nombre || "",
        activo: center.active !== false && center.activo !== false,
        direccion: center.address || center.direccion || null,
        telefono: normalizePhone(center.phone || center.telefono),
        email: center.email || center.correo || null,
        estado: estado || null,
        estadoInegi: normalizeEstadoInegi(estado),
        municipio: center.municipality || center.municipio || null,
        codigoPostal: center.zipCode || center.codigoPostal || null,
        sourceUrl: center.url || center.sourceUrl || null,
        lastSyncedAt: new Date(),
      };

      // Link to certifier if provided
      if (center.certifierId) {
        const certifier = await prisma.renecCertifier.findUnique({
          where: { certId: center.certifierId },
        });
        if (certifier) {
          (data as Record<string, unknown>).certifierId = certifier.id;
        }
      }

      if (existing) {
        await prisma.renecCenter.update({
          where: { centerId },
          data,
        });
        updated++;
      } else {
        await prisma.renecCenter.create({
          data: {
            centerId,
            ...data,
          },
        });
        created++;
      }

      log(`Center ${centerId}: ${existing ? "updated" : "created"}`, verbose);
    } catch (error) {
      log(`Error processing center ${centerId}: ${error}`, verbose);
      skipped++;
    }
  }

  return created + updated;
}

async function createSyncJobRecord(
  itemsProcessed: number,
  startTime: Date,
): Promise<void> {
  await prisma.renecSyncJob.create({
    data: {
      jobType: "FULL_SYNC",
      status: "COMPLETED",
      startedAt: startTime,
      completedAt: new Date(),
      itemsProcessed,
      itemsCreated: itemsProcessed,
      itemsUpdated: 0,
      itemsSkipped: 0,
      errors: [],
    },
  });
}

async function main() {
  const args = parseArgs();
  const startTime = new Date();

  console.log("🌱 RENEC Production Seed\n");
  console.log(`   Data directory: ${args.dataDir}`);
  console.log(`   Fresh harvest: ${args.fresh}`);
  console.log("");

  // Run fresh harvest if requested
  if (args.fresh) {
    await runFreshHarvest(args.dataDir);
  }

  // Check if data directory exists
  if (!existsSync(args.dataDir)) {
    console.log(`❌ Data directory not found: ${args.dataDir}`);
    console.log("   Run with --fresh to harvest data first, or specify a valid --data directory.\n");
    process.exit(1);
  }

  // List available data files
  const files = readdirSync(args.dataDir).filter((f) => f.endsWith(".json"));
  console.log(`   Found ${files.length} JSON files: ${files.join(", ")}\n`);

  // Load data files
  console.log("📂 Loading data files...");
  const ecStandards = loadJsonFile<ECStandard>(
    join(args.dataDir, "ec-standards.json"),
    "EC Standards",
  );
  const certifiers = loadJsonFile<Certifier>(
    join(args.dataDir, "certifiers.json"),
    "Certifiers",
  );
  const centers = loadJsonFile<Center>(
    join(args.dataDir, "centers.json"),
    "Centers",
  );

  console.log(`   EC Standards: ${ecStandards.length}`);
  console.log(`   Certifiers: ${certifiers.length}`);
  console.log(`   Centers: ${centers.length}\n`);

  if (ecStandards.length === 0 && certifiers.length === 0 && centers.length === 0) {
    console.log("⚠️  No data to seed. Run with --fresh to harvest data first.\n");
    process.exit(1);
  }

  // Seed data
  console.log("💾 Seeding database...\n");

  let totalProcessed = 0;

  if (ecStandards.length > 0) {
    console.log("   Seeding EC Standards...");
    const ecCount = await seedECStandards(ecStandards, args.verbose);
    console.log(`   ✅ Processed ${ecCount} EC Standards\n`);
    totalProcessed += ecCount;
  }

  if (certifiers.length > 0) {
    console.log("   Seeding Certifiers...");
    const certCount = await seedCertifiers(certifiers, args.verbose);
    console.log(`   ✅ Processed ${certCount} Certifiers\n`);
    totalProcessed += certCount;
  }

  if (centers.length > 0) {
    console.log("   Seeding Centers...");
    const centerCount = await seedCenters(centers, args.verbose);
    console.log(`   ✅ Processed ${centerCount} Centers\n`);
    totalProcessed += centerCount;
  }

  // Create sync job record
  await createSyncJobRecord(totalProcessed, startTime);

  // Summary
  const duration = ((Date.now() - startTime.getTime()) / 1000).toFixed(2);
  console.log("✅ RENEC seed completed!\n");
  console.log("📊 Summary:");
  console.log(`   Total records processed: ${totalProcessed}`);
  console.log(`   Duration: ${duration}s`);
  console.log(`   Sync job recorded in database\n`);

  // Get final counts from database
  const [ecCount, certCount, centerCount] = await Promise.all([
    prisma.renecEC.count(),
    prisma.renecCertifier.count(),
    prisma.renecCenter.count(),
  ]);

  console.log("📈 Database State:");
  console.log(`   EC Standards: ${ecCount}`);
  console.log(`   Certifiers: ${certCount}`);
  console.log(`   Centers: ${centerCount}\n`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding RENEC data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
