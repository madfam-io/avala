import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

/**
 * EC0217.01 Seeding Script
 * Phase 7: The Golden Seed
 *
 * Populates the database with the CONOCER EC0217.01 standard:
 * "Impartición de cursos de formación del capital humano de manera presencial grupal"
 *
 * This is the most popular competency standard in Mexico for training instructors.
 */

const prisma = new PrismaClient();

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

interface Criterion {
  code: string;
  description: string;
  type: 'PERFORMANCE' | 'KNOWLEDGE' | 'ATTITUDE';
  evidenceType: string;
  order: number;
}

interface Element {
  code: string;
  title: string;
  description: string;
  order: number;
  criteria: Criterion[];
}

interface StandardData {
  code: string;
  title: string;
  description: string;
  publishedBy: string;
  version: string;
  publishedAt: string;
  isActive: boolean;
  elements: Element[];
}

async function main() {
  log('\n=====================================', colors.bright);
  log('  EC0217.01 Database Seeding', colors.bright);
  log('  Phase 7: The Golden Seed', colors.bright);
  log('=====================================\n', colors.bright);

  try {
    // Read JSON data
    const dataPath = path.join(__dirname, 'data', 'ec0217.json');
    log(`📖 Reading data from: ${dataPath}`, colors.blue);

    if (!fs.existsSync(dataPath)) {
      throw new Error(`Data file not found: ${dataPath}`);
    }

    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const standardData: StandardData = JSON.parse(rawData);

    log(`✓ Data loaded: ${standardData.code} - ${standardData.title}`, colors.green);
    log(`  Elements: ${standardData.elements.length}`, colors.blue);
    log(`  Total Criteria: ${standardData.elements.reduce((sum, el) => sum + el.criteria.length, 0)}\n`, colors.blue);

    // Step 1: Upsert Competency Standard
    log('📝 Step 1: Upserting Competency Standard...', colors.blue);

    const standard = await prisma.competencyStandard.upsert({
      where: { code: standardData.code },
      update: {
        title: standardData.title,
        description: standardData.description,
        publishedBy: standardData.publishedBy,
        version: standardData.version,
        publishedAt: new Date(standardData.publishedAt),
        isActive: standardData.isActive,
      },
      create: {
        code: standardData.code,
        title: standardData.title,
        description: standardData.description,
        publishedBy: standardData.publishedBy,
        version: standardData.version,
        publishedAt: new Date(standardData.publishedAt),
        isActive: standardData.isActive,
      },
    });

    log(`✓ Standard created/updated: ${standard.code}`, colors.green);
    log(`  ID: ${standard.id}\n`, colors.blue);

    // Step 2: Upsert Elements
    log('📝 Step 2: Upserting Elements...', colors.blue);

    for (const elementData of standardData.elements) {
      const element = await prisma.element.upsert({
        where: {
          standardId_code: {
            standardId: standard.id,
            code: elementData.code,
          },
        },
        update: {
          title: elementData.title,
          description: elementData.description,
          order: elementData.order,
        },
        create: {
          standardId: standard.id,
          code: elementData.code,
          title: elementData.title,
          description: elementData.description,
          order: elementData.order,
        },
      });

      log(`  ✓ Element ${elementData.code}: ${elementData.title}`, colors.green);
      log(`    Criteria to process: ${elementData.criteria.length}`, colors.blue);

      // Step 3: Upsert Criteria for this Element
      let criteriaCreated = 0;
      let criteriaUpdated = 0;

      for (const criterionData of elementData.criteria) {
        // Check if criterion exists
        const existing = await prisma.criterion.findUnique({
          where: {
            elementId_code: {
              elementId: element.id,
              code: criterionData.code,
            },
          },
        });

        if (existing) {
          await prisma.criterion.update({
            where: { id: existing.id },
            data: {
              description: criterionData.description,
              type: criterionData.type,
              evidenceType: criterionData.evidenceType,
              order: criterionData.order,
            },
          });
          criteriaUpdated++;
        } else {
          await prisma.criterion.create({
            data: {
              elementId: element.id,
              code: criterionData.code,
              description: criterionData.description,
              type: criterionData.type,
              evidenceType: criterionData.evidenceType,
              order: criterionData.order,
            },
          });
          criteriaCreated++;
        }
      }

      log(`    ✓ Criteria: ${criteriaCreated} created, ${criteriaUpdated} updated\n`, colors.green);
    }

    // Step 4: Summary
    log('\n=====================================', colors.bright);
    log('  Seeding Complete! 🎉', colors.green + colors.bright);
    log('=====================================', colors.bright);

    // Query final statistics
    const totalElements = await prisma.element.count({
      where: { standardId: standard.id },
    });

    const totalCriteria = await prisma.criterion.count({
      where: {
        element: {
          standardId: standard.id,
        },
      },
    });

    log(`\n📊 Final Statistics:`, colors.blue);
    log(`  Standard: ${standard.code}`, colors.blue);
    log(`  Elements: ${totalElements}`, colors.blue);
    log(`  Criteria: ${totalCriteria}`, colors.blue);

    // Performance Criteria breakdown
    const performanceCriteria = await prisma.criterion.count({
      where: {
        element: { standardId: standard.id },
        type: 'PERFORMANCE',
      },
    });

    const knowledgeCriteria = await prisma.criterion.count({
      where: {
        element: { standardId: standard.id },
        type: 'KNOWLEDGE',
      },
    });

    log(`  - Performance Criteria: ${performanceCriteria}`, colors.blue);
    log(`  - Knowledge Criteria: ${knowledgeCriteria}`, colors.blue);

    log(`\n✅ Database is now populated with EC0217.01!`, colors.green);
    log(`   You can now align courses to this standard.\n`, colors.blue);

  } catch (error) {
    log('\n❌ Error during seeding:', colors.red);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute main function
main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
