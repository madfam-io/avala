#!/usr/bin/env npx tsx
/**
 * RENEC Data Seeder
 *
 * Seeds the database with initial RENEC data from the harvester.
 * Run this script to populate EC standards, certifiers, and centers.
 *
 * Usage:
 *   npx tsx scripts/seed-renec.ts [options]
 *
 * Options:
 *   --ec-only       Only sync EC standards
 *   --certifiers    Only sync certifiers
 *   --centers       Only sync centers
 *   --full          Full sync (default)
 *   --dry-run       Show what would be synced without making changes
 */

import { PrismaClient } from "@prisma/client";

// Initialize Prisma client
const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);
const flags = {
  ecOnly: args.includes("--ec-only"),
  certifiersOnly: args.includes("--certifiers"),
  centersOnly: args.includes("--centers"),
  dryRun: args.includes("--dry-run"),
  full: args.includes("--full") || args.length === 0,
};

// Mexican states with INEGI codes for normalization
const MEXICAN_STATES: Record<string, { name: string; inegi: string }> = {
  aguascalientes: { name: "Aguascalientes", inegi: "01" },
  "baja california": { name: "Baja California", inegi: "02" },
  "baja california sur": { name: "Baja California Sur", inegi: "03" },
  campeche: { name: "Campeche", inegi: "04" },
  coahuila: { name: "Coahuila", inegi: "05" },
  colima: { name: "Colima", inegi: "06" },
  chiapas: { name: "Chiapas", inegi: "07" },
  chihuahua: { name: "Chihuahua", inegi: "08" },
  cdmx: { name: "Ciudad de México", inegi: "09" },
  "ciudad de mexico": { name: "Ciudad de México", inegi: "09" },
  "distrito federal": { name: "Ciudad de México", inegi: "09" },
  durango: { name: "Durango", inegi: "10" },
  guanajuato: { name: "Guanajuato", inegi: "11" },
  guerrero: { name: "Guerrero", inegi: "12" },
  hidalgo: { name: "Hidalgo", inegi: "13" },
  jalisco: { name: "Jalisco", inegi: "14" },
  mexico: { name: "Estado de México", inegi: "15" },
  "estado de mexico": { name: "Estado de México", inegi: "15" },
  michoacan: { name: "Michoacán", inegi: "16" },
  morelos: { name: "Morelos", inegi: "17" },
  nayarit: { name: "Nayarit", inegi: "18" },
  "nuevo leon": { name: "Nuevo León", inegi: "19" },
  oaxaca: { name: "Oaxaca", inegi: "20" },
  puebla: { name: "Puebla", inegi: "21" },
  queretaro: { name: "Querétaro", inegi: "22" },
  "quintana roo": { name: "Quintana Roo", inegi: "23" },
  "san luis potosi": { name: "San Luis Potosí", inegi: "24" },
  sinaloa: { name: "Sinaloa", inegi: "25" },
  sonora: { name: "Sonora", inegi: "26" },
  tabasco: { name: "Tabasco", inegi: "27" },
  tamaulipas: { name: "Tamaulipas", inegi: "28" },
  tlaxcala: { name: "Tlaxcala", inegi: "29" },
  veracruz: { name: "Veracruz", inegi: "30" },
  yucatan: { name: "Yucatán", inegi: "31" },
  zacatecas: { name: "Zacatecas", inegi: "32" },
};

function normalizeState(
  state: string | null | undefined,
): { name: string; inegi: string } | null {
  if (!state) return null;

  const normalized = state
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .trim();

  return MEXICAN_STATES[normalized] || null;
}

// Create hash for change detection
function createHash(data: unknown): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

