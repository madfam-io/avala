#!/usr/bin/env npx ts-node
/**
 * MAXIMUM DATA EXTRACTION SCRIPT
 * Extracts ALL possible data from RENEC/CONOCER by ANY means necessary
 *
 * Run with: npx ts-node src/scripts/extract-all.ts
 */

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// Output directory
const OUTPUT_DIR = path.join(__dirname, '../../data/extracted');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Data structures
interface ECRecord {
  codigo: string;
  nivel: string;
  titulo: string;
  comite: string;
  sector: string;
  detalle?: ECDetailRecord;
}

interface ECDetailRecord {
  descripcion?: string;
  proposito?: string;
  ocupaciones?: string[];
  dofUrl?: string;
  dofFecha?: string;
  certificadores: CertifierRecord[];
  centrosCapacitacion: string[];
  comiteInfo?: {
    nombre: string;
    descripcion?: string;
  };
}

interface CertifierRecord {
  nombre: string;
  tipo?: 'ECE' | 'OC' | 'unknown';
  estado?: string;
  ecCodigo: string;
}

interface SectorRecord {
  nombre: string;
  tipo: 'productivo' | 'ocupacional';
  ocupaciones?: string[];
}

interface OccupationRecord {
  nombre: string;
  sector: string;
  ecCount?: number;
  ecCodigos?: string[];
}

// Global data stores
const allECs: ECRecord[] = [];
const allCertifiers: Map<string, CertifierRecord> = new Map();
const allTrainingCenters: Set<string> = new Set();
const allCommittees: Map<string, { nombre: string; ecCount: number; ecCodigos: string[] }> = new Map();
const allSectors: SectorRecord[] = [];
const allOccupations: OccupationRecord[] = [];
const apiEndpoints: Set<string> = new Set();

let browser: Browser;
let page: Page;

async function init() {
  console.log('🚀 MAXIMUM DATA EXTRACTION - Starting...\n');

  browser = await chromium.launch({
    headless: true,
    args: ['--disable-web-security'] // Allow CORS for API inspection
  });

  page = await browser.newPage();

  // Intercept ALL network requests to discover APIs
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('CONOCERBACK') || url.includes('api') || url.includes('estandar')) {
      apiEndpoints.add(url);
      console.log(`🔍 API discovered: ${url}`);
    }
  });
}

async function cleanup() {
  if (browser) {
    await browser.close();
  }
}

/**
 * PHASE 1: Extract ALL ECs from the main RENEC table
 */
async function extractAllECs(): Promise<void> {
  console.log('\n📊 PHASE 1: Extracting ALL EC Standards...\n');

  await page.goto('https://conocer.gob.mx/conocer/#/renec', { waitUntil: 'networkidle' });

  // Wait for table to load
  await page.waitForSelector('[role="gridcell"]', { timeout: 30000 });
  await page.waitForTimeout(2000);

  // Get total count
  const totalText = await page.textContent('.mat-mdc-paginator-range-label, [class*="paginator"]');
  const match = totalText?.match(/(\d+)\s*registros/);
  const totalCount = match ? parseInt(match[1]) : 0;
  console.log(`📈 Total ECs to extract: ${totalCount}`);

  let extractedCount = 0;
  let pageNum = 1;

  while (true) {
    console.log(`📄 Processing page ${pageNum}...`);

    // Extract all rows on current page
    const rows = await page.$$('[role="row"]:not(:first-child)');

    for (const row of rows) {
      const cells = await row.$$('[role="gridcell"]');
      if (cells.length >= 5) {
        const codigo = await cells[0].textContent() || '';
        const nivel = await cells[1].textContent() || '';
        const titulo = await cells[2].textContent() || '';
        const comite = await cells[3].textContent() || '';
        const sector = await cells[4].textContent() || '';

        if (codigo.trim().startsWith('EC')) {
          allECs.push({
            codigo: codigo.trim(),
            nivel: nivel.trim(),
            titulo: titulo.trim(),
            comite: comite.trim(),
            sector: sector.trim()
          });

          // Track committees
          const comiteNombre = comite.trim();
          if (comiteNombre) {
            const existing = allCommittees.get(comiteNombre);
            if (existing) {
              existing.ecCount++;
              existing.ecCodigos.push(codigo.trim());
            } else {
              allCommittees.set(comiteNombre, {
                nombre: comiteNombre,
                ecCount: 1,
                ecCodigos: [codigo.trim()]
              });
            }
          }

          extractedCount++;
        }
      }
    }

    console.log(`   Extracted ${extractedCount} ECs so far...`);

    // Check for next page
    const nextBtn = await page.$('button[aria-label="Siguiente"]:not([disabled]), button:has-text("Siguiente"):not([disabled])');
    if (!nextBtn) {
      console.log('   No more pages');
      break;
    }

    await nextBtn.click();
    await page.waitForTimeout(1500);
    pageNum++;
  }

  console.log(`\n✅ Extracted ${allECs.length} EC standards`);
}

