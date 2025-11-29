/**
 * Seed EC-Certifier Accreditations
 *
 * Creates RenecAccreditation records linking certifiers to their EC standards
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

interface Relation {
  ecCode: string;
  certifierId: string;
}

async function main() {
  console.log("🔗 Seeding EC-Certifier Accreditations...\n");

  const relationsFile = join(__dirname, "../data/renec/ec-certifier-relations.json");

  if (!existsSync(relationsFile)) {
    console.error("❌ Relations file not found. Run transform-renec-data.ts first.");
    process.exit(1);
  }

  const relations: Relation[] = JSON.parse(readFileSync(relationsFile, "utf-8"));
  console.log(`   Loaded ${relations.length} EC-Certifier relationships\n`);

  // Get all EC standards and certifiers from database
  const ecStandards = await prisma.renecEC.findMany({
    select: { id: true, ecClave: true },
  });
  const certifiers = await prisma.renecCertifier.findMany({
    select: { id: true, certId: true },
  });

  console.log(`   Found ${ecStandards.length} EC standards in database`);
  console.log(`   Found ${certifiers.length} certifiers in database\n`);

  // Create lookup maps
  const ecMap = new Map(ecStandards.map((ec) => [ec.ecClave, ec.id]));
  const certMap = new Map(certifiers.map((c) => [c.certId, c.id]));

  // Process relationships
  let created = 0;
  let skipped = 0;
  let notFound = 0;

  // Get existing accreditations to avoid duplicates
  const existingAccreditations = await prisma.renecAccreditation.findMany({
    select: { ecId: true, certifierId: true },
  });
  const existingSet = new Set(
    existingAccreditations.map((a) => `${a.ecId}-${a.certifierId}`)
  );

  console.log(`   Existing accreditations: ${existingAccreditations.length}`);
  console.log("   Creating new accreditations...\n");

  // Batch process for efficiency
  const batchSize = 100;
  const toCreate: { ecId: string; certifierId: string; fechaAcreditacion: Date }[] = [];

  for (const rel of relations) {
    const ecId = ecMap.get(rel.ecCode);
    const certId = certMap.get(rel.certifierId);

    if (!ecId || !certId) {
      notFound++;
      continue;
    }

    const key = `${ecId}-${certId}`;
    if (existingSet.has(key)) {
      skipped++;
      continue;
    }

    toCreate.push({
      ecId,
      certifierId: certId,
      fechaAcreditacion: new Date(),
    });
    existingSet.add(key); // Prevent duplicates within this run
  }

  // Batch insert
  if (toCreate.length > 0) {
    for (let i = 0; i < toCreate.length; i += batchSize) {
      const batch = toCreate.slice(i, i + batchSize);
      await prisma.renecAccreditation.createMany({
        data: batch,
        skipDuplicates: true,
      });
      created += batch.length;
      process.stdout.write(`\r   Progress: ${created}/${toCreate.length}`);
    }
    console.log("\n");
  }

  // Summary
  console.log("✅ Accreditation seeding completed!\n");
  console.log("📊 Summary:");
  console.log(`   Created: ${created}`);
  console.log(`   Skipped (existing): ${skipped}`);
  console.log(`   Not found (EC or Certifier missing): ${notFound}`);

  // Final count
  const totalAccreditations = await prisma.renecAccreditation.count();
  console.log(`\n📈 Total accreditations in database: ${totalAccreditations}`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