// Sample EC standards data (would come from harvester in production)
const SAMPLE_EC_STANDARDS = [
  {
    ecClave: "EC0217.01",
    titulo: "Impartición de cursos de formación del capital humano de manera presencial grupal",
    version: "01",
    vigente: true,
    sector: "Servicios de apoyo a los negocios y manejo de residuos y desechos, y servicios de remediación",
    nivelCompetencia: 3,
    proposito:
      "Servir como referente para la evaluación y certificación de las personas que se desempeñan como instructores internos o externos de una organización, o de manera independiente, y cuyas competencias incluyen diseñar cursos y sesiones de capacitación presencial, conducir los cursos de capacitación, y evaluar el proceso de capacitación.",
  },
  {
    ecClave: "EC0249",
    titulo: "Conducción del proceso de capacitación de manera presencial y mixta",
    version: "01",
    vigente: true,
    sector: "Servicios de apoyo a los negocios y manejo de residuos y desechos, y servicios de remediación",
    nivelCompetencia: 3,
    proposito:
      "Servir como referente para la evaluación y certificación de las personas que conducen procesos de capacitación presencial o mixta, diseñando instrumentos de evaluación, conduciendo las sesiones y evaluando el aprendizaje de los participantes.",
  },
  {
    ecClave: "EC0301",
    titulo: "Diseño de cursos de formación del capital humano de manera presencial grupal, sus instrumentos de evaluación y manuales del curso",
    version: "01",
    vigente: true,
    sector: "Servicios de apoyo a los negocios y manejo de residuos y desechos, y servicios de remediación",
    nivelCompetencia: 4,
    proposito:
      "Servir como referente para la evaluación y certificación de las personas que diseñan cursos de capacitación, incluyendo objetivos, contenidos, actividades de aprendizaje, instrumentos de evaluación y materiales didácticos.",
  },
  {
    ecClave: "EC0366",
    titulo: "Desarrollo de cursos de formación en línea",
    version: "01",
    vigente: true,
    sector: "Servicios de apoyo a los negocios y manejo de residuos y desechos, y servicios de remediación",
    nivelCompetencia: 4,
    proposito:
      "Servir como referente para la evaluación y certificación de las personas que desarrollan cursos de formación en línea, incluyendo diseño instruccional, desarrollo de contenidos multimedia y configuración en plataformas de aprendizaje.",
  },
  {
    ecClave: "EC0076",
    titulo: "Evaluación de la competencia de candidatos con base en Estándares de Competencia",
    version: "01",
    vigente: true,
    sector: "Servicios de apoyo a los negocios y manejo de residuos y desechos, y servicios de remediación",
    nivelCompetencia: 4,
    proposito:
      "Servir como referente para la evaluación y certificación de las personas que evalúan la competencia laboral de candidatos a certificación, con base en estándares de competencia inscritos en el Registro Nacional de Estándares de Competencia.",
  },
];

// Sample certifiers data
const SAMPLE_CERTIFIERS = [
  {
    certId: "ECE-001",
    tipo: "ECE" as const,
    razonSocial: "Centro de Evaluación y Certificación en Competencias Laborales S.C.",
    nombreComercial: "CECCEL",
    activo: true,
    direccion: "Av. Insurgentes Sur 1602, Col. Crédito Constructor, Benito Juárez",
    telefono: "55 5534 1234",
    email: "contacto@ceccel.mx",
    sitioWeb: "https://www.ceccel.mx",
    estado: "Ciudad de México",
    municipio: "Benito Juárez",
    ecCodes: ["EC0217.01", "EC0249", "EC0301"],
  },
  {
    certId: "ECE-002",
    tipo: "ECE" as const,
    razonSocial: "Instituto de Capacitación y Certificación para el Trabajo A.C.",
    nombreComercial: "ICCT",
    activo: true,
    direccion: "Blvd. Manuel Ávila Camacho 40, Col. Lomas de Chapultepec",
    telefono: "55 5520 5678",
    email: "info@icct.org.mx",
    sitioWeb: "https://www.icct.org.mx",
    estado: "Ciudad de México",
    municipio: "Miguel Hidalgo",
    ecCodes: ["EC0217.01", "EC0076"],
  },
  {
    certId: "OC-001",
    tipo: "OC" as const,
    razonSocial: "Organismo Certificador en Competencias Laborales S.A. de C.V.",
    nombreComercial: "OCCL México",
    activo: true,
    direccion: "Paseo de la Reforma 250, Col. Juárez",
    telefono: "55 5550 9000",
    email: "certificacion@occl.mx",
    sitioWeb: "https://www.occl.mx",
    estado: "Ciudad de México",
    municipio: "Cuauhtémoc",
    ecCodes: ["EC0217.01", "EC0249", "EC0301", "EC0366", "EC0076"],
  },
];