/**
 * PHASE 2: Extract DETAILED data for each EC (certifiers, training centers, etc.)
 */
async function extractECDetails(maxItems?: number): Promise<void> {
  console.log('\n📊 PHASE 2: Extracting EC Details (Certifiers, Training Centers)...\n');

  const targetECs = maxItems ? allECs.slice(0, maxItems) : allECs;
  console.log(`🎯 Processing ${targetECs.length} ECs for detailed extraction`);

  for (let i = 0; i < targetECs.length; i++) {
    const ec = targetECs[i];
    console.log(`\n[${i + 1}/${targetECs.length}] Processing ${ec.codigo}...`);

    try {
      // Navigate to RENEC page first
      await page.goto('https://conocer.gob.mx/conocer/#/renec', { waitUntil: 'networkidle' });
      await page.waitForSelector('[role="gridcell"]', { timeout: 15000 });
      await page.waitForTimeout(1000);

      // Search for the specific EC
      const searchInput = await page.$('input[type="text"], input[placeholder*="Buscar"]');
      if (searchInput) {
        await searchInput.fill(ec.codigo);
        await page.waitForTimeout(1500);
      }

      // Click on the EC row
      const ecRow = await page.$(`[role="row"]:has-text("${ec.codigo}")`);
      if (!ecRow) {
        console.log(`   ⚠️ EC ${ec.codigo} not found in table`);
        continue;
      }

      await ecRow.click();
      await page.waitForTimeout(2000);

      // Wait for detail page
      const hasExpansionPanels = await page.waitForSelector('mat-expansion-panel, .mat-expansion-panel', { timeout: 10000 }).catch(() => null);

      if (!hasExpansionPanels) {
        console.log(`   ⚠️ No detail panels found for ${ec.codigo}`);
        continue;
      }

      const detail: ECDetailRecord = {
        certificadores: [],
        centrosCapacitacion: []
      };

      // Extract description
      const descPanel = await page.$('mat-expansion-panel:first-of-type');
      if (descPanel) {
        await descPanel.click().catch(() => {});
        await page.waitForTimeout(500);

        const descText = await page.textContent('mat-expansion-panel:first-of-type .mat-expansion-panel-body');
        if (descText) {
          detail.descripcion = descText.trim().slice(0, 2000);
        }
      }

      // Extract certifiers - "¿EN DÓNDE PUEDO CERTIFICARME?"
      const certPanel = await page.$('mat-expansion-panel:has-text("CERTIFICARME")');
      if (certPanel) {
        await certPanel.click().catch(() => {});
        await page.waitForTimeout(1000);

        // Try multiple selectors for certifier list
        const certElements = await page.$$('mat-expansion-panel:has-text("CERTIFICARME") li, mat-expansion-panel:has-text("CERTIFICARME") .mat-list-item, mat-expansion-panel:has-text("CERTIFICARME") tr td:first-child');

        for (const el of certElements) {
          const text = await el.textContent();
          if (text && text.trim().length > 2) {
            const nombre = text.trim();
            const certRecord: CertifierRecord = {
              nombre,
              tipo: inferCertifierType(nombre),
              ecCodigo: ec.codigo
            };

            detail.certificadores.push(certRecord);

            // Add to global certifiers map (dedupe by name)
            if (!allCertifiers.has(nombre)) {
              allCertifiers.set(nombre, certRecord);
            }
          }
        }

        console.log(`   📋 Found ${detail.certificadores.length} certifiers`);
      }

      // Extract training centers - "¿EN DÓNDE PUEDO CAPACITARME?"
      const trainingPanel = await page.$('mat-expansion-panel:has-text("CAPACITARME")');
      if (trainingPanel) {
        await trainingPanel.click().catch(() => {});
        await page.waitForTimeout(1000);

        const trainingElements = await page.$$('mat-expansion-panel:has-text("CAPACITARME") li, mat-expansion-panel:has-text("CAPACITARME") .mat-list-item');

        for (const el of trainingElements) {
          const text = await el.textContent();
          if (text && text.trim().length > 2) {
            const nombre = text.trim();
            detail.centrosCapacitacion.push(nombre);
            allTrainingCenters.add(nombre);
          }
        }

        console.log(`   🎓 Found ${detail.centrosCapacitacion.length} training centers`);
      }

      // Extract committee info - "COMITÉ DE GESTIÓN"
      const committeePanel = await page.$('mat-expansion-panel:has-text("COMITÉ")');
      if (committeePanel) {
        await committeePanel.click().catch(() => {});
        await page.waitForTimeout(500);

        const committeeText = await page.textContent('mat-expansion-panel:has-text("COMITÉ") .mat-expansion-panel-body');
        if (committeeText) {
          detail.comiteInfo = {
            nombre: ec.comite,
            descripcion: committeeText.trim().slice(0, 1000)
          };
        }
      }

      // Extract DOF link
      const dofLink = await page.$('a[href*="dof.gob.mx"]');
      if (dofLink) {
        detail.dofUrl = await dofLink.getAttribute('href') || undefined;
        detail.dofFecha = await dofLink.textContent() || undefined;
      }

      ec.detalle = detail;

    } catch (error) {
      console.log(`   ❌ Error processing ${ec.codigo}: ${(error as Error).message}`);
    }

    // Progress save every 50 items
    if ((i + 1) % 50 === 0) {
      saveProgressData();
    }
  }
}

