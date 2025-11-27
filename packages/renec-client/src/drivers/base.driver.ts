/**
 * Base driver class for RENEC data extraction
 * Provides common functionality for all component drivers
 */

import type { Browser, Page, BrowserContext } from 'playwright';
import { chromium } from 'playwright';
import {
  computeContentHash,
  cleanText,
  politeDelay,
  withRetry,
  buildUrl,
} from '../utils/helpers';
import { DEFAULT_CONFIG, type RenecClientConfig } from '../types';

export interface DriverStats {
  itemsExtracted: number;
  pagesProcessed: number;
  errors: number;
  startTime: Date;
}

export interface ExtractedItem {
  type: string;
  data: Record<string, unknown>;
}

export abstract class BaseDriver {
  protected config: RenecClientConfig;
  protected stats: DriverStats;
  protected browser: Browser | null = null;
  protected context: BrowserContext | null = null;
  protected page: Page | null = null;

  constructor(config: Partial<RenecClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.stats = {
      itemsExtracted: 0,
      pagesProcessed: 0,
      errors: 0,
      startTime: new Date(),
    };
  }

  /**
   * Get initial URLs for this driver
   */
  abstract getStartUrls(): string[];

  /**
   * Parse listing page and extract items or detail page URLs
   */
  abstract parse(html: string, url: string): Promise<ExtractedItem[]>;

  /**
   * Parse detail page for complete item data
   */
  abstract parseDetail(html: string, url: string, meta?: Record<string, unknown>): Promise<ExtractedItem | null>;

  /**
   * Validate extracted item
   */
  abstract validateItem(item: Record<string, unknown>): boolean;

  /**
   * Initialize browser for scraping
   */
  async initBrowser(): Promise<void> {
    this.browser = await chromium.launch({
      headless: this.config.headless,
    });

    this.context = await this.browser.newContext({
      userAgent: this.config.userAgent,
      locale: 'es-MX',
      timezoneId: this.config.timezone,
    });

    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(this.config.timeoutSec * 1000);
  }

  /**
   * Close browser resources
   */
  async closeBrowser(): Promise<void> {
    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();

    this.page = null;
    this.context = null;
    this.browser = null;
  }

  /**
   * Fetch page with polite delay and retry logic
   */
  async fetchPage(url: string): Promise<string> {
    if (!this.page) {
      await this.initBrowser();
    }

    // Polite delay
    await politeDelay(...this.config.politeDelayMs);

    return withRetry(async () => {
      const response = await this.page!.goto(url, {
        waitUntil: 'networkidle',
      });

      if (!response || !response.ok()) {
        throw new Error(`Failed to fetch ${url}: ${response?.status()}`);
      }

      this.stats.pagesProcessed++;
      return this.page!.content();
    }, this.config.retries);
  }

  /**
   * Extract text using page selector
   */
  async extractText(selector: string, defaultValue = ''): Promise<string> {
    if (!this.page) return defaultValue;

    try {
      const element = await this.page.$(selector);
      if (!element) return defaultValue;

      const text = await element.textContent();
      return cleanText(text);
    } catch {
      return defaultValue;
    }
  }

  /**
   * Extract all matching text elements
   */
  async extractAllText(selector: string): Promise<string[]> {
    if (!this.page) return [];

    try {
      const elements = await this.page.$$(selector);
      const texts: string[] = [];

      for (const el of elements) {
        const text = await el.textContent();
        if (text) {
          texts.push(cleanText(text));
        }
      }

      return texts.filter(Boolean);
    } catch {
      return [];
    }
  }

  /**
   * Extract attribute from element
   */
  async extractAttribute(selector: string, attribute: string): Promise<string | null> {
    if (!this.page) return null;

    try {
      const element = await this.page.$(selector);
      if (!element) return null;

      return element.getAttribute(attribute);
    } catch {
      return null;
    }
  }

  /**
   * Wait for selector with timeout
   */
  async waitForSelector(selector: string, timeout?: number): Promise<boolean> {
    if (!this.page) return false;

    try {
      await this.page.waitForSelector(selector, {
        timeout: timeout ?? this.config.timeoutSec * 1000,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check for and handle pagination
   */
  async findNextPage(): Promise<string | null> {
    if (!this.page) return null;

    const nextSelectors = [
      'a.siguiente',
      'a:has-text("Siguiente")',
      'a.next',
      'a[rel="next"]',
      'li.pagination-next a',
    ];

    for (const selector of nextSelectors) {
      try {
        const href = await this.extractAttribute(selector, 'href');
        if (href) {
          return buildUrl(this.config.baseUrl, href);
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  /**
   * Compute content hash for change detection
   */
  computeHash(data: Record<string, unknown>): string {
    return computeContentHash(data);
  }

  /**
   * Update driver statistics
   */
  updateStats(type: keyof Pick<DriverStats, 'itemsExtracted' | 'pagesProcessed' | 'errors'>): void {
    this.stats[type]++;
  }

  /**
   * Get statistics summary
   */
  getStats(): DriverStats & { runtimeSeconds: number; itemsPerSecond: number } {
    const runtime = (Date.now() - this.stats.startTime.getTime()) / 1000;

    return {
      ...this.stats,
      runtimeSeconds: runtime,
      itemsPerSecond: runtime > 0 ? this.stats.itemsExtracted / runtime : 0,
    };
  }

  /**
   * Log extraction error with context
   */
  logError(url: string, error: Error): void {
    console.error(`[${this.constructor.name}] Error extracting ${url}:`, error.message);
    this.stats.errors++;
  }

  /**
   * Build absolute URL
   */
  buildUrl(path: string): string {
    return buildUrl(this.config.baseUrl, path);
  }

  /**
   * Run full harvest operation
   */
  async harvest(): Promise<ExtractedItem[]> {
    const items: ExtractedItem[] = [];

    try {
      await this.initBrowser();

      const startUrls = this.getStartUrls();

      for (const url of startUrls) {
        try {
          const html = await this.fetchPage(url);
          const pageItems = await this.parse(html, url);
          items.push(...pageItems);

          // Handle pagination
          let nextUrl = await this.findNextPage();
          while (nextUrl) {
            const nextHtml = await this.fetchPage(nextUrl);
            const nextItems = await this.parse(nextHtml, nextUrl);
            items.push(...nextItems);
            nextUrl = await this.findNextPage();
          }
        } catch (error) {
          this.logError(url, error as Error);
        }
      }
    } finally {
      await this.closeBrowser();
    }

    return items;
  }
}
