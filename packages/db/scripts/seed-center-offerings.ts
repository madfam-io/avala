/**
 * Seed EC-Center Offerings
 *
 * Creates RenecCenterOffering records linking centers to their EC standards
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

interface Center {
  id: string;
  centerId: string;
  name: string;
  nombre: string;
  activo: boolean;
  ec_codes: string[];
}

async function main() {
  console.log("🏢 Seeding EC-Center Offerings...\n");

  const centersFile = join(__dirname, "../data/renec/centers.json");

  if (!existsSync(centersFile)) {
    console.error("❌ Centers file not found. Run transform-renec-data.ts first.");
    process.exit(1);
  }

  const centers: Center[] = JSON.parse(readFileSync(centersFile, "utf-8"));

  // Build relationships from centers data
  const relations: { ecCode: string; centerId: string }[] = [];
  for (const center of centers) {
    for (const ecCode of center.ec_codes || []) {
      relations.push({ ecCode, centerId: center.centerId });
    }
  }

  console.log(`   Loaded ${centers.length} centers with ${relations.length} EC relationships\n`);

  // Get all EC standards and centers from database
  const ecStandards = await prisma.renecEC.findMany({
    select: { id: true, ecClave: true },
  });
  const dbCenters = await prisma.renecCenter.findMany({
    select: { id: true, centerId: true },
  });

  console.log(`   Found ${ecStandards.length} EC standards in database`);
  console.log(`   Found ${dbCenters.length} centers in database\n`);

  // Create lookup maps
  const ecMap = new Map(ecStandards.map((ec) => [ec.ecClave, ec.id]));
  const centerMap = new Map(dbCenters.map((c) => [c.centerId, c.id]));

  // Process relationships
  let created = 0;
  let skipped = 0;
  let notFound = 0;

  // Get existing offerings to avoid duplicates
  const existingOfferings = await prisma.renecCenterOffering.findMany({
    select: { ecId: true, centerId: true },
  });
  const existingSet = new Set(
    existingOfferings.map((o) => `${o.ecId}-${o.centerId}`)
  );

  console.log(`   Existing offerings: ${existingOfferings.length}`);
  console.log("   Creating new offerings...\n");

  // Batch process for efficiency
  const batchSize = 100;
  const toCreate: { ecId: string; centerId: string }[] = [];

  for (const rel of relations) {
    const ecId = ecMap.get(rel.ecCode);
    const centerId = centerMap.get(rel.centerId);

    if (!ecId || !centerId) {
      notFound++;
      continue;
    }

    const key = `${ecId}-${centerId}`;
    if (existingSet.has(key)) {
      skipped++;
      continue;
    }

    toCreate.push({
      ecId,
      centerId,
    });
    existingSet.add(key); // Prevent duplicates within this run
  }

  // Batch insert
  if (toCreate.length > 0) {
    for (let i = 0; i < toCreate.length; i += batchSize) {
      const batch = toCreate.slice(i, i + batchSize);
      await prisma.renecCenterOffering.createMany({
        data: batch,
        skipDuplicates: true,
      });
      created += batch.length;
      process.stdout.write(`\r   Progress: ${created}/${toCreate.length}`);
    }
    console.log("\n");
  }

  // Summary
  console.log("✅ Center offerings seeding completed!\n");
  console.log("📊 Summary:");
  console.log(`   Created: ${created}`);
  console.log(`   Skipped (existing): ${skipped}`);
  console.log(`   Not found (EC or Center missing): ${notFound}`);

  // Final count
  const totalOfferings = await prisma.renecCenterOffering.count();
  console.log(`\n📈 Total center offerings in database: ${totalOfferings}`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
