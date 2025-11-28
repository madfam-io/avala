#!/usr/bin/env npx ts-node

/**
 * RENEC Extractor CLI
 *
 * Usage:
 *   npx ts-node src/extractor/cli.ts [options]
 *
 * Options:
 *   --full           Run full extraction (default)
 *   --incremental    Only extract new/updated ECs
 *   --limit <n>      Limit to first n ECs (for testing)
 *   --batch <n>      Batch size (default: 50)
 *   --delay <ms>     Request delay in ms (default: 1500)
 *   --visible        Show browser window
 *   --output <dir>   Output directory
 *   --resume         Resume from checkpoint
 *   --stats          Show current stats and exit
 */

import { createExtractor } from './RenecExtractor';
import type { ExtractorConfig, ExtractorEvent } from './types';
import { readJSON } from './utils';
import * as path from 'path';

// Parse command line arguments
function parseArgs(): Partial<ExtractorConfig> & {
  mode: 'full' | 'incremental' | 'stats';
  resume: boolean;
} {
  const args = process.argv.slice(2);
  const config: Partial<ExtractorConfig> = {};
  let mode: 'full' | 'incremental' | 'stats' = 'full';
  let resume = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--full':
        mode = 'full';
        break;
      case '--incremental':
        mode = 'incremental';
        break;
      case '--stats':
        mode = 'stats';
        break;
      case '--resume':
        resume = true;
        break;
      case '--limit':
        config.maxECsToProcess = parseInt(args[++i], 10);
        break;
      case '--batch':
        config.batchSize = parseInt(args[++i], 10);
        break;
      case '--delay':
        config.requestDelayMs = parseInt(args[++i], 10);
        break;
      case '--visible':
        config.headless = false;
        break;
      case '--output':
        config.outputDir = args[++i];
        break;
      case '--verbose':
        config.verbose = true;
        break;
      case '--quiet':
        config.verbose = false;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
      default:
        console.warn(`Unknown argument: ${arg}`);
    }
  }

  return { ...config, mode, resume };
}