/**
 * PHASE 3: Extract Productive Sectors
 */
async function extractProductiveSectors(): Promise<void> {
  console.log('\n📊 PHASE 3: Extracting Productive Sectors...\n');

  await page.goto('https://conocer.gob.mx/conocer/#/sectoresProductivos', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Extract sector names from paragraphs
  const paragraphs = await page.$$('main p');

  for (const p of paragraphs) {
    const text = await p.textContent();
    if (text) {
      const trimmed = text.trim();
      // Filter for sector names (all caps, reasonable length)
      if (trimmed.length > 5 &&
          trimmed === trimmed.toUpperCase() &&
          !trimmed.includes('SECTORES PRODUCTIVOS') &&
          !trimmed.includes('SCIAN') &&
          !trimmed.includes('ESTÁNDARES')) {
        allSectors.push({
          nombre: trimmed,
          tipo: 'productivo'
        });
      }
    }
  }

  console.log(`✅ Extracted ${allSectors.filter(s => s.tipo === 'productivo').length} productive sectors`);
}

/**
 * PHASE 4: Extract Occupational Sectors and Occupations
 */
async function extractOccupationalSectors(): Promise<void> {
  console.log('\n📊 PHASE 4: Extracting Occupational Sectors...\n');

  await page.goto('https://conocer.gob.mx/conocer/#/sectoresOrganizacionales', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Find occupation sector cards
  const sectorCards = await page.$$('main [class*="card"], main [class*="sector"]');

  for (const card of sectorCards) {
    const sectorName = await card.textContent();
    if (sectorName && sectorName.trim().length > 2) {
      const trimmed = sectorName.trim();

      // Click to expand and get occupations
      await card.click().catch(() => {});
      await page.waitForTimeout(2000);

      // Extract occupations under this sector
      const occupationElements = await page.$$('main p');
      const occupations: string[] = [];

      for (const occ of occupationElements) {
        const occText = await occ.textContent();
        if (occText && occText.trim().startsWith('Personal')) {
          occupations.push(occText.trim());

          allOccupations.push({
            nombre: occText.trim(),
            sector: trimmed
          });
        }
      }

      if (occupations.length > 0) {
        allSectors.push({
          nombre: trimmed,
          tipo: 'ocupacional',
          ocupaciones: occupations
        });
      }
    }
  }

  console.log(`✅ Extracted ${allOccupations.length} occupations`);
}

/**
 * Helper: Infer certifier type from name
 */
function inferCertifierType(nombre: string): 'ECE' | 'OC' | 'unknown' {
  const lower = nombre.toLowerCase();

  // Educational institutions are typically ECEs
  if (lower.includes('universidad') ||
      lower.includes('instituto') ||
      lower.includes('colegio') ||
      lower.includes('escuela') ||
      lower.includes('tecnológico') ||
      lower.includes('politécnico')) {
    return 'ECE';
  }

  // Government agencies are typically ECEs
  if (lower.includes('secretaría') ||
      lower.includes('gobierno') ||
      lower.includes('imss') ||
      lower.includes('issste') ||
      lower.includes('pemex') ||
      lower.includes('municipal') ||
      lower.includes('estatal')) {
    return 'ECE';
  }

  // Companies are typically OCs
  if (lower.includes('s.a.') ||
      lower.includes('s.c.') ||
      lower.includes('s. de r.l.') ||
      lower.includes('consultoría') ||
      lower.includes('consultores') ||
      lower.includes('grupo') ||
      lower.includes('servicios')) {
    return 'OC';
  }

  return 'unknown';
}

/**
 * Save progress data
 */
function saveProgressData(): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // Save ECs
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'ec_standards.json'),
    JSON.stringify(allECs, null, 2)
  );

  // Save certifiers
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'certifiers.json'),
    JSON.stringify(Array.from(allCertifiers.values()), null, 2)
  );

  // Save training centers
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'training_centers.json'),
    JSON.stringify(Array.from(allTrainingCenters), null, 2)
  );

  // Save committees
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'committees.json'),
    JSON.stringify(Array.from(allCommittees.values()), null, 2)
  );

  // Save sectors
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'sectors.json'),
    JSON.stringify(allSectors, null, 2)
  );

  // Save occupations
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'occupations.json'),
    JSON.stringify(allOccupations, null, 2)
  );

  // Save discovered API endpoints
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'api_endpoints.json'),
    JSON.stringify(Array.from(apiEndpoints), null, 2)
  );

  console.log(`\n💾 Progress saved to ${OUTPUT_DIR}`);
}

