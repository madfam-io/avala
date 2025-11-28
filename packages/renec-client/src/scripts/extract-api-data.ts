#!/usr/bin/env npx tsx

/**
 * API-based data extraction for CONOCER
 * Extracts committees with their associated EC standards
 */

import * as fs from "fs";
import * as path from "path";

const OUTPUT_DIR = "./data/extracted";
const DELAY_MS = 100;

interface Committee {
  id: number;
  clave: string;
  nombre: string;
  presidente?: string;
  vicepresidente?: string;
  calleNumero?: string;
  colonia?: string;
  codigoPostal?: number;
  localidad?: string;
  telefonos?: string;
  correo?: string;
  url?: string;
  idSectorProductivo?: number;
  sectorProductivoStr?: string;
  delegacionStr?: string;
  entidadStr?: string;
  estandaresAsociados?: {
    codigo: string;
    titulo: string;
  }[];
}

interface ECStandard {
  idEstandarCompetencia: string;
  idSectorProductivo: string;
  codigo: string;
  nivel: string;
  titulo: string;
  comite: string;
  secProductivo: string;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });
    if (!response.ok) {
      console.error(`Fetch failed: ${response.status} ${response.statusText}`);
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error(`Fetch error: ${error}`);
    return null;
  }
}

async function extractCommittees(): Promise<Committee[]> {
  console.log("📋 Extracting committees from API...\n");

  const committees: Committee[] = [];
  const maxId = 800; // Scan up to ID 800
  let consecutiveNotFound = 0;

  for (let id = 1; id <= maxId; id++) {
    const url = `https://conocer.gob.mx/CONOCERBACKCITAS/comites/${id}`;
    const data = await fetchJSON<{
      responseStatus: number;
      results: Committee;
    }>(url);

    if (data?.responseStatus === 200 && data.results) {
      const committee = { ...data.results, id };
      committees.push(committee);
      consecutiveNotFound = 0;

      // Progress update every 10 found
      if (committees.length % 10 === 0) {
        console.log(
          `  Found ${committees.length} committees (scanning ID ${id})...`,
        );
      }
    } else {
      consecutiveNotFound++;
    }

    // Stop if 50 consecutive not found after ID 500
    if (id > 500 && consecutiveNotFound > 50) {
      console.log(`\n  Stopping scan at ID ${id} (50 consecutive not found)`);
      break;
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n✅ Found ${committees.length} committees total`);
  return committees;
}

async function extractAllECStandards(): Promise<ECStandard[]> {
  console.log("📋 Fetching all EC standards from API...");

  const url =
    "https://conocer.gob.mx/CONOCERBACKCITAS/sectoresProductivos/getEstandaresAll";
  const data = await fetchJSON<ECStandard[]>(url);

  if (!data) {
    throw new Error("Failed to fetch EC standards");
  }

  console.log(`✅ Fetched ${data.length} EC standards`);
  return data;
}

function analyzeData(committees: Committee[], ecStandards: ECStandard[]) {
  console.log("\n📊 Analyzing extracted data...\n");

  // EC codes associated with committees
  const ecCodesFromCommittees = new Set<string>();
  for (const c of committees) {
    for (const ec of c.estandaresAsociados || []) {
      if (ec.codigo) ecCodesFromCommittees.add(ec.codigo);
    }
  }

  // EC codes from standards
  const ecCodesFromStandards = new Set(ecStandards.map((ec) => ec.codigo));

  // Committee names from standards
  const committeeNamesFromStandards = new Set(
    ecStandards.map((ec) => ec.comite).filter(Boolean),
  );

  // Sectors
  const sectors = new Map<string, number>();
  for (const ec of ecStandards) {
    const count = sectors.get(ec.secProductivo) || 0;
    sectors.set(ec.secProductivo, count + 1);
  }

  console.log("=== EXTRACTION STATISTICS ===");
  console.log(`EC Standards: ${ecStandards.length}`);
  console.log(`Committees (from API): ${committees.length}`);
  console.log(
    `Unique committee names (from standards): ${committeeNamesFromStandards.size}`,
  );
  console.log(`Sectors: ${sectors.size}`);
  console.log(`EC codes linked to committees: ${ecCodesFromCommittees.size}`);
  console.log(
    `EC codes coverage: ${((ecCodesFromCommittees.size / ecCodesFromStandards.size) * 100).toFixed(1)}%`,
  );

  // Top sectors
  console.log("\nTop 10 Sectors:");
  const sortedSectors = Array.from(sectors.entries()).sort(
    (a, b) => b[1] - a[1],
  );
  for (const [sector, count] of sortedSectors.slice(0, 10)) {
    console.log(`  ${count.toString().padStart(4)} - ${sector}`);
  }

  return {
    totalECs: ecStandards.length,
    totalCommittees: committees.length,
    totalSectors: sectors.size,
    ecCodesLinkedToCommittees: ecCodesFromCommittees.size,
    coverage: (ecCodesFromCommittees.size / ecCodesFromStandards.size) * 100,
  };
}

function saveData(
  committees: Committee[],
  ecStandards: ECStandard[],
  stats: any,
) {
  console.log("\n💾 Saving extracted data...");

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Save committees
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "committees_complete.json"),
    JSON.stringify(committees, null, 2),
  );
  console.log(`  ✓ committees_complete.json (${committees.length} records)`);

  // Save EC standards
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "ec_standards_complete.json"),
    JSON.stringify(ecStandards, null, 2),
  );
  console.log(`  ✓ ec_standards_complete.json (${ecStandards.length} records)`);

  // Extract unique sectors
  const sectorsMap = new Map<string, { id: string; count: number }>();
  for (const ec of ecStandards) {
    if (!sectorsMap.has(ec.secProductivo)) {
      sectorsMap.set(ec.secProductivo, { id: ec.idSectorProductivo, count: 1 });
    } else {
      sectorsMap.get(ec.secProductivo)!.count++;
    }
  }
  const sectors = Array.from(sectorsMap.entries()).map(([name, data]) => ({
    id: data.id,
    nombre: name,
    ecCount: data.count,
  }));
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "sectors_complete.json"),
    JSON.stringify(sectors, null, 2),
  );
  console.log(`  ✓ sectors_complete.json (${sectors.length} records)`);

  // Build EC-to-committee mapping
  const ecToCommittee = new Map<
    string,
    { committeeId: number; committeeName: string }
  >();
  for (const c of committees) {
    for (const ec of c.estandaresAsociados || []) {
      if (ec.codigo) {
        ecToCommittee.set(ec.codigo, {
          committeeId: c.id,
          committeeName: c.nombre,
        });
      }
    }
  }

  // Enriched EC standards with committee IDs
  const enrichedECs = ecStandards.map((ec) => ({
    ...ec,
    committeeId: ecToCommittee.get(ec.codigo)?.committeeId || null,
  }));
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "ec_standards_enriched.json"),
    JSON.stringify(enrichedECs, null, 2),
  );
  console.log(`  ✓ ec_standards_enriched.json (${enrichedECs.length} records)`);

  // Save stats
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "extraction_stats.json"),
    JSON.stringify(
      {
        ...stats,
        extractedAt: new Date().toISOString(),
        apiEndpoints: [
          "https://conocer.gob.mx/CONOCERBACKCITAS/sectoresProductivos/getEstandaresAll",
          "https://conocer.gob.mx/CONOCERBACKCITAS/comites/{id}",
        ],
      },
      null,
      2,
    ),
  );
  console.log(`  ✓ extraction_stats.json`);

  console.log("\n✅ All data saved to " + OUTPUT_DIR);
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║     CONOCER API Data Extraction                            ║");
  console.log(
    "╚════════════════════════════════════════════════════════════╝\n",
  );

  try {
    // Extract EC standards first (fast)
    const ecStandards = await extractAllECStandards();

    // Extract committees (slower, needs ID scanning)
    const committees = await extractCommittees();

    // Analyze
    const stats = analyzeData(committees, ecStandards);

    // Save
    saveData(committees, ecStandards, stats);

    console.log("\n🎉 Extraction complete!");
  } catch (error) {
    console.error("❌ Extraction failed:", error);
    process.exit(1);
  }
}

main();
