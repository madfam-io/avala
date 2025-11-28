/**
 * RenecExtractor - Production-ready RENEC data extraction engine
 *
 * Features:
 * - Full extraction of EC standards, certifiers, and training centers
 * - Checkpointing for resumable long-running extractions
 * - Rate limiting and retry logic
 * - Deduplication and normalization
 * - Progress tracking and event-based reporting
 */

import { chromium, Browser, BrowserContext, Page } from "playwright";
import * as path from "path";
import type {
  ECStandard,
  ECDetail,
  Certifier,
  CertifierReference,
  TrainingCenter,
  TrainingCenterReference,
  Committee,
  Sector,
  ExtractionState,
  ExtractionStats,
  ExtractorConfig,
  ExtractorEvent,
  ExtractorEventHandler,
  DataStore,
  CertifierType,
} from "./types";
import { DEFAULT_CONFIG } from "./types";
import {
  normalizeOrganizationName,
  generateId,
  cleanText,
  inferCertifierType,
  formatDate,
  batches,
  sleep,
  withRetry,
  ensureDir,
  writeJSON,
  readJSON,
  createLogger,
  ProgressTracker,
  Logger,
} from "./utils";

// ============================================
// Constants
// ============================================

const CONOCER_BASE_URL = "https://conocer.gob.mx";
const RENEC_URL = `${CONOCER_BASE_URL}/acciones_movil/renec_v2/index.html#/renec`;
const EC_DETAIL_URL = (codigo: string) =>
  `${CONOCER_BASE_URL}/acciones_movil/renec_v2/index.html#/competencia/${codigo}`;
const API_URL = `${CONOCER_BASE_URL}/CONOCERBACKCITAS/sectoresProductivos/getEstandaresAll`;

// Accordion panel selectors for EC detail pages
const PANEL_SELECTORS = {
  description: "mat-expansion-panel:nth-child(1)",
  certification: "mat-expansion-panel:nth-child(2)",
  centers: "mat-expansion-panel:nth-child(3)", // ¿EN DÓNDE PUEDO CERTIFICARME?
  committee: "mat-expansion-panel:nth-child(4)",
};

// ============================================
// Main Extractor Class
// ============================================

export class RenecExtractor {
  private config: ExtractorConfig;
  private logger: Logger;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  // Data stores
  private ecStandards: Map<string, ECStandard> = new Map();
  private ecDetails: Map<string, ECDetail> = new Map();
  private certifiers: Map<string, Certifier> = new Map();
  private trainingCenters: Map<string, TrainingCenter> = new Map();
  private committees: Map<string, Committee> = new Map();
  private sectors: Map<string, Sector> = new Map();

  // State tracking
  private state: ExtractionState;
  private eventHandlers: ExtractorEventHandler[] = [];

  constructor(config: Partial<ExtractorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = createLogger({
      verbose: this.config.verbose,
      logFile: this.config.logFile,
    });
    this.state = this.createInitialState();
  }

  // ============================================
  // Public API
  // ============================================

  /**
   * Subscribe to extraction events
   */
  on(handler: ExtractorEventHandler): () => void {
    this.eventHandlers.push(handler);
    return () => {
      const index = this.eventHandlers.indexOf(handler);
      if (index >= 0) this.eventHandlers.splice(index, 1);
    };
  }

