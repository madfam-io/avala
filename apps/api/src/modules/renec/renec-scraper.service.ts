import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../database/prisma.service";
import * as crypto from "crypto";
import {
  HarvestMode,
  HarvestStatus,
  RenecComponent,
  ESTADO_INEGI_MAP,
  RENEC_VALIDATION_PATTERNS,
} from "./dto/renec.dto";
import { RenecSyncJobType, RenecSyncStatus } from "@avala/db";

// Dynamic import for renec-client (ESM module)
type RenecClientModule = typeof import("@avala/renec-client");

interface HarvestRun {
  id: string;
  mode: HarvestMode;
  status: HarvestStatus;
  startTime: Date;
  endTime?: Date;
  itemsScraped: number;
  pagesCrawled: number;
  errors: number;
  components: RenecComponent[];
}

// HarvestedData interface - exported for future use when full harvesting is implemented
export interface HarvestedData {
  ecStandards: Record<string, unknown>[];
  certifiers: Record<string, unknown>[];
  centers: Record<string, unknown>[];
  sectors: Record<string, unknown>[];
  comites: Record<string, unknown>[];
  ecSectorRelations: Record<string, unknown>[];
}

@Injectable()
export class RenecScraperService implements OnModuleInit {
  private readonly logger = new Logger(RenecScraperService.name);
  private activeRun: HarvestRun | null = null;
  private isRunning = false;
  private renecClient: RenecClientModule | null = null;
  private schedulingEnabled: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // Enable scheduling only in production or when explicitly enabled
    this.schedulingEnabled =
      this.configService.get("RENEC_HARVEST_ENABLED") === "true" ||
      this.configService.get("NODE_ENV") === "production";
  }

  async onModuleInit() {
    this.logger.log("RENEC Scraper Service initialized");
    this.logger.log(
      `Scheduled harvesting: ${this.schedulingEnabled ? "ENABLED" : "DISABLED"}`,
    );

    // Lazy load the renec-client module
    try {
      this.renecClient = await import("@avala/renec-client");
      this.logger.log("RENEC client loaded successfully");
    } catch (error) {
      this.logger.warn(
        "RENEC client not available - harvesting will use placeholder data",
        error,
      );
    }
  }

  // ============================================
  // SCHEDULED JOBS (Cron-based)
  // ============================================

  /**
   * Daily probe at 6:00 AM UTC - Quick check for new/updated EC standards
   * Runs only EC and Certifiers to detect changes
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async scheduledDailyProbe() {
    if (!this.schedulingEnabled) {
      this.logger.debug("Scheduled daily probe skipped (scheduling disabled)");
      return;
    }

    this.logger.log("🕐 Starting scheduled daily RENEC probe...");
    try {
      await this.startHarvest({
        mode: HarvestMode.PROBE,
        components: [
          RenecComponent.EC_STANDARDS,
          RenecComponent.CERTIFICADORES,
        ],
        maxPages: 500,
        concurrency: 3,
      });
    } catch (error) {
      this.logger.error("Scheduled daily probe failed:", error);
    }
  }

  /**
   * Weekly full harvest on Sunday at 3:00 AM UTC
   * Complete data refresh including all centers
   */
  @Cron(CronExpression.EVERY_WEEK)
  async scheduledWeeklyHarvest() {
    if (!this.schedulingEnabled) {
      this.logger.debug(
        "Scheduled weekly harvest skipped (scheduling disabled)",
      );
      return;
    }

    // Only run on Sundays
    if (new Date().getDay() !== 0) return;

    this.logger.log("🕐 Starting scheduled weekly full RENEC harvest...");
    try {
      await this.startHarvest({
        mode: HarvestMode.HARVEST,
        components: [
          RenecComponent.EC_STANDARDS,
          RenecComponent.CERTIFICADORES,
          RenecComponent.CENTROS,
        ],
        maxPages: 5000,
        concurrency: 5,
      });
    } catch (error) {
      this.logger.error("Scheduled weekly harvest failed:", error);
    }
  }

  /**
   * Check data freshness every 12 hours
   * Logs warnings if data is stale
   */
  @Cron(CronExpression.EVERY_12_HOURS)
  async scheduledFreshnessCheck() {
    if (!this.schedulingEnabled) return;

    this.logger.log("Checking RENEC data freshness...");
    const freshness = await this.checkDataFreshness();

    if (
      freshness.staleCenters > 100 ||
      freshness.staleCertifiers > 50 ||
      freshness.staleECs > 100
    ) {
      this.logger.warn(
        `⚠️ Significant stale data detected - consider running a full harvest`,
      );
    }
  }

  // ============================================
  // MANUAL TRIGGER METHODS
  // ============================================

  async dailyProbe() {
    this.logger.log("Starting manual daily RENEC probe...");
    return this.startHarvest({
      mode: HarvestMode.PROBE,
      components: [RenecComponent.EC_STANDARDS, RenecComponent.CERTIFICADORES],
      maxPages: 500,
      concurrency: 5,
    });
  }

  async weeklyFullHarvest() {
    this.logger.log("Starting manual weekly full RENEC harvest...");
    return this.startHarvest({
      mode: HarvestMode.HARVEST,
      components: [
        RenecComponent.EC_STANDARDS,
        RenecComponent.CERTIFICADORES,
        RenecComponent.CENTROS,
      ],
      maxPages: 5000,
      concurrency: 10,
    });
  }

  async checkDataFreshness() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [staleCenters, staleCertifiers, staleECs] = await Promise.all([
      this.prisma.renecCenter.count({
        where: { updatedAt: { lt: sevenDaysAgo } },
      }),
      this.prisma.renecCertifier.count({
        where: { updatedAt: { lt: sevenDaysAgo } },
      }),
      this.prisma.renecEC.count({
        where: { updatedAt: { lt: sevenDaysAgo } },
      }),
    ]);

    if (staleCenters > 0 || staleCertifiers > 0 || staleECs > 0) {
      this.logger.log(
        `Data freshness: ${staleCenters} stale centers, ${staleCertifiers} stale certifiers, ${staleECs} stale EC standards`,
      );
    }

    return { staleCenters, staleCertifiers, staleECs };
  }

  // ============================================
  // HARVEST ORCHESTRATION
  // ============================================

  async startHarvest(options: {
    mode: HarvestMode;
    components?: RenecComponent[];
    maxPages?: number;
    concurrency?: number;
  }): Promise<HarvestRun> {
    if (this.isRunning) {
      throw new Error("A harvest is already running");
    }

    const runId = `${options.mode}_${new Date().toISOString().replace(/[^0-9]/g, "")}`;
    const components = options.components || [
      RenecComponent.EC_STANDARDS,
      RenecComponent.CERTIFICADORES,
    ];

    this.activeRun = {
      id: runId,
      mode: options.mode,
      status: HarvestStatus.RUNNING,
      startTime: new Date(),
      itemsScraped: 0,
      pagesCrawled: 0,
      errors: 0,
      components,
    };

    this.isRunning = true;
    this.logger.log(`🌾 Starting harvest run: ${runId}`);

    // Create sync job record
    const syncJob = await this.prisma.renecSyncJob.create({
      data: {
        jobType: RenecSyncJobType.FULL_SYNC,
        status: RenecSyncStatus.RUNNING,
        startedAt: new Date(),
        itemsProcessed: 0,
        itemsCreated: 0,
        itemsUpdated: 0,
        itemsSkipped: 0,
        errors: [],
      },
    });

    try {
      // Use the renec-client if available
      if (this.renecClient) {
        await this.harvestWithRenecClient(components);
      } else {
        // Fallback to component-by-component harvesting
        for (const component of components) {
          await this.harvestComponent(component, options.maxPages || 500);
        }
      }

      // Mark as completed
      this.activeRun.status = HarvestStatus.COMPLETED;
      this.activeRun.endTime = new Date();

      await this.prisma.renecSyncJob.update({
        where: { id: syncJob.id },
        data: {
          status: RenecSyncStatus.COMPLETED,
          completedAt: new Date(),
          itemsProcessed: this.activeRun.itemsScraped,
          itemsCreated: this.activeRun.itemsScraped,
        },
      });

      this.logger.log(
        `✅ Harvest ${runId} completed: ${this.activeRun.itemsScraped} items, ${this.activeRun.errors} errors`,
      );
    } catch (error) {
      this.activeRun.status = HarvestStatus.FAILED;
      this.activeRun.endTime = new Date();
      this.activeRun.errors++;

      await this.prisma.renecSyncJob.update({
        where: { id: syncJob.id },
        data: {
          status: RenecSyncStatus.FAILED,
          completedAt: new Date(),
          errors: [
            {
              message: (error as Error).message,
              stack: (error as Error).stack,
            },
          ],
        },
      });

      this.logger.error(`❌ Harvest ${runId} failed:`, error);
      throw error;
    } finally {
      this.isRunning = false;
    }

    return this.activeRun;
  }

  /**
   * Harvest using the @avala/renec-client package
   * This uses Playwright for real browser automation
   */
  private async harvestWithRenecClient(
    components: RenecComponent[],
  ): Promise<void> {
    if (!this.renecClient) {
      throw new Error("RENEC client not loaded");
    }

    const config = {
      headless: true,
      politeDelayMs: [800, 1500] as [number, number],
    };

    // Determine which drivers to use based on components
    const harvestEC = components.includes(RenecComponent.EC_STANDARDS);
    const harvestCertifiers = components.includes(
      RenecComponent.CERTIFICADORES,
    );
    const harvestCenters = components.includes(RenecComponent.CENTROS);
    const harvestSectors = components.includes(RenecComponent.SECTORES);

    // Run harvests in parallel where possible
    const promises: Promise<void>[] = [];

    if (harvestEC || harvestSectors) {
      // Full harvest gives us EC standards, sectors, comites, and relations
      promises.push(this.runFullHarvest(config));
    } else {
      // Individual component harvests
      if (harvestCertifiers) {
        promises.push(this.harvestCertifiersWithClient(config));
      }
      if (harvestCenters) {
        promises.push(this.harvestCentersWithClient(config));
      }
    }

    await Promise.all(promises);
  }

  private async runFullHarvest(config: {
    headless: boolean;
    politeDelayMs: [number, number];
  }): Promise<void> {
    if (!this.renecClient) return;

    this.logger.log("Running full harvest with renec-client...");

    try {
      const data = await this.renecClient.harvestAll(config);

      // Process EC standards
      for (const ec of data.ecStandards) {
        try {
          await this.upsertECFromClient(
            ec as unknown as Record<string, unknown>,
          );
          this.activeRun!.itemsScraped++;
        } catch (error) {
          this.logger.error(
            `Error processing EC: ${(ec as unknown as Record<string, unknown>).code}`,
            error,
          );
          this.activeRun!.errors++;
        }
      }

      // Process certifiers
      for (const cert of data.certifiers) {
        try {
          await this.upsertCertifierFromClient(
            cert as unknown as Record<string, unknown>,
          );
          this.activeRun!.itemsScraped++;
        } catch (error) {
          this.logger.error(`Error processing certifier`, error);
          this.activeRun!.errors++;
        }
      }

      // Process centers
      for (const center of data.centers) {
        try {
          await this.upsertCenterFromClient(
            center as unknown as Record<string, unknown>,
          );
          this.activeRun!.itemsScraped++;
        } catch (error) {
          this.logger.error(`Error processing center`, error);
          this.activeRun!.errors++;
        }
      }

      this.logger.log(
        `Full harvest stats: ${data.ecStandards.length} ECs, ${data.certifiers.length} certifiers, ${data.centers.length} centers`,
      );
    } catch (error) {
      this.logger.error("Full harvest with renec-client failed:", error);
      throw error;
    }
  }

  private async harvestCertifiersWithClient(config: {
    headless: boolean;
    politeDelayMs: [number, number];
  }): Promise<void> {
    if (!this.renecClient) return;

    const driver = this.renecClient.createDriver("certifier", config);
    const certifiers = await driver.harvest();

    for (const cert of certifiers) {
      try {
        await this.upsertCertifierFromClient(
          cert as unknown as Record<string, unknown>,
        );
        this.activeRun!.itemsScraped++;
      } catch (_error) {
        this.activeRun!.errors++;
      }
    }
  }

  private async harvestCentersWithClient(config: {
    headless: boolean;
    politeDelayMs: [number, number];
  }): Promise<void> {
    if (!this.renecClient) return;

    const driver = this.renecClient.createDriver("center", config);
    const centers = await driver.harvest();

    for (const center of centers) {
      try {
        await this.upsertCenterFromClient(
          center as unknown as Record<string, unknown>,
        );
        this.activeRun!.itemsScraped++;
      } catch (_error) {
        this.activeRun!.errors++;
      }
    }
  }

  // ============================================
  // UPSERT METHODS FOR RENEC-CLIENT DATA
  // ============================================

  private async upsertECFromClient(
    data: Record<string, unknown>,
  ): Promise<void> {
    const ecClave = (data.code as string) || (data.ecClave as string);
    if (!ecClave) {
      this.logger.warn("EC without code, skipping");
      return;
    }

    const contentHash = this.computeContentHash(data);

    await this.prisma.renecEC.upsert({
      where: { ecClave },
      create: {
        ecClave,
        titulo: (data.title as string) || (data.titulo as string) || "",
        version: (data.version as string) || "01",
        vigente: data.active !== false && data.vigente !== false,
        sector: (data.sector as string) || null,
        nivelCompetencia:
          (data.level as number) || (data.nivelCompetencia as number) || null,
        proposito:
          (data.purpose as string) || (data.proposito as string) || null,
        competencias: [],
        elementosJson: [],
        critDesempeno: [],
        critConocimiento: [],
        critProducto: [],
        sourceUrl: (data.url as string) || (data.sourceUrl as string) || null,
        contentHash,
      },
      update: {
        titulo: (data.title as string) || (data.titulo as string) || undefined,
        version: (data.version as string) || undefined,
        vigente: data.active !== false && data.vigente !== false,
        sector: (data.sector as string) || undefined,
        proposito:
          (data.purpose as string) || (data.proposito as string) || undefined,
        contentHash,
        lastSyncedAt: new Date(),
      },
    });
  }

  private async upsertCertifierFromClient(
    data: Record<string, unknown>,
  ): Promise<void> {
    const certId = (data.id as string) || (data.certId as string);
    if (!certId) {
      this.logger.warn("Certifier without ID, skipping");
      return;
    }

    const contentHash = this.computeContentHash(data);

    await this.prisma.renecCertifier.upsert({
      where: { certId },
      create: {
        certId,
        razonSocial:
          (data.name as string) || (data.razonSocial as string) || "",
        nombreComercial:
          (data.tradeName as string) ||
          (data.nombreComercial as string) ||
          null,
        activo: data.active !== false && data.activo !== false,
        direccion:
          (data.address as string) || (data.direccion as string) || null,
        telefono: this.normalizePhone(
          (data.phone as string) || (data.telefono as string),
        ),
        email: (data.email as string) || (data.correo as string) || null,
        sitioWeb: (data.website as string) || (data.sitioWeb as string) || null,
        representanteLegal:
          (data.legalRep as string) ||
          (data.representanteLegal as string) ||
          null,
        sourceUrl: (data.url as string) || (data.sourceUrl as string) || null,
        contentHash,
      },
      update: {
        razonSocial:
          (data.name as string) || (data.razonSocial as string) || undefined,
        nombreComercial:
          (data.tradeName as string) ||
          (data.nombreComercial as string) ||
          undefined,
        activo: data.active !== false && data.activo !== false,
        contentHash,
        lastSyncedAt: new Date(),
      },
    });
  }

  private async upsertCenterFromClient(
    data: Record<string, unknown>,
  ): Promise<void> {
    const centerId = (data.id as string) || (data.centerId as string);
    if (!centerId) {
      this.logger.warn("Center without ID, skipping");
      return;
    }

    const estado = (data.state as string) || (data.estado as string);
    const contentHash = this.computeContentHash(data);

    await this.prisma.renecCenter.upsert({
      where: { centerId },
      create: {
        centerId,
        nombre: (data.name as string) || (data.nombre as string) || "",
        activo: data.active !== false && data.activo !== false,
        direccion:
          (data.address as string) || (data.direccion as string) || null,
        telefono: this.normalizePhone(
          (data.phone as string) || (data.telefono as string),
        ),
        email: (data.email as string) || (data.correo as string) || null,
        estado: estado || null,
        estadoInegi: this.normalizeEstadoInegi(estado),
        municipio:
          (data.municipality as string) || (data.municipio as string) || null,
        codigoPostal:
          (data.zipCode as string) || (data.codigoPostal as string) || null,
        sourceUrl: (data.url as string) || (data.sourceUrl as string) || null,
        contentHash,
      },
      update: {
        nombre: (data.name as string) || (data.nombre as string) || undefined,
        activo: data.active !== false && data.activo !== false,
        estado: estado || undefined,
        estadoInegi: this.normalizeEstadoInegi(estado),
        contentHash,
        lastSyncedAt: new Date(),
      },
    });
  }

  // ============================================
  // LEGACY COMPONENT HARVESTING (Fallback)
  // ============================================

  async stopHarvest(runId: string): Promise<boolean> {
    if (this.activeRun?.id === runId) {
      this.isRunning = false;
      this.activeRun.status = HarvestStatus.FAILED;
      this.activeRun.endTime = new Date();

      this.logger.log(`Harvest ${runId} stopped manually`);
      return true;
    }
    return false;
  }

  getActiveRun(): HarvestRun | null {
    return this.activeRun;
  }

  async getHarvestRuns(limit = 10): Promise<HarvestRun[]> {
    const runs = await this.prisma.renecSyncJob.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return runs.map((r) => ({
      id: r.id,
      mode: HarvestMode.HARVEST,
      status:
        r.status === RenecSyncStatus.COMPLETED
          ? HarvestStatus.COMPLETED
          : r.status === RenecSyncStatus.FAILED
            ? HarvestStatus.FAILED
            : HarvestStatus.RUNNING,
      startTime: r.startedAt || r.createdAt,
      endTime: r.completedAt || undefined,
      itemsScraped: r.itemsProcessed,
      pagesCrawled: 0,
      errors: Array.isArray(r.errors) ? (r.errors as unknown[]).length : 0,
      components: [],
    }));
  }

  private async harvestComponent(
    component: RenecComponent,
    _maxPages: number,
  ): Promise<void> {
    this.logger.log(`Harvesting component (fallback mode): ${component}`);
    // Fallback mode - no actual harvesting without renec-client
    this.logger.warn(
      `Component ${component} harvest skipped - renec-client not available`,
    );
  }

  // ============================================
  // DATA NORMALIZATION
  // ============================================

  private normalizeEstadoInegi(
    estado: string | null | undefined,
  ): string | null {
    if (!estado) return null;
    const normalized = estado.trim();
    return ESTADO_INEGI_MAP[normalized] || null;
  }

  private normalizePhone(phone: string | null | undefined): string | null {
    if (!phone) return null;
    const digits = phone.replace(/[^\d+]/g, "");
    if (digits.startsWith("+")) return digits;
    if (digits.length === 10) return `+52${digits}`;
    return digits;
  }

  computeContentHash(data: Record<string, unknown>): string {
    const sorted = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash("sha256").update(sorted).digest("hex");
  }

  // ============================================
  // VALIDATION
  // ============================================

  validateECCode(code: string): boolean {
    return RENEC_VALIDATION_PATTERNS.ec_code.test(code);
  }

  validateEmail(email: string): boolean {
    return RENEC_VALIDATION_PATTERNS.email.test(email);
  }

  validatePhone(phone: string): boolean {
    return RENEC_VALIDATION_PATTERNS.phone.test(phone);
  }
}
