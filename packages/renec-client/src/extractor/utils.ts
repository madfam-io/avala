/**
 * RENEC Extraction Utilities
 * Helper functions for data normalization, hashing, and inference
 */

import * as crypto from 'crypto';
import type { CertifierType } from './types';

// ============================================
// Text Normalization
// ============================================

/**
 * Normalize organization name for deduplication
 */
export function normalizeOrganizationName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Remove common suffixes
    .replace(/,?\s*(s\.?a\.?|s\.?c\.?|a\.?c\.?|s\.?a\.?s\.?|s\.?a\.?p\.?i\.?|i\.?a\.?p\.?)(\s+de\s+c\.?v\.?)?\.?\s*$/gi, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove accents
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Remove punctuation except essential
    .replace(/["""''`]/g, '')
    .trim();
}

/**
 * Generate stable ID from normalized name
 */
export function generateId(name: string): string {
  const normalized = normalizeOrganizationName(name);
  return crypto.createHash('md5').update(normalized).digest('hex').substring(0, 12);
}

/**
 * Clean text from HTML artifacts
 */
export function cleanText(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================
// Certifier Type Inference
// ============================================

const CERTIFIER_PATTERNS: { type: CertifierType; patterns: RegExp[] }[] = [
  {
    type: 'UNIVERSIDAD',
    patterns: [
      /universidad/i,
      /instituto\s+tecnol[oó]gico/i,
      /politecnico/i,
      /benemérita/i,
      /autónoma/i,
    ]
  },
  {
    type: 'GOBIERNO',
    patterns: [
      /secretar[ií]a/i,
      /gobierno/i,
      /municipal/i,
      /estatal/i,
      /federal/i,
      /congreso/i,
      /fiscal[ií]a/i,
      /instituto\s+de\s+capacitaci[oó]n\s+para\s+el\s+trabajo/i,
      /^icat/i,
      /conalep/i,
      /cecyte/i,
      /cobach/i,
    ]
  },
  {
    type: 'ECE',
    patterns: [
      /instituto/i,
      /colegio/i,
      /escuela/i,
      /centro\s+de\s+capacitaci[oó]n/i,
      /centro\s+de\s+formaci[oó]n/i,
      /fundaci[oó]n/i,
      /asociaci[oó]n/i,
      /c[aá]mara/i,
      /confederaci[oó]n/i,
      /federaci[oó]n/i,
      /sindicato/i,
    ]
  },
  {
    type: 'OC',
    patterns: [
      /s\.?a\.?\s+de\s+c\.?v\.?/i,
      /s\.?a\.?s\.?/i,
      /s\.?c\.?$/i,
      /consultor[ií]a/i,
      /consultores/i,
      /grupo\s+/i,
      /servicios\s+/i,
      /corporativo/i,
      /empresa/i,
    ]
  }
];

/**
 * Infer certifier type from organization name
 */
export function inferCertifierType(nombre: string): CertifierType {
  const normalizedName = nombre.toLowerCase();

  // Check patterns in priority order
  for (const { type, patterns } of CERTIFIER_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedName)) {
        return type;
      }
    }
  }

  return 'UNKNOWN';
}

// ============================================
// Date Utilities
// ============================================

export function formatDate(date: Date = new Date()): string {
  return date.toISOString();
}

export function parseDate(dateStr: string): Date | null {
  try {
    return new Date(dateStr);
  } catch {
    return null;
  }
}

/**
 * Parse Mexican date format (DD/MM/YYYY)
 */
export function parseMexicanDate(dateStr: string): Date | null {
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    const [, day, month, year] = match;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  return null;
}

// ============================================
// Batch Processing
// ============================================

/**
 * Split array into batches
 */
export function* batches<T>(items: T[], batchSize: number): Generator<T[]> {
  for (let i = 0; i < items.length; i += batchSize) {
    yield items.slice(i, i + batchSize);
  }
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry async operation with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

// ============================================
// File Utilities
// ============================================

import * as fs from 'fs';
import * as path from 'path';

export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function writeJSON(filePath: string, data: unknown): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function readJSON<T>(filePath: string): T | null {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as T;
    }
  } catch {
    // Return null on error
  }
  return null;
}

export function appendLine(filePath: string, line: string): void {
  ensureDir(path.dirname(filePath));
  fs.appendFileSync(filePath, line + '\n');
}

// ============================================
// Logging
// ============================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export function createLogger(options: { verbose?: boolean; logFile?: string }): Logger {
  const { verbose = true, logFile } = options;

  const log = (level: LogLevel, message: string, ...args: unknown[]) => {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    const fullMessage = `${prefix} ${message}`;

    if (verbose || level !== 'debug') {
      const icon = { debug: '🔍', info: '📋', warn: '⚠️', error: '❌' }[level];
      console.log(`${icon} ${message}`, ...args);
    }

    if (logFile) {
      appendLine(logFile, `${fullMessage} ${args.map(a => JSON.stringify(a)).join(' ')}`);
    }
  };

  return {
    debug: (message, ...args) => log('debug', message, ...args),
    info: (message, ...args) => log('info', message, ...args),
    warn: (message, ...args) => log('warn', message, ...args),
    error: (message, ...args) => log('error', message, ...args),
  };
}

// ============================================
// Progress Tracking
// ============================================

export class ProgressTracker {
  private total: number;
  private current: number = 0;
  private startTime: number;
  private lastUpdate: number = 0;

  constructor(total: number) {
    this.total = total;
    this.startTime = Date.now();
  }

  increment(): void {
    this.current++;
  }

  get progress(): number {
    return this.total > 0 ? (this.current / this.total) * 100 : 0;
  }

  get eta(): string {
    if (this.current === 0) return 'calculating...';

    const elapsed = Date.now() - this.startTime;
    const rate = this.current / elapsed;
    const remaining = (this.total - this.current) / rate;

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    return `${minutes}m ${seconds}s`;
  }

  shouldUpdate(intervalMs: number = 5000): boolean {
    const now = Date.now();
    if (now - this.lastUpdate >= intervalMs) {
      this.lastUpdate = now;
      return true;
    }
    return false;
  }

  toString(): string {
    return `${this.current}/${this.total} (${this.progress.toFixed(1)}%) - ETA: ${this.eta}`;
  }
}
