#!/usr/bin/env npx ts-node
/**
 * API-BASED MAXIMUM DATA EXTRACTION
 * Uses discovered API endpoints for fast bulk extraction
 *
 * Run: npx ts-node src/scripts/api-extract.ts
 */

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const OUTPUT_DIR = path.join(__dirname, '../../data/extracted');
const API_BASE = 'https://conocer.gob.mx/CONOCERBACKCITAS';

// Discovered API endpoints
const API_ENDPOINTS = {
  // Main EC list - returns ALL 1477 ECs
  allECs: `${API_BASE}/sectoresProductivos/getEstandaresAll`,
  // Sectors
  sectors: `${API_BASE}/sectoresProductivos/getSectoresProductivos`,
  // EC detail by ID
  ecDetail: (id: string) => `${API_BASE}/estandares/getEstandar/${id}`,
  // Certifiers for EC
  ecCertifiers: (id: string) => `${API_BASE}/estandares/getCertificadores/${id}`,
  // Training centers for EC
  ecTraining: (id: string) => `${API_BASE}/estandares/getCentrosCapacitacion/${id}`,
};

interface APIECRecord {
  idEstandarCompetencia: string;
  idSectorProductivo: string;
  codigo: string;
  nivel: string;
  titulo: string;
  comite: string;
  secProductivo: string;
}

interface ExtractedData {
  ecStandards: APIECRecord[];
  sectors: any[];
  certifiers: Map<string, any>;
  trainingCenters: Set<string>;
  committees: Map<string, { nombre: string; ecCount: number; ecCodigos: string[] }>;
  ecDetails: Map<string, any>;
  apiDiscovery: string[];
}

let browser: Browser;
let page: Page;
const data: ExtractedData = {
  ecStandards: [],
  sectors: [],
  certifiers: new Map(),
  trainingCenters: new Set(),
  committees: new Map(),
  ecDetails: new Map(),
  apiDiscovery: []
};