  /**
   * Run full extraction pipeline
   */
  async extract(): Promise<ExtractionStats> {
    this.emit({ type: "started", timestamp: formatDate() });
    this.logger.info("Starting RENEC extraction...");

    try {
      // Initialize browser
      await this.initBrowser();

      // Step 1: Load or fetch EC standards from API
      await this.loadECStandards();

      // Step 2: Try to resume from checkpoint
      const checkpoint = await this.loadCheckpoint();
      if (checkpoint) {
        this.logger.info(
          `Resuming from checkpoint: ${checkpoint.progress.ecsProcessed}/${checkpoint.progress.ecsTotal} ECs processed`,
        );
        this.state = checkpoint;
        await this.loadExistingData();
      }

      // Step 3: Extract details for each EC
      await this.extractAllECDetails();

      // Step 4: Process and deduplicate data
      await this.processExtractedData();

      // Step 5: Save final results
      await this.saveResults();

      const stats = this.calculateStats();
      this.emit({ type: "completed", stats });
      this.logger.info("Extraction completed successfully");

      return stats;
    } catch (error) {
      this.state.status = "error";
      this.emit({ type: "error", message: (error as Error).message });
      this.logger.error("Extraction failed:", error);
      await this.saveCheckpoint();
      throw error;
    } finally {
      await this.closeBrowser();
    }
  }

  /**
   * Extract only new/updated ECs (incremental mode)
   */
  async extractIncremental(): Promise<ExtractionStats> {
    this.config.incrementalUpdate = true;
    this.config.skipIfExists = true;
    return this.extract();
  }

  /**
   * Get current extraction state
   */
  getState(): ExtractionState {
    return { ...this.state };
  }

  /**
   * Get current statistics
   */
  getStats(): ExtractionStats {
    return this.calculateStats();
  }

  // ============================================
  // Browser Management
  // ============================================

