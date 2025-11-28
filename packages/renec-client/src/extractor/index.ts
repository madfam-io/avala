/**
 * RENEC Extractor Module
 *
 * Production-ready data extraction engine for CONOCER/RENEC certification data.
 *
 * @example
 * ```typescript
 * import { createExtractor } from './extractor';
 *
 * const extractor = createExtractor({
 *   outputDir: './data/extracted',
 *   batchSize: 50,
 *   requestDelayMs: 1500,
 * });
 *
 * extractor.on((event) => {
 *   if (event.type === 'progress') {
 *     console.log(`Progress: ${event.processed}/${event.total}`);
 *   }
 * });
 *
 * const stats = await extractor.extract();
 * console.log(`Extracted ${stats.uniqueCertifiers} certifiers`);
 * ```
 */

// Main extractor
export { RenecExtractor, createExtractor } from './RenecExtractor';

// Types
export type {
  ECStandard,
  ECDetail,
  Certifier,
  CertifierReference,
  CertifierType,
  TrainingCenter,
  TrainingCenterReference,
  Committee,
  CommitteeInfo,
  CommitteeContact,
  Sector,
  ExtractionState,
  ExtractionStatus,
  ExtractionStats,
  ExtractorConfig,
  ExtractorEvent,
  ExtractorEventHandler,
  DataStore,
} from './types';

export { DEFAULT_CONFIG } from './types';

// Utilities
export {
  normalizeOrganizationName,
  generateId,
  cleanText,
  inferCertifierType,
  formatDate,
  parseDate,
  parseMexicanDate,
  batches,
  sleep,
  withRetry,
  ensureDir,
  writeJSON,
  readJSON,
  appendLine,
  createLogger,
  ProgressTracker,
} from './utils';

export type { Logger, LogLevel } from './utils';