async function init() {
  console.log('🚀 API-BASED EXTRACTION - Starting...\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  browser = await chromium.launch({ headless: true });
  page = await browser.newPage();

  // Navigate to site first to establish session
  await page.goto('https://conocer.gob.mx/conocer/#/renec', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
}

async function fetchAPI(url: string): Promise<any> {
  try {
    const result = await page.evaluate(async (apiUrl) => {
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    }, url);
    return result;
  } catch (error) {
    console.warn(`⚠️ API call failed: ${url} - ${(error as Error).message}`);
    return null;
  }
}

async function extractAllECs() {
  console.log('📊 PHASE 1: Fetching ALL EC Standards via API...\n');

  const ecData = await fetchAPI(API_ENDPOINTS.allECs);

  if (Array.isArray(ecData)) {
    data.ecStandards = ecData;
    console.log(`✅ Fetched ${ecData.length} EC standards from API`);

    // Extract unique committees
    for (const ec of ecData) {
      const comiteNombre = ec.comite?.trim();
      if (comiteNombre) {
        const existing = data.committees.get(comiteNombre);
        if (existing) {
          existing.ecCount++;
          existing.ecCodigos.push(ec.codigo);
        } else {
          data.committees.set(comiteNombre, {
            nombre: comiteNombre,
            ecCount: 1,
            ecCodigos: [ec.codigo]
          });
        }
      }
    }

    console.log(`📋 Found ${data.committees.size} unique committees`);
  } else {
    console.error('❌ Failed to fetch EC standards');
  }
}

async function extractSectors() {
  console.log('\n📊 PHASE 2: Fetching Sectors via API...\n');

  const sectorsData = await fetchAPI(API_ENDPOINTS.sectors);

  if (Array.isArray(sectorsData)) {
    data.sectors = sectorsData;
    console.log(`✅ Fetched ${sectorsData.length} sectors from API`);
  } else {
    console.log('⚠️ Sectors API not available, extracting from page...');

    // Fall back to page scraping
    await page.goto('https://conocer.gob.mx/conocer/#/sectoresProductivos', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const paragraphs = await page.$$eval('main p', (els) =>
      els.map(el => el.textContent?.trim() || '')
    );

    for (const text of paragraphs) {
      if (text.length > 5 &&
          text === text.toUpperCase() &&
          !text.includes('SECTORES PRODUCTIVOS') &&
          !text.includes('SCIAN')) {
        data.sectors.push({ nombre: text, tipo: 'productivo' });
      }
    }

    console.log(`✅ Extracted ${data.sectors.length} sectors from page`);
  }
}

async function discoverMoreAPIs() {
  console.log('\n🔍 PHASE 3: Discovering additional API endpoints...\n');

  // Try common API patterns
  const apiPatterns = [
    `${API_BASE}/sectoresProductivos/getAll`,
    `${API_BASE}/estandares/getAll`,
    `${API_BASE}/certificadores/getAll`,
    `${API_BASE}/centrosCapacitacion/getAll`,
    `${API_BASE}/comites/getAll`,
    `${API_BASE}/ocupaciones/getAll`,
    `${API_BASE}/sectoresOrganizacionales/getAll`,
  ];

  for (const url of apiPatterns) {
    const result = await fetchAPI(url);
    if (result && (Array.isArray(result) ? result.length > 0 : Object.keys(result).length > 0)) {
      console.log(`✅ Found working API: ${url}`);
      data.apiDiscovery.push(url);
    }
  }
}

async function extractECDetails(maxItems?: number) {
  console.log('\n📊 PHASE 4: Extracting EC Details (via page scraping)...\n');

  const targetECs = maxItems ? data.ecStandards.slice(0, maxItems) : data.ecStandards;
  console.log(`🎯 Processing ${targetECs.length} ECs for details`);

  let processedCount = 0;
  let certifiersFound = 0;
  let trainingFound = 0;

  for (const ec of targetECs) {
    processedCount++;

    if (processedCount % 50 === 0) {
      console.log(`\n📈 Progress: ${processedCount}/${targetECs.length} ECs processed`);
      console.log(`   Certifiers: ${certifiersFound}, Training Centers: ${trainingFound}`);
      saveData(); // Checkpoint save
    }

    try {
      // Navigate to RENEC and search for EC
      await page.goto('https://conocer.gob.mx/conocer/#/renec', { waitUntil: 'networkidle' });
      await page.waitForSelector('[role="gridcell"]', { timeout: 10000 });

      // Search for EC
      const searchInput = await page.$('input[type="text"]');
      if (searchInput) {
        await searchInput.fill(ec.codigo);
        await page.waitForTimeout(1500);
      }

      // Click on EC row
      const ecRow = await page.$(`[role="row"]:has-text("${ec.codigo}")`);
      if (!ecRow) continue;

      await ecRow.click();
      await page.waitForTimeout(2000);

      // Check for expansion panels (detail page)
      const hasDetails = await page.$('mat-expansion-panel');
      if (!hasDetails) continue;

      const detail: any = {
        codigo: ec.codigo,
        certificadores: [],
        centrosCapacitacion: []
      };

      // Extract certifiers
      const certPanel = await page.$('mat-expansion-panel:has-text("CERTIFICARME")');
      if (certPanel) {
        await certPanel.click().catch(() => {});
        await page.waitForTimeout(1000);

        const certElements = await page.$$('mat-expansion-panel:has-text("CERTIFICARME") li');
        for (const el of certElements) {
          const text = await el.textContent();
          if (text && text.trim().length > 2) {
            const nombre = text.trim();
            detail.certificadores.push(nombre);
            certifiersFound++;

            if (!data.certifiers.has(nombre)) {
              data.certifiers.set(nombre, {
                nombre,
                tipo: inferCertifierType(nombre),
                ecCodigos: [ec.codigo]
              });
            } else {
              data.certifiers.get(nombre).ecCodigos.push(ec.codigo);
            }
          }
        }
      }

      // Extract training centers
      const trainingPanel = await page.$('mat-expansion-panel:has-text("CAPACITARME")');
      if (trainingPanel) {
        await trainingPanel.click().catch(() => {});
        await page.waitForTimeout(1000);

        const trainingElements = await page.$$('mat-expansion-panel:has-text("CAPACITARME") li');
        for (const el of trainingElements) {
          const text = await el.textContent();
          if (text && text.trim().length > 2) {
            const nombre = text.trim();
            detail.centrosCapacitacion.push(nombre);
            trainingFound++;
            data.trainingCenters.add(nombre);
          }
        }
      }

      if (detail.certificadores.length > 0 || detail.centrosCapacitacion.length > 0) {
        data.ecDetails.set(ec.codigo, detail);
      }

    } catch (error) {
      // Skip errors silently
    }
  }

  console.log(`\n✅ Completed EC detail extraction`);
  console.log(`   Total certifiers found: ${certifiersFound}`);
  console.log(`   Total training centers found: ${trainingFound}`);
}

function inferCertifierType(nombre: string): 'ECE' | 'OC' | 'unknown' {
  const lower = nombre.toLowerCase();

  if (lower.includes('universidad') || lower.includes('instituto') ||
      lower.includes('colegio') || lower.includes('escuela') ||
      lower.includes('tecnológico') || lower.includes('politécnico') ||
      lower.includes('secretaría') || lower.includes('gobierno')) {
    return 'ECE';
  }

  if (lower.includes('s.a.') || lower.includes('s.c.') ||
      lower.includes('consultoría') || lower.includes('consultores') ||
      lower.includes('grupo')) {
    return 'OC';
  }

  return 'unknown';
}

function saveData() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // Save EC standards
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'ec_standards_api.json'),
    JSON.stringify(data.ecStandards, null, 2)
  );

  // Save sectors
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'sectors.json'),
    JSON.stringify(data.sectors, null, 2)
  );

  // Save certifiers
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'certifiers.json'),
    JSON.stringify(Array.from(data.certifiers.values()), null, 2)
  );

  // Save training centers
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'training_centers.json'),
    JSON.stringify(Array.from(data.trainingCenters), null, 2)
  );

  // Save committees
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'committees.json'),
    JSON.stringify(Array.from(data.committees.values()), null, 2)
  );

  // Save EC details
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'ec_details.json'),
    JSON.stringify(Object.fromEntries(data.ecDetails), null, 2)
  );

  // Save discovered APIs
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'discovered_apis.json'),
    JSON.stringify(data.apiDiscovery, null, 2)
  );

  console.log(`💾 Data saved to ${OUTPUT_DIR}`);
}