/**
 * Generate summary report
 */
function generateSummary(): void {
  const summary = {
    extractedAt: new Date().toISOString(),
    counts: {
      ecStandards: allECs.length,
      ecWithDetails: allECs.filter(ec => ec.detalle).length,
      uniqueCertifiers: allCertifiers.size,
      uniqueTrainingCenters: allTrainingCenters.size,
      committees: allCommittees.size,
      productiveSectors: allSectors.filter(s => s.tipo === 'productivo').length,
      occupationalSectors: allSectors.filter(s => s.tipo === 'ocupacional').length,
      occupations: allOccupations.length,
      apiEndpoints: apiEndpoints.size
    },
    certifiersByType: {
      ECE: Array.from(allCertifiers.values()).filter(c => c.tipo === 'ECE').length,
      OC: Array.from(allCertifiers.values()).filter(c => c.tipo === 'OC').length,
      unknown: Array.from(allCertifiers.values()).filter(c => c.tipo === 'unknown').length
    },
    topCommittees: Array.from(allCommittees.values())
      .sort((a, b) => b.ecCount - a.ecCount)
      .slice(0, 10)
      .map(c => ({ nombre: c.nombre, ecCount: c.ecCount })),
    discoveredAPIs: Array.from(apiEndpoints)
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'EXTRACTION_SUMMARY.json'),
    JSON.stringify(summary, null, 2)
  );

  console.log('\n' + '='.repeat(60));
  console.log('📊 EXTRACTION SUMMARY');
  console.log('='.repeat(60));
  console.log(`EC Standards:        ${summary.counts.ecStandards}`);
  console.log(`ECs with Details:    ${summary.counts.ecWithDetails}`);
  console.log(`Unique Certifiers:   ${summary.counts.uniqueCertifiers}`);
  console.log(`  - ECE:             ${summary.certifiersByType.ECE}`);
  console.log(`  - OC:              ${summary.certifiersByType.OC}`);
  console.log(`  - Unknown:         ${summary.certifiersByType.unknown}`);
  console.log(`Training Centers:    ${summary.counts.uniqueTrainingCenters}`);
  console.log(`Committees:          ${summary.counts.committees}`);
  console.log(`Productive Sectors:  ${summary.counts.productiveSectors}`);
  console.log(`Occupational Sectors:${summary.counts.occupationalSectors}`);
  console.log(`Occupations:         ${summary.counts.occupations}`);
  console.log(`API Endpoints Found: ${summary.counts.apiEndpoints}`);
  console.log('='.repeat(60));
  console.log(`\n📁 All data saved to: ${OUTPUT_DIR}`);
}

/**
 * MAIN EXECUTION
 */
async function main() {
  const args = process.argv.slice(2);
  const maxDetails = args.includes('--max') ? parseInt(args[args.indexOf('--max') + 1]) : undefined;
  const skipDetails = args.includes('--skip-details');
  const onlyDetails = args.includes('--only-details');

  try {
    await init();

    if (!onlyDetails) {
      // Phase 1: Extract all EC standards
      await extractAllECs();
      saveProgressData();

      // Phase 3: Extract productive sectors
      await extractProductiveSectors();
      saveProgressData();

      // Phase 4: Extract occupational sectors
      await extractOccupationalSectors();
      saveProgressData();
    } else {
      // Load existing ECs
      const existingECs = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, 'ec_standards.json'), 'utf-8'));
      allECs.push(...existingECs);
    }

    if (!skipDetails) {
      // Phase 2: Extract detailed data for each EC
      await extractECDetails(maxDetails);
    }

    // Final save
    saveProgressData();
    generateSummary();

  } catch (error) {
    console.error('❌ Fatal error:', error);
    saveProgressData(); // Save whatever we have
  } finally {
    await cleanup();
  }
}

// Run
main().catch(console.error);
