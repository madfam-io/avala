/**
 * Transform extracted RENEC data into seed-compatible format
 *
 * Converts master_ece_registry.json and master_ccap_registry.json
 * into the format expected by seed-renec.ts
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const EXTRACTED_DIR = "../../renec-client/data/extracted";
const OUTPUT_DIR = "./data/renec";

interface ECERegistry {
  id: string;
  canonical_name: string;
  alternate_names: string[];
  normalized_key: string;
  entity_type: string;
  ec_codes: string[];
}

interface CCAPRegistry {
  id: string;
  canonical_name: string;
  alternate_names: string[];
  normalized_key: string;
  entity_type: string;
  ec_codes: string[];
}

interface MasterRegistry<T> {
  generated_at: string;
  description: string;
  total_count: number;
  registry: T[];
}

interface Certifier {
  id: string;
  certId: string;
  name: string;
  razonSocial: string;
  tipo: string;
  activo: boolean;
  ec_codes: string[];
}

interface Center {
  id: string;
  centerId: string;
  name: string;
  nombre: string;
  activo: boolean;
  ec_codes: string[];
}

function main() {
  console.log("🔄 Transforming RENEC extracted data...\n");

  // Load ECE registry (certifiers)
  const eceFile = join(__dirname, EXTRACTED_DIR, "master_ece_registry.json");
  if (!existsSync(eceFile)) {
    console.error(`❌ ECE registry not found: ${eceFile}`);
    process.exit(1);
  }

  const eceData: MasterRegistry<ECERegistry> = JSON.parse(
    readFileSync(eceFile, "utf-8")
  );
  console.log(`   Loaded ${eceData.total_count} ECEs from master registry`);

  // Transform ECEs to certifiers format
  const certifiers: Certifier[] = eceData.registry.map((ece) => ({
    id: ece.id,
    certId: ece.id,
    name: ece.canonical_name,
    razonSocial: ece.canonical_name,
    tipo: ece.entity_type || "ECE",
    activo: true,
    ec_codes: ece.ec_codes,
  }));

  // Load CCAP registry (centers)
  const ccapFile = join(__dirname, EXTRACTED_DIR, "master_ccap_registry.json");
  let centers: Center[] = [];

  if (existsSync(ccapFile)) {
    const ccapData: MasterRegistry<CCAPRegistry> = JSON.parse(
      readFileSync(ccapFile, "utf-8")
    );
    console.log(`   Loaded ${ccapData.total_count} CCAPs from master registry`);

    centers = ccapData.registry.map((ccap) => ({
      id: ccap.id,
      centerId: ccap.id,
      name: ccap.canonical_name,
      nombre: ccap.canonical_name,
      activo: true,
      ec_codes: ccap.ec_codes || [],
    }));
  } else {
    console.log("   ⚠️  CCAP registry not found, skipping centers");
  }

  // Write certifiers.json
  const certifiersOut = join(__dirname, "..", OUTPUT_DIR, "certifiers.json");
  writeFileSync(certifiersOut, JSON.stringify(certifiers, null, 2));
  console.log(`\n   ✅ Wrote ${certifiers.length} certifiers to certifiers.json`);

  // Write centers.json
  const centersOut = join(__dirname, "..", OUTPUT_DIR, "centers.json");
  writeFileSync(centersOut, JSON.stringify(centers, null, 2));
  console.log(`   ✅ Wrote ${centers.length} centers to centers.json`);

  // Create EC-Certifier relationships file for later use
  const relationships: { ecCode: string; certifierId: string }[] = [];
  for (const cert of certifiers) {
    for (const ecCode of cert.ec_codes) {
      relationships.push({ ecCode, certifierId: cert.certId });
    }
  }

  const relationsOut = join(__dirname, "..", OUTPUT_DIR, "ec-certifier-relations.json");
  writeFileSync(relationsOut, JSON.stringify(relationships, null, 2));
  console.log(`   ✅ Wrote ${relationships.length} EC-Certifier relationships`);

  console.log("\n✅ Transformation complete!\n");
  console.log("   Next: Run `pnpm db:seed:renec` to import into database");
}

main();