function printHelp(): void {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║             RENEC Data Extractor CLI                         ║
╚══════════════════════════════════════════════════════════════╝

Usage:
  npx ts-node src/extractor/cli.ts [options]

Modes:
  --full           Run full extraction (default)
  --incremental    Only extract new/updated ECs
  --stats          Show current extraction stats and exit

Options:
  --limit <n>      Limit to first n ECs (for testing)
  --batch <n>      Batch size for checkpointing (default: 50)
  --delay <ms>     Request delay in ms (default: 1500)
  --visible        Show browser window (headful mode)
  --output <dir>   Output directory (default: ./data/extracted)
  --resume         Resume from last checkpoint
  --verbose        Enable verbose logging
  --quiet          Disable progress output

Examples:
  # Full extraction
  npx ts-node src/extractor/cli.ts --full

  # Test with first 10 ECs
  npx ts-node src/extractor/cli.ts --limit 10 --visible

  # Resume interrupted extraction
  npx ts-node src/extractor/cli.ts --resume

  # Incremental update
  npx ts-node src/extractor/cli.ts --incremental
  `);
}

// Event handler for progress output
function createEventHandler(): (event: ExtractorEvent) => void {
  const startTime = Date.now();

  return (event: ExtractorEvent) => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);

    switch (event.type) {
      case 'started':
        console.log('\n🚀 Extraction started at', event.timestamp);
        break;

      case 'progress':
        const percent = ((event.processed / event.total) * 100).toFixed(1);
        process.stdout.write(
          `\r⏳ Progress: ${event.processed}/${event.total} (${percent}%) - Current: ${event.current} [${elapsed}s]`
        );
        break;

      case 'ec_extracted':
        if (event.certifiers > 0 || event.training > 0) {
          console.log(
            `\n✅ ${event.codigo}: ${event.certifiers} certifiers, ${event.training} training centers`
          );
        }
        break;

      case 'batch_complete':
        console.log(`\n📦 Batch ${event.batch}/${event.total} complete - Checkpoint saved`);
        break;

      case 'checkpoint_saved':
        // Silent - batch_complete handles this
        break;

      case 'error':
        console.error(`\n❌ Error${event.codigo ? ` (${event.codigo})` : ''}: ${event.message}`);
        break;

      case 'completed':
        console.log('\n');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('                    EXTRACTION COMPLETE');
        console.log('═══════════════════════════════════════════════════════════════');
        printStats(event.stats);
        break;
    }
  };
}

function printStats(stats: any): void {
  console.log(`
📊 EXTRACTION STATISTICS
─────────────────────────────────────────────────
  EC Standards:           ${stats.ecStandards.toLocaleString()}
  Sectors:                ${stats.sectors}
  Committees:             ${stats.committees}

  Unique Certifiers:      ${stats.uniqueCertifiers.toLocaleString()}
  Unique Training Centers: ${stats.uniqueTrainingCenters.toLocaleString()}

  ECs with Certifiers:    ${stats.ecsWithCertifiers.toLocaleString()}
  ECs with Training:      ${stats.ecsWithTrainingCenters.toLocaleString()}
  Avg Certifiers/EC:      ${stats.avgCertifiersPerEC.toFixed(1)}

  Certifiers by Type:
    ECE (Educational):    ${stats.certifiersByType.ECE}
    OC (Private):         ${stats.certifiersByType.OC}
    GOBIERNO:             ${stats.certifiersByType.GOBIERNO}
    UNIVERSIDAD:          ${stats.certifiersByType.UNIVERSIDAD}
    UNKNOWN:              ${stats.certifiersByType.UNKNOWN}

  Top 10 Certifiers:
${stats.topCertifiers
  .slice(0, 10)
  .map((c: any, i: number) => `    ${i + 1}. ${c.nombre} (${c.ecCount} ECs)`)
  .join('\n')}
─────────────────────────────────────────────────
`);
}

async function showStats(outputDir: string): Promise<void> {
  const statsPath = path.join(outputDir, 'extraction_stats.json');
  const stats = readJSON<any>(statsPath);

  if (!stats) {
    console.log('No extraction stats found. Run extraction first.');
    return;
  }

  console.log('\n📈 CURRENT EXTRACTION STATISTICS');
  printStats(stats);
}

async function main(): Promise<void> {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           🏛️  RENEC Data Extraction Engine  🏛️               ║
║         Comprehensive CONOCER Data Harvester                 ║
╚══════════════════════════════════════════════════════════════╝
  `);

  const { mode, resume, ...config } = parseArgs();

  // Set default output directory
  if (!config.outputDir) {
    config.outputDir = './data/extracted';
  }
  if (!config.checkpointDir) {
    config.checkpointDir = './data/checkpoints';
  }

  // Handle stats-only mode
  if (mode === 'stats') {
    await showStats(config.outputDir);
    return;
  }

  // Configure extractor
  const extractorConfig: Partial<ExtractorConfig> = {
    ...config,
    skipIfExists: resume || mode === 'incremental',
    incrementalUpdate: resume || mode === 'incremental',
  };

  console.log('Configuration:');
  console.log(`  Mode: ${mode}${resume ? ' (resuming)' : ''}`);
  console.log(`  Output: ${config.outputDir}`);
  console.log(`  Batch Size: ${config.batchSize || 50}`);
  console.log(`  Request Delay: ${config.requestDelayMs || 1500}ms`);
  if (config.maxECsToProcess) {
    console.log(`  Limit: ${config.maxECsToProcess} ECs`);
  }
  console.log('');

  // Create and run extractor
  const extractor = createExtractor(extractorConfig);
  extractor.on(createEventHandler());

  try {
    if (mode === 'incremental') {
      await extractor.extractIncremental();
    } else {
      await extractor.extract();
    }
  } catch (error) {
    console.error('\n💥 Extraction failed:', error);
    process.exit(1);
  }
}

// Run
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