// Sample centers data
const SAMPLE_CENTERS = [
  {
    centerId: "CE-001",
    certifierId: "ECE-001",
    nombre: "Centro de Evaluación CECCEL - Sede Sur",
    activo: true,
    direccion: "Av. Universidad 1200, Col. Del Valle, Benito Juárez, CDMX",
    telefono: "55 5536 7890",
    email: "sede.sur@ceccel.mx",
    estado: "Ciudad de México",
    municipio: "Benito Juárez",
    latitud: 19.3720,
    longitud: -99.1679,
    ecCodes: ["EC0217.01", "EC0249"],
  },
  {
    centerId: "CE-002",
    certifierId: "ECE-001",
    nombre: "Centro de Evaluación CECCEL - Sede Norte",
    activo: true,
    direccion: "Calz. Vallejo 800, Col. Industrial Vallejo, Azcapotzalco, CDMX",
    telefono: "55 5537 4567",
    email: "sede.norte@ceccel.mx",
    estado: "Ciudad de México",
    municipio: "Azcapotzalco",
    latitud: 19.4847,
    longitud: -99.1473,
    ecCodes: ["EC0217.01", "EC0301"],
  },
  {
    centerId: "CE-003",
    certifierId: "ECE-002",
    nombre: "Centro de Evaluación ICCT - Guadalajara",
    activo: true,
    direccion: "Av. Américas 1254, Col. Country Club, Guadalajara, Jalisco",
    telefono: "33 3640 1234",
    email: "gdl@icct.org.mx",
    estado: "Jalisco",
    municipio: "Guadalajara",
    latitud: 20.6767,
    longitud: -103.3814,
    ecCodes: ["EC0217.01", "EC0076"],
  },
  {
    centerId: "CE-004",
    certifierId: "OC-001",
    nombre: "Centro de Evaluación OCCL - Monterrey",
    activo: true,
    direccion: "Av. Constitución 2050, Col. Obispado, Monterrey, Nuevo León",
    telefono: "81 8340 5678",
    email: "mty@occl.mx",
    estado: "Nuevo León",
    municipio: "Monterrey",
    latitud: 25.6714,
    longitud: -100.3099,
    ecCodes: ["EC0217.01", "EC0249", "EC0366"],
  },
  {
    centerId: "CE-005",
    certifierId: "OC-001",
    nombre: "Centro de Evaluación OCCL - Querétaro",
    activo: true,
    direccion: "Blvd. Bernardo Quintana 300, Col. Centro Sur, Querétaro",
    telefono: "442 210 9876",
    email: "qro@occl.mx",
    estado: "Querétaro",
    municipio: "Querétaro",
    latitud: 20.5888,
    longitud: -100.3899,
    ecCodes: ["EC0217.01", "EC0076"],
  },
];

async function seedECStandards(): Promise<{ created: number; updated: number; skipped: number }> {
  console.log("\n📚 Seeding EC Standards...");

  const stats = { created: 0, updated: 0, skipped: 0 };

  for (const ec of SAMPLE_EC_STANDARDS) {
    const hash = createHash(ec);

    const existing = await prisma.renecEC.findUnique({
      where: { ecClave: ec.ecClave },
    });

    if (existing) {
      if (existing.contentHash === hash) {
        stats.skipped++;
        console.log(`  ⏭️  ${ec.ecClave} - No changes`);
        continue;
      }

      if (!flags.dryRun) {
        await prisma.renecEC.update({
          where: { ecClave: ec.ecClave },
          data: {
            ...ec,
            contentHash: hash,
            lastSyncedAt: new Date(),
          },
        });
      }
      stats.updated++;
      console.log(`  🔄 ${ec.ecClave} - Updated`);
    } else {
      if (!flags.dryRun) {
        await prisma.renecEC.create({
          data: {
            ...ec,
            contentHash: hash,
            lastSyncedAt: new Date(),
          },
        });
      }
      stats.created++;
      console.log(`  ✅ ${ec.ecClave} - Created`);
    }
  }

  return stats;
}

