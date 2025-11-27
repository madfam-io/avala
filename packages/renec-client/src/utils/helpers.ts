/**
 * Helper utilities for RENEC data extraction and normalization
 */

import { createHash } from 'crypto';
import { ESTADO_INEGI_MAP, VALIDATION_PATTERNS } from '../types';

/**
 * Compute SHA256 hash of content for change detection
 */
export function computeContentHash(data: Record<string, unknown>): string {
  const content = JSON.stringify(data, Object.keys(data).sort());
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Clean and normalize text
 */
export function cleanText(text: string | null | undefined): string {
  if (!text) return '';

  return text
    .replace(/\xa0/g, ' ')      // Non-breaking space
    .replace(/\u200b/g, '')     // Zero-width space
    .replace(/\s+/g, ' ')       // Multiple spaces
    .trim();
}

/**
 * Validate EC code format (EC####)
 */
export function isValidECCode(code: string): boolean {
  if (!code) return false;
  return VALIDATION_PATTERNS.ecCode.test(code.trim());
}

/**
 * Normalize Mexican phone number to E.164 format
 */
export function normalizePhone(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 10) {
    // Standard 10-digit Mexican number
    return `+52${digits}`;
  } else if (digits.length === 12 && digits.startsWith('52')) {
    // Already has country code
    return `+${digits}`;
  } else if (digits.length === 13 && digits.startsWith('052')) {
    // Has 0 prefix
    return `+52${digits.slice(3)}`;
  }

  return digits;
}

/**
 * Convert Mexican state name to INEGI 2-digit code
 */
export function normalizeEstadoInegi(estado: string): string {
  const estadoUpper = estado.toUpperCase().trim();

  // Direct lookup
  if (ESTADO_INEGI_MAP[estadoUpper]) {
    return ESTADO_INEGI_MAP[estadoUpper];
  }

  // Try removing common prefixes
  const cleaned = estadoUpper
    .replace(/^ESTADO DE /, '')
    .replace(/^EDO\.?\s*/, '');

  if (ESTADO_INEGI_MAP[cleaned]) {
    return ESTADO_INEGI_MAP[cleaned];
  }

  // Partial match
  for (const [stateName, code] of Object.entries(ESTADO_INEGI_MAP)) {
    if (stateName.includes(estadoUpper) || estadoUpper.includes(stateName)) {
      return code;
    }
  }

  return '';
}

/**
 * Parse various date formats to ISO string
 */
export function parseDate(dateText: string): string | null {
  const text = dateText.trim();

  // DD/MM/YYYY format
  let match = text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
  }

  // YYYY-MM-DD format (already ISO)
  match = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return match[0];
  }

  // Spanish format: "16 de octubre de 2012"
  const monthMap: Record<string, string> = {
    'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
    'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
    'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12',
  };

  match = text.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);
  if (match) {
    const [, day, month, year] = match;
    const monthNum = monthMap[month.toLowerCase()];
    if (monthNum) {
      return `${year}-${monthNum}-${day.padStart(2, '0')}`;
    }
  }

  return null;
}

/**
 * Extract postal code from text
 */
export function extractPostalCode(text: string): string {
  const match = text.match(/C\.?P\.?\s*(\d{5})/i);
  return match ? match[1] : '';
}

/**
 * Sleep for random duration within range (polite crawling)
 */
export async function politeDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Retry async operation with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Build absolute URL from base and path
 */
export function buildUrl(baseUrl: string, path: string): string {
  if (path.startsWith('http')) {
    return path;
  }

  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const relativePath = path.startsWith('/') ? path : `/${path}`;

  return `${base}${relativePath}`;
}

/**
 * Extract text content from HTML using regex (when no DOM available)
 */
export function extractTextBetween(
  html: string,
  startMarker: string,
  endMarker: string
): string {
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) return '';

  const searchStart = startIdx + startMarker.length;
  const endIdx = html.indexOf(endMarker, searchStart);
  if (endIdx === -1) return '';

  return cleanText(html.slice(searchStart, endIdx));
}

/**
 * Remove HTML tags from text
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate run ID for harvest operations
 */
export function generateRunId(): string {
  const now = new Date();
  return now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
}