  private async initBrowser(): Promise<void> {
    this.logger.info("Initializing browser...");
    this.browser = await chromium.launch({
      headless: this.config.headless,
    });
    this.context = await this.browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      viewport: { width: 1280, height: 720 },
    });
    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(this.config.timeout);
  }

  private async closeBrowser(): Promise<void> {
    if (this.page) await this.page.close().catch(() => {});
    if (this.context) await this.context.close().catch(() => {});
    if (this.browser) await this.browser.close().catch(() => {});
    this.page = null;
    this.context = null;
    this.browser = null;
  }

  // ============================================
  // Data Loading
  // ============================================

  private async loadECStandards(): Promise<void> {
    this.state.status = "extracting_ecs";
    this.logger.info("Loading EC standards...");

    // Try to load from existing file first
    const existingPath = path.join(
      this.config.outputDir,
      "ec_standards_api.json",
    );
    const existing = readJSON<ECStandard[]>(existingPath);

    if (existing && existing.length > 0 && this.config.skipIfExists) {
      this.logger.info(`Loaded ${existing.length} ECs from existing file`);
      for (const ec of existing) {
        this.ecStandards.set(ec.codigo, ec);
      }
      this.state.progress.ecsTotal = existing.length;
      return;
    }

    // Fetch from API
    this.logger.info("Fetching EC standards from API...");
    const response = await fetch(API_URL, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = (await response.json()) as ECStandard[];
    this.logger.info(`Fetched ${data.length} ECs from API`);

    for (const ec of data) {
      this.ecStandards.set(ec.codigo, ec);
    }

    // Save to file
    writeJSON(existingPath, data);
    this.state.progress.ecsTotal = data.length;
  }

  private async loadExistingData(): Promise<void> {
    // Load existing EC details
    const detailsPath = path.join(this.config.outputDir, "ec_details.json");
    const existingDetails = readJSON<Record<string, ECDetail>>(detailsPath);
    if (existingDetails) {
      for (const [codigo, detail] of Object.entries(existingDetails)) {
        this.ecDetails.set(codigo, detail);
      }
      this.logger.info(`Loaded ${this.ecDetails.size} existing EC details`);
    }

    // Load existing certifiers
    const certifiersPath = path.join(
      this.config.outputDir,
      "certifiers_all.json",
    );
    const existingCertifiers =
      readJSON<Record<string, Certifier>>(certifiersPath);
    if (existingCertifiers) {
      for (const [id, cert] of Object.entries(existingCertifiers)) {
        this.certifiers.set(id, cert);
      }
      this.logger.info(`Loaded ${this.certifiers.size} existing certifiers`);
    }

    // Load existing training centers
    const centersPath = path.join(
      this.config.outputDir,
      "training_centers_all.json",
    );
    const existingCenters =
      readJSON<Record<string, TrainingCenter>>(centersPath);
    if (existingCenters) {
      for (const [id, center] of Object.entries(existingCenters)) {
        this.trainingCenters.set(id, center);
      }
      this.logger.info(
        `Loaded ${this.trainingCenters.size} existing training centers`,
      );
    }
  }

  // ============================================
  // EC Detail Extraction
  // ============================================

  private async extractAllECDetails(): Promise<void> {
    this.state.status = "extracting_details";
    const ecCodes = Array.from(this.ecStandards.keys()).sort();

    // Filter out already processed if incremental
    let toProcess = ecCodes;
    if (this.config.incrementalUpdate && this.state.progress.lastProcessedEC) {
      const lastIndex = ecCodes.indexOf(this.state.progress.lastProcessedEC);
      if (lastIndex >= 0) {
        toProcess = ecCodes.slice(lastIndex + 1);
      }
    }

    // Apply max limit if set
    if (this.config.maxECsToProcess) {
      toProcess = toProcess.slice(0, this.config.maxECsToProcess);
    }

    this.logger.info(`Processing ${toProcess.length} ECs...`);
    const tracker = new ProgressTracker(toProcess.length);

    // Process in batches for checkpointing
    let batchNum = 0;
    for (const batch of batches(toProcess, this.config.batchSize)) {
      batchNum++;
      this.state.checkpoint.currentBatch = batchNum;
      this.state.checkpoint.totalBatches = Math.ceil(
        toProcess.length / this.config.batchSize,
      );

      for (const codigo of batch) {
        try {
          // Skip if already have details and in incremental mode
          if (this.config.skipIfExists && this.ecDetails.has(codigo)) {
            tracker.increment();
            this.state.progress.ecsProcessed++;
            continue;
          }

          // Extract details
          const detail = await this.extractECDetail(codigo);

          if (detail) {
            this.ecDetails.set(codigo, detail);
            this.state.progress.ecsWithDetails++;

            // Process certifiers and training centers
            this.processCertifiersForEC(codigo, detail.certificadores);
            this.processTrainingCentersForEC(
              codigo,
              detail.centrosCapacitacion,
            );

            this.emit({
              type: "ec_extracted",
              codigo,
              certifiers: detail.certificadores.length,
              training: detail.centrosCapacitacion.length,
            });
          }

          this.state.progress.ecsProcessed++;
          this.state.progress.lastProcessedEC = codigo;
          tracker.increment();

          // Progress update
          if (tracker.shouldUpdate()) {
            this.emit({
              type: "progress",
              processed: this.state.progress.ecsProcessed,
              total: this.state.progress.ecsTotal,
              current: codigo,
            });
            this.logger.info(`Progress: ${tracker.toString()}`);
          }

          // Rate limiting
          await sleep(this.config.requestDelayMs);
        } catch (error) {
          this.logger.error(`Failed to extract EC ${codigo}:`, error);
          this.state.progress.ecsFailed.push(codigo);
        }
      }

      // Save checkpoint after each batch
      await this.saveCheckpoint();
      this.emit({
        type: "batch_complete",
        batch: batchNum,
        total: this.state.checkpoint.totalBatches,
      });
    }
  }

  private async extractECDetail(codigo: string): Promise<ECDetail | null> {
    if (!this.page) throw new Error("Browser not initialized");

    return withRetry(
      async () => {
        const url = EC_DETAIL_URL(codigo);
        await this.page!.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        });

        // Wait for Angular to render - the SPA takes time to bootstrap
        await sleep(2500);

        // Wait for expansion panels to appear
        try {
          await this.page!.waitForSelector("mat-expansion-panel", {
            timeout: 10000,
          });
        } catch {
          // Panel might not exist for this EC
        }

        // Extract data using page.evaluate for reliability
        const data = await this.page!.evaluate(() => {
          const result = {
            certificadores: [] as { nombre: string }[],
            centrosCapacitacion: [] as { nombre: string; curso?: string }[],
          };

          // Find all expansion panels
          const panels = document.querySelectorAll("mat-expansion-panel");

          panels.forEach((panel) => {
            const header = panel.querySelector("mat-expansion-panel-header");
            const headerText = header?.textContent?.toLowerCase() || "";

            // Click to expand if not expanded
            const panelBody = panel.querySelector(
              ".mat-expansion-panel-content",
            );
            if (panelBody && !panel.classList.contains("mat-expanded")) {
              (header as HTMLElement)?.click();
            }
          });

          // Give time for expansion animation
          // (We'll handle this with a small delay outside evaluate)

          return result;
        });

        // Wait for panels to expand
        await sleep(800);

        // Now extract the actual content
        const extractedData = await this.page!.evaluate(() => {
          const result = {
            certificadores: [] as { nombre: string }[],
            centrosCapacitacion: [] as { nombre: string; curso?: string }[],
          };

          // Extract certifiers from "¿EN DÓNDE PUEDO CERTIFICARME?" panel
          const panels = document.querySelectorAll("mat-expansion-panel");

          panels.forEach((panel) => {
            const headerText =
              panel
                .querySelector("mat-expansion-panel-header")
                ?.textContent?.toLowerCase() || "";

            if (headerText.includes("certificarme")) {
              // This panel contains certifiers
              const rows = panel.querySelectorAll("tr");
              rows.forEach((row) => {
                const cells = row.querySelectorAll("td");
                if (cells.length >= 1) {
                  const nombre = cells[0]?.textContent?.trim();
                  if (nombre && nombre.length > 2) {
                    result.certificadores.push({ nombre });
                  }
                }
              });

              // Also check for list items
              const listItems = panel.querySelectorAll(
                "li, .certifier-item, .organismo",
              );
              listItems.forEach((item) => {
                const nombre = item.textContent?.trim();
                if (nombre && nombre.length > 2) {
                  result.certificadores.push({ nombre });
                }
              });
            }

            // Check for training centers panel (might be separate or combined)
            if (
              headerText.includes("capacit") ||
              headerText.includes("formaci")
            ) {
              const items = panel.querySelectorAll("li, tr, .centro-item");
              items.forEach((item) => {
                const nombre = item.textContent?.trim();
                if (nombre && nombre.length > 2) {
                  result.centrosCapacitacion.push({ nombre });
                }
              });
            }
          });

          // Deduplicate by name
          const seenCerts = new Set<string>();
          result.certificadores = result.certificadores.filter((c) => {
            const key = c.nombre.toLowerCase();
            if (seenCerts.has(key)) return false;
            seenCerts.add(key);
            return true;
          });

          const seenCenters = new Set<string>();
          result.centrosCapacitacion = result.centrosCapacitacion.filter(
            (c) => {
              const key = c.nombre.toLowerCase();
              if (seenCenters.has(key)) return false;
              seenCenters.add(key);
              return true;
            },
          );

          return result;
        });

        // Alternative extraction method if the above didn't work well
        if (extractedData.certificadores.length === 0) {
          // Try the more specific approach
          const altData = await this.extractCertifiersAlternative();
          if (altData.certificadores.length > 0) {
            extractedData.certificadores = altData.certificadores;
          }
          if (altData.centrosCapacitacion.length > 0) {
            extractedData.centrosCapacitacion = altData.centrosCapacitacion;
          }
        }

        return {
          codigo,
          extractedAt: formatDate(),
          certificadores: extractedData.certificadores.map((c) => ({
            nombre: cleanText(c.nombre),
            tipo: inferCertifierType(c.nombre),
          })),
          centrosCapacitacion: extractedData.centrosCapacitacion.map((c) => ({
            nombre: cleanText(c.nombre),
            curso: c.curso,
          })),
        };
      },
      this.config.maxRetries,
      this.config.retryDelayMs,
    );
  }

  private async extractCertifiersAlternative(): Promise<{
    certificadores: { nombre: string }[];
    centrosCapacitacion: { nombre: string }[];
  }> {
    if (!this.page) return { certificadores: [], centrosCapacitacion: [] };

    // Click on the third panel specifically (EN DÓNDE PUEDO CERTIFICARME)
    try {
      await this.page.click(
        "mat-expansion-panel:nth-child(3) mat-expansion-panel-header",
      );
      await sleep(500);
    } catch {
      // Panel might already be open or doesn't exist
    }

    return this.page.evaluate(() => {
      const result = {
        certificadores: [] as { nombre: string }[],
        centrosCapacitacion: [] as { nombre: string }[],
      };

      // Look for all elements that might contain certifier names
      const allText = document.body.innerText;
      const lines = allText.split("\n");

      let inCertifiersSection = false;
      let inCentersSection = false;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.length < 3) continue;

        // Detect section headers
        if (trimmed.toLowerCase().includes("certificarme")) {
          inCertifiersSection = true;
          inCentersSection = false;
          continue;
        }
        if (
          trimmed.toLowerCase().includes("capacitaci") ||
          trimmed.toLowerCase().includes("formaci")
        ) {
          inCentersSection = true;
          inCertifiersSection = false;
          continue;
        }
        if (
          trimmed.toLowerCase().includes("comité") ||
          trimmed.toLowerCase().includes("gestión")
        ) {
          inCertifiersSection = false;
          inCentersSection = false;
          continue;
        }

        // Detect organization patterns
        const isOrg =
          /s\.?a\.?|a\.?c\.?|s\.?c\.?|instituto|universidad|centro|escuela|gobierno|secretar/i.test(
            trimmed,
          );

        if (inCertifiersSection && isOrg) {
          result.certificadores.push({ nombre: trimmed });
        } else if (inCentersSection && isOrg) {
          result.centrosCapacitacion.push({ nombre: trimmed });
        }
      }

      return result;
    });
  }

  // ============================================
  // Data Processing
  // ============================================

  private processCertifiersForEC(
    ecCodigo: string,
    certifierRefs: CertifierReference[],
  ): void {
    const now = formatDate();

    for (const ref of certifierRefs) {
      const id = generateId(ref.nombre);
      const existing = this.certifiers.get(id);

      if (existing) {
        // Update existing
        if (!existing.ecCodigos.includes(ecCodigo)) {
          existing.ecCodigos.push(ecCodigo);
          existing.ecCount = existing.ecCodigos.length;
        }
        existing.lastSeen = now;
      } else {
        // Create new
        this.certifiers.set(id, {
          id,
          nombre: ref.nombre,
          nombreNormalizado: normalizeOrganizationName(ref.nombre),
          tipo: ref.tipo || inferCertifierType(ref.nombre),
          ecCodigos: [ecCodigo],
          ecCount: 1,
          firstSeen: now,
          lastSeen: now,
        });
      }
    }
  }

  private processTrainingCentersForEC(
    ecCodigo: string,
    centerRefs: TrainingCenterReference[],
  ): void {
    const now = formatDate();

    for (const ref of centerRefs) {
      const id = generateId(ref.nombre);
      const existing = this.trainingCenters.get(id);

      if (existing) {
        // Update existing
        if (!existing.ecCodigos.includes(ecCodigo)) {
          existing.ecCodigos.push(ecCodigo);
        }
        if (ref.curso && !existing.cursos.includes(ref.curso)) {
          existing.cursos.push(ref.curso);
        }
        existing.lastSeen = now;
      } else {
        // Create new
        this.trainingCenters.set(id, {
          id,
          nombre: ref.nombre,
          nombreNormalizado: normalizeOrganizationName(ref.nombre),
          cursos: ref.curso ? [ref.curso] : [],
          ecCodigos: [ecCodigo],
          firstSeen: now,
          lastSeen: now,
        });
      }
    }
  }

  private async processExtractedData(): Promise<void> {
    this.state.status = "processing";
    this.logger.info("Processing extracted data...");

    // Build committees from EC standards
    for (const ec of this.ecStandards.values()) {
      if (ec.comite) {
        const normalizedName = normalizeOrganizationName(ec.comite);
        const existing = this.committees.get(normalizedName);

        if (existing) {
          if (!existing.ecCodigos.includes(ec.codigo)) {
            existing.ecCodigos.push(ec.codigo);
            existing.ecCount = existing.ecCodigos.length;
          }
        } else {
          this.committees.set(normalizedName, {
            nombre: ec.comite,
            nombreNormalizado: normalizedName,
            ecCount: 1,
            ecCodigos: [ec.codigo],
          });
        }
      }
    }

    // Build sectors from EC standards
    const sectorCounts = new Map<string, { name: string; count: number }>();
    for (const ec of this.ecStandards.values()) {
      if (ec.secProductivo) {
        const key = ec.idSectorProductivo || ec.secProductivo;
        const existing = sectorCounts.get(key);
        if (existing) {
          existing.count++;
        } else {
          sectorCounts.set(key, { name: ec.secProductivo, count: 1 });
        }
      }
    }

    for (const [id, data] of sectorCounts) {
      this.sectors.set(id, {
        id,
        nombre: data.name,
        tipo: "productivo",
        ecCount: data.count,
      });
    }

    this.logger.info(
      `Processed: ${this.committees.size} committees, ${this.sectors.size} sectors`,
    );
  }

  // ============================================
  // Statistics
  // ============================================

  private calculateStats(): ExtractionStats {
    const certifiersByType: Record<CertifierType, number> = {
      ECE: 0,
      OC: 0,
      GOBIERNO: 0,
      UNIVERSIDAD: 0,
      UNKNOWN: 0,
    };

    for (const cert of this.certifiers.values()) {
      certifiersByType[cert.tipo]++;
    }

    // Calculate ECs with certifiers/training centers
    let ecsWithCertifiers = 0;
    let ecsWithTrainingCenters = 0;
    let totalCertifierRefs = 0;

    for (const detail of this.ecDetails.values()) {
      if (detail.certificadores.length > 0) {
        ecsWithCertifiers++;
        totalCertifierRefs += detail.certificadores.length;
      }
      if (detail.centrosCapacitacion.length > 0) {
        ecsWithTrainingCenters++;
      }
    }

    // Top certifiers
    const sortedCertifiers = Array.from(this.certifiers.values())
      .sort((a, b) => b.ecCount - a.ecCount)
      .slice(0, 20);

    return {
      ecStandards: this.ecStandards.size,
      sectors: this.sectors.size,
      committees: this.committees.size,
      uniqueCertifiers: this.certifiers.size,
      uniqueTrainingCenters: this.trainingCenters.size,
      certifiersByType,
      ecsWithCertifiers,
      ecsWithTrainingCenters,
      avgCertifiersPerEC:
        ecsWithCertifiers > 0 ? totalCertifierRefs / ecsWithCertifiers : 0,
      topCertifiers: sortedCertifiers.map((c) => ({
        nombre: c.nombre,
        ecCount: c.ecCount,
      })),
    };
  }

  // ============================================
  // Persistence
  // ============================================

  private createInitialState(): ExtractionState {
    return {
      version: "1.0.0",
      startedAt: formatDate(),
      lastUpdated: formatDate(),
      status: "idle",
      progress: {
        ecsTotal: 0,
        ecsProcessed: 0,
        ecsWithDetails: 0,
        ecsFailed: [],
        lastProcessedEC: null,
      },
      stats: this.calculateStats(),
      checkpoint: {
        currentBatch: 0,
        totalBatches: 0,
        batchSize: this.config.batchSize,
      },
    };
  }

  private async loadCheckpoint(): Promise<ExtractionState | null> {
    const checkpointPath = path.join(
      this.config.checkpointDir,
      "extraction_state.json",
    );
    return readJSON<ExtractionState>(checkpointPath);
  }

  private async saveCheckpoint(): Promise<void> {
    this.state.lastUpdated = formatDate();
    this.state.stats = this.calculateStats();

    ensureDir(this.config.checkpointDir);
    const checkpointPath = path.join(
      this.config.checkpointDir,
      "extraction_state.json",
    );
    writeJSON(checkpointPath, this.state);

    // Also save intermediate data
    await this.saveIntermediateData();

    this.emit({ type: "checkpoint_saved", path: checkpointPath });
  }

  private async saveIntermediateData(): Promise<void> {
    ensureDir(this.config.outputDir);

    // Save EC details
    const detailsObj: Record<string, ECDetail> = {};
    for (const [k, v] of this.ecDetails) detailsObj[k] = v;
    writeJSON(path.join(this.config.outputDir, "ec_details.json"), detailsObj);

    // Save certifiers
    const certifiersObj: Record<string, Certifier> = {};
    for (const [k, v] of this.certifiers) certifiersObj[k] = v;
    writeJSON(
      path.join(this.config.outputDir, "certifiers_all.json"),
      certifiersObj,
    );

    // Save training centers
    const centersObj: Record<string, TrainingCenter> = {};
    for (const [k, v] of this.trainingCenters) centersObj[k] = v;
    writeJSON(
      path.join(this.config.outputDir, "training_centers_all.json"),
      centersObj,
    );
  }

  private async saveResults(): Promise<void> {
    this.state.status = "completed";
    ensureDir(this.config.outputDir);

    // Save all data stores
    const dataStore: DataStore = {
      ecStandards: this.ecStandards,
      ecDetails: this.ecDetails,
      certifiers: this.certifiers,
      trainingCenters: this.trainingCenters,
      committees: this.committees,
      sectors: this.sectors,
      metadata: {
        version: "1.0.0",
        lastFullExtraction: formatDate(),
        lastIncrementalUpdate: null,
        apiEndpoints: [API_URL],
      },
    };

    // Convert Maps to objects for JSON serialization
    const serializableStore = {
      ecStandards: Object.fromEntries(this.ecStandards),
      ecDetails: Object.fromEntries(this.ecDetails),
      certifiers: Object.fromEntries(this.certifiers),
      trainingCenters: Object.fromEntries(this.trainingCenters),
      committees: Object.fromEntries(this.committees),
      sectors: Object.fromEntries(this.sectors),
      metadata: dataStore.metadata,
    };

    writeJSON(
      path.join(this.config.outputDir, "complete_data_store.json"),
      serializableStore,
    );

    // Save individual files
    writeJSON(
      path.join(this.config.outputDir, "ec_standards_complete.json"),
      Array.from(this.ecStandards.values()),
    );
    writeJSON(
      path.join(this.config.outputDir, "committees_complete.json"),
      Array.from(this.committees.values()),
    );
    writeJSON(
      path.join(this.config.outputDir, "sectors_complete.json"),
      Array.from(this.sectors.values()),
    );
    writeJSON(
      path.join(this.config.outputDir, "certifiers_complete.json"),
      Array.from(this.certifiers.values()),
    );
    writeJSON(
      path.join(this.config.outputDir, "training_centers_complete.json"),
      Array.from(this.trainingCenters.values()),
    );

    // Save statistics
    writeJSON(
      path.join(this.config.outputDir, "extraction_stats.json"),
      this.calculateStats(),
    );

    // Save final state
    writeJSON(
      path.join(this.config.checkpointDir, "extraction_state.json"),
      this.state,
    );

    this.logger.info("All results saved to " + this.config.outputDir);
  }

  // ============================================
  // Event Emission
  // ============================================

  private emit(event: ExtractorEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (error) {
        this.logger.error("Event handler error:", error);
      }
    }
  }
}

// ============================================
// Export factory function
// ============================================

export function createExtractor(
  config?: Partial<ExtractorConfig>,
): RenecExtractor {
  return new RenecExtractor(config);
}