async function seedCertifiers(): Promise<{ created: number; updated: number; skipped: number }> {
  console.log("\n🏢 Seeding Certifiers...");

  const stats = { created: 0, updated: 0, skipped: 0 };

  for (const cert of SAMPLE_CERTIFIERS) {
    const { ecCodes, ...certData } = cert;
    const stateInfo = normalizeState(cert.estado);
    const hash = createHash(certData);

    const existing = await prisma.renecCertifier.findUnique({
      where: { certId: cert.certId },
    });

    let certifierId: string;

    if (existing) {
      if (existing.contentHash === hash) {
        stats.skipped++;
        certifierId = existing.id;
        console.log(`  ⏭️  ${cert.razonSocial} - No changes`);
      } else {
        if (!flags.dryRun) {
          const updated = await prisma.renecCertifier.update({
            where: { certId: cert.certId },
            data: {
              ...certData,
              estado: stateInfo?.name || cert.estado,
              estadoInegi: stateInfo?.inegi,
              contentHash: hash,
              lastSyncedAt: new Date(),
            },
          });
          certifierId = updated.id;
        } else {
          certifierId = existing.id;
        }
        stats.updated++;
        console.log(`  🔄 ${cert.razonSocial} - Updated`);
      }
    } else {
      if (!flags.dryRun) {
        const created = await prisma.renecCertifier.create({
          data: {
            ...certData,
            estado: stateInfo?.name || cert.estado,
            estadoInegi: stateInfo?.inegi,
            contentHash: hash,
            lastSyncedAt: new Date(),
          },
        });
        certifierId = created.id;
      } else {
        certifierId = "dry-run-id";
      }
      stats.created++;
      console.log(`  ✅ ${cert.razonSocial} - Created`);
    }

    // Create accreditations
    if (!flags.dryRun && certifierId !== "dry-run-id") {
      for (const ecCode of ecCodes) {
        const ec = await prisma.renecEC.findUnique({
          where: { ecClave: ecCode },
        });

        if (ec) {
          await prisma.renecAccreditation.upsert({
            where: {
              certifierId_ecId: { certifierId, ecId: ec.id },
            },
            update: { vigente: true },
            create: {
              certifierId,
              ecId: ec.id,
              vigente: true,
            },
          });
        }
      }
    }
  }

  return stats;
}