function generateSummary() {
  const summary = {
    extractedAt: new Date().toISOString(),
    source: 'API + Page Scraping',
    counts: {
      ecStandards: data.ecStandards.length,
      sectors: data.sectors.length,
      uniqueCertifiers: data.certifiers.size,
      uniqueTrainingCenters: data.trainingCenters.size,
      committees: data.committees.size,
      ecWithDetails: data.ecDetails.size,
      discoveredAPIs: data.apiDiscovery.length
    },
    certifiersByType: {
      ECE: Array.from(data.certifiers.values()).filter(c => c.tipo === 'ECE').length,
      OC: Array.from(data.certifiers.values()).filter(c => c.tipo === 'OC').length,
      unknown: Array.from(data.certifiers.values()).filter(c => c.tipo === 'unknown').length
    },
    topCommittees: Array.from(data.committees.values())
      .sort((a, b) => b.ecCount - a.ecCount)
      .slice(0, 15),
    discoveredAPIs: data.apiDiscovery,
    mainAPIEndpoint: API_ENDPOINTS.allECs
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'EXTRACTION_SUMMARY.json'),
    JSON.stringify(summary, null, 2)
  );

  console.log('\n' + '='.repeat(60));
  console.log('📊 EXTRACTION SUMMARY');
  console.log('='.repeat(60));
  console.log(`EC Standards:         ${summary.counts.ecStandards}`);
  console.log(`Sectors:              ${summary.counts.sectors}`);
  console.log(`Unique Certifiers:    ${summary.counts.uniqueCertifiers}`);
  console.log(`  - ECE:              ${summary.certifiersByType.ECE}`);
  console.log(`  - OC:               ${summary.certifiersByType.OC}`);
  console.log(`  - Unknown:          ${summary.certifiersByType.unknown}`);
  console.log(`Training Centers:     ${summary.counts.uniqueTrainingCenters}`);
  console.log(`Committees:           ${summary.counts.committees}`);
  console.log(`ECs with Details:     ${summary.counts.ecWithDetails}`);
  console.log('='.repeat(60));
  console.log(`\n📁 All data saved to: ${OUTPUT_DIR}`);
}

async function main() {
  const args = process.argv.slice(2);
  const maxDetails = args.includes('--max') ? parseInt(args[args.indexOf('--max') + 1]) : undefined;
  const skipDetails = args.includes('--skip-details');
  const quickMode = args.includes('--quick');

  try {
    await init();

    // Phase 1: Get all ECs via API (fast!)
    await extractAllECs();
    saveData();

    // Phase 2: Get sectors
    await extractSectors();
    saveData();

    // Phase 3: Discover more APIs
    await discoverMoreAPIs();

    // Phase 4: Extract details (slow - page scraping)
    if (!skipDetails && !quickMode) {
      await extractECDetails(maxDetails);
    }

    // Final save
    saveData();
    generateSummary();

  } catch (error) {
    console.error('❌ Fatal error:', error);
    saveData();
  } finally {
    if (browser) await browser.close();
  }
}

main().catch(console.error);