async function seedCenters(): Promise<{ created: number; updated: number; skipped: number }> {
  console.log("\n📍 Seeding Evaluation Centers...");

  const stats = { created: 0, updated: 0, skipped: 0 };

  for (const center of SAMPLE_CENTERS) {
    const { ecCodes, certifierId: certIdRef, ...centerData } = center;
    const stateInfo = normalizeState(center.estado);
    const hash = createHash(centerData);

    // Find the certifier by certId
    const certifier = await prisma.renecCertifier.findUnique({
      where: { certId: certIdRef },
    });

    const existing = await prisma.renecCenter.findUnique({
      where: { centerId: center.centerId },
    });

    let centerId: string;

    if (existing) {
      if (existing.contentHash === hash) {
        stats.skipped++;
        centerId = existing.id;
        console.log(`  ⏭️  ${center.nombre} - No changes`);
      } else {
        if (!flags.dryRun) {
          const updated = await prisma.renecCenter.update({
            where: { centerId: center.centerId },
            data: {
              ...centerData,
              certifierId: certifier?.id,
              estado: stateInfo?.name || center.estado,
              estadoInegi: stateInfo?.inegi,
              geocodedAt: center.latitud ? new Date() : null,
              contentHash: hash,
              lastSyncedAt: new Date(),
            },
          });
          centerId = updated.id;
        } else {
          centerId = existing.id;
        }
        stats.updated++;
        console.log(`  🔄 ${center.nombre} - Updated`);
      }
    } else {
      if (!flags.dryRun) {
        const created = await prisma.renecCenter.create({
          data: {
            ...centerData,
            certifierId: certifier?.id,
            estado: stateInfo?.name || center.estado,
            estadoInegi: stateInfo?.inegi,
            geocodedAt: center.latitud ? new Date() : null,
            contentHash: hash,
            lastSyncedAt: new Date(),
          },
        });
        centerId = created.id;
      } else {
        centerId = "dry-run-id";
      }
      stats.created++;
      console.log(`  ✅ ${center.nombre} - Created`);
    }

    // Create center offerings
    if (!flags.dryRun && centerId !== "dry-run-id") {
      for (const ecCode of ecCodes) {
        const ec = await prisma.renecEC.findUnique({
          where: { ecClave: ecCode },
        });

        if (ec) {
          await prisma.renecCenterOffering.upsert({
            where: {
              centerId_ecId: { centerId, ecId: ec.id },
            },
            update: { activo: true },
            create: {
              centerId,
              ecId: ec.id,
              activo: true,
            },
          });
        }
      }
    }
  }

  return stats;
}

async function createSyncJob(
  jobType: "EC_STANDARDS" | "CERTIFIERS" | "CENTERS" | "FULL_SYNC",
  stats: { created: number; updated: number; skipped: number },
): Promise<void> {
  if (flags.dryRun) return;

  await prisma.renecSyncJob.create({
    data: {
      jobType,
      status: "COMPLETED",
      itemsProcessed: stats.created + stats.updated + stats.skipped,
      itemsCreated: stats.created,
      itemsUpdated: stats.updated,
      itemsSkipped: stats.skipped,
      startedAt: new Date(),
      completedAt: new Date(),
    },
  });
}

async function main(): Promise<void> {
  console.log("🌱 RENEC Data Seeder");
  console.log("====================");

  if (flags.dryRun) {
    console.log("🔍 DRY RUN MODE - No changes will be made\n");
  }

  const totalStats = { created: 0, updated: 0, skipped: 0 };

  try {
    // Seed EC Standards
    if (flags.full || flags.ecOnly) {
      const ecStats = await seedECStandards();
      totalStats.created += ecStats.created;
      totalStats.updated += ecStats.updated;
      totalStats.skipped += ecStats.skipped;
      await createSyncJob("EC_STANDARDS", ecStats);
    }

    // Seed Certifiers
    if (flags.full || flags.certifiersOnly) {
      const certStats = await seedCertifiers();
      totalStats.created += certStats.created;
      totalStats.updated += certStats.updated;
      totalStats.skipped += certStats.skipped;
      await createSyncJob("CERTIFIERS", certStats);
    }

    // Seed Centers
    if (flags.full || flags.centersOnly) {
      const centerStats = await seedCenters();
      totalStats.created += centerStats.created;
      totalStats.updated += centerStats.updated;
      totalStats.skipped += centerStats.skipped;
      await createSyncJob("CENTERS", centerStats);
    }

    console.log("\n====================");
    console.log("📊 Summary:");
    console.log(`   Created: ${totalStats.created}`);
    console.log(`   Updated: ${totalStats.updated}`);
    console.log(`   Skipped: ${totalStats.skipped}`);
    console.log(`   Total:   ${totalStats.created + totalStats.updated + totalStats.skipped}`);

    if (flags.dryRun) {
      console.log("\n⚠️  DRY RUN - No changes were made");
    } else {
      console.log("\n✅ Seeding complete!");
    }
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
