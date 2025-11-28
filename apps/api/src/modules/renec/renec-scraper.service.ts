import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
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

interface ScrapedItem {
  type: RenecComponent;
  data: Record<string, unknown>;
  srcUrl: string;
  contentHash: string;
}

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

@Injectable()
export class RenecScraperService implements OnModuleInit {
  private readonly logger = new Logger(RenecScraperService.name);
  private activeRun: HarvestRun | null = null;
  private isRunning = false;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log("RENEC Scraper Service initialized");
  }

  // ============================================
  // SCHEDULED JOBS (Call via external scheduler or cron)
  // ============================================

  async dailyProbe() {
    this.logger.log("Starting daily RENEC probe...");
    await this.startHarvest({
      mode: HarvestMode.PROBE,
      components: [RenecComponent.EC_STANDARDS, RenecComponent.CERTIFICADORES],
      maxPages: 500,
      concurrency: 5,
    });
  }

  // Run weekly on Sunday at 3 AM via external scheduler
  async weeklyFullHarvest() {
    this.logger.log("Starting weekly full RENEC harvest...");
    await this.startHarvest({
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

  // Run daily at 6 AM via external scheduler
  async checkDataFreshness() {
    this.logger.log("Checking RENEC data freshness...");
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const staleCounts = await Promise.all([
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

    const [staleCenters, staleCertifiers, staleECs] = staleCounts;

    if (staleCenters > 0 || staleCertifiers > 0 || staleECs > 0) {
      this.logger.warn(
        `Stale data detected: ${staleCenters} centers, ${staleCertifiers} certifiers, ${staleECs} EC standards`,
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
    this.logger.log(`Starting harvest run: ${runId}`);

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
      // Run harvest for each component
      for (const component of components) {
        await this.harvestComponent(component, options.maxPages || 500);
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
        },
      });

      this.logger.log(
        `Harvest ${runId} completed: ${this.activeRun.itemsScraped} items, ${this.activeRun.pagesCrawled} pages`,
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
          errors: [{ message: (error as Error).message }],
        },
      });

      this.logger.error(`Harvest ${runId} failed:`, error);
      throw error;
    } finally {
      this.isRunning = false;
    }

    return this.activeRun;
  }

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

  // ============================================
  // COMPONENT HARVESTING
  // ============================================

  private async harvestComponent(
    component: RenecComponent,
    maxPages: number,
  ): Promise<void> {
    this.logger.log(`Harvesting component: ${component}`);

    switch (component) {
      case RenecComponent.EC_STANDARDS:
        await this.harvestECStandards(maxPages);
        break;
      case RenecComponent.CERTIFICADORES:
        await this.harvestCertifiers(maxPages);
        break;
      case RenecComponent.CENTROS:
        await this.harvestCenters(maxPages);
        break;
    }
  }

  private async harvestECStandards(maxPages: number): Promise<void> {
    // Simulate fetching EC standards from RENEC
    // In production, this would use Puppeteer/Playwright to scrape the actual site
    const items = await this.fetchECStandardsFromRenec(maxPages);

    for (const item of items) {
      try {
        await this.upsertECStandard(item);
        this.activeRun!.itemsScraped++;
      } catch (error) {
        this.logger.error(`Error processing EC standard:`, error);
        this.activeRun!.errors++;
      }
    }

    this.activeRun!.pagesCrawled += Math.ceil(items.length / 20);
  }

  private async harvestCertifiers(maxPages: number): Promise<void> {
    const items = await this.fetchCertifiersFromRenec(maxPages);

    for (const item of items) {
      try {
        await this.upsertCertifier(item);
        this.activeRun!.itemsScraped++;
      } catch (error) {
        this.logger.error(`Error processing certifier:`, error);
        this.activeRun!.errors++;
      }
    }

    this.activeRun!.pagesCrawled += Math.ceil(items.length / 20);
  }

  private async harvestCenters(maxPages: number): Promise<void> {
    const items = await this.fetchCentersFromRenec(maxPages);

    for (const item of items) {
      try {
        await this.upsertCenter(item);
        this.activeRun!.itemsScraped++;
      } catch (error) {
        this.logger.error(`Error processing center:`, error);
        this.activeRun!.errors++;
      }
    }

    this.activeRun!.pagesCrawled += Math.ceil(items.length / 20);
  }

  // ============================================
  // DATA FETCHING (Scraping Logic)
  // ============================================

  private async fetchECStandardsFromRenec(
    maxPages: number,
  ): Promise<ScrapedItem[]> {
    // This is where the actual web scraping would happen
    // Using Puppeteer/Playwright to navigate RENEC and extract data
    // For now, return empty array - implement actual scraping logic

    this.logger.log(`Fetching EC standards (max ${maxPages} pages)...`);

    // TODO: Implement actual RENEC scraping
    // const browser = await puppeteer.launch({ headless: true });
    // const page = await browser.newPage();
    // await page.goto(RENEC_BASE_URL + RENEC_ENDPOINTS.ec_standard[0]);
    // ... extract data from page ...

    return [];
  }

  private async fetchCertifiersFromRenec(
    maxPages: number,
  ): Promise<ScrapedItem[]> {
    this.logger.log(`Fetching certifiers (max ${maxPages} pages)...`);
    return [];
  }

  private async fetchCentersFromRenec(
    maxPages: number,
  ): Promise<ScrapedItem[]> {
    this.logger.log(`Fetching centers (max ${maxPages} pages)...`);
    return [];
  }

  // ============================================
  // DATA PERSISTENCE
  // ============================================

  private async upsertECStandard(item: ScrapedItem): Promise<void> {
    const data = item.data;

    await this.prisma.renecEC.upsert({
      where: { ecClave: data.ecClave as string },
      create: {
        ecClave: data.ecClave as string,
        titulo: data.titulo as string,
        version: (data.version as string) || "01",
        vigente: (data.vigente as boolean) ?? true,
        sector: data.sector as string | null,
        nivelCompetencia: data.nivelCompetencia as number | null,
        proposito: data.proposito as string | null,
        competencias: (data.competencias as object[]) || [],
        elementosJson: (data.elementosJson as object[]) || [],
        critDesempeno: (data.critDesempeno as object[]) || [],
        critConocimiento: (data.critConocimiento as object[]) || [],
        critProducto: (data.critProducto as object[]) || [],
        fechaPublicacion: data.fechaPublicacion
          ? new Date(data.fechaPublicacion as string)
          : null,
        fechaFinVigencia: data.fechaFinVigencia
          ? new Date(data.fechaFinVigencia as string)
          : null,
        sourceUrl: item.srcUrl,
        contentHash: item.contentHash,
      },
      update: {
        titulo: data.titulo as string,
        version: data.version as string,
        vigente: data.vigente as boolean,
        sector: data.sector as string | null,
        proposito: data.proposito as string | null,
        contentHash: item.contentHash,
        lastSyncedAt: new Date(),
      },
    });
  }

  private async upsertCertifier(item: ScrapedItem): Promise<void> {
    const data = item.data;

    await this.prisma.renecCertifier.upsert({
      where: { certId: data.certId as string },
      create: {
        certId: data.certId as string,
        razonSocial: data.razonSocial as string,
        nombreComercial: data.nombreComercial as string | null,
        activo: (data.activo as boolean) ?? true,
        direccion: data.direccion as string | null,
        telefono: this.normalizePhone(data.telefono as string),
        email: data.email as string | null,
        sitioWeb: data.sitioWeb as string | null,
        rfc: data.rfc as string | null,
        representanteLegal: data.representanteLegal as string | null,
        sourceUrl: item.srcUrl,
        contentHash: item.contentHash,
      },
      update: {
        razonSocial: data.razonSocial as string,
        nombreComercial: data.nombreComercial as string | null,
        activo: data.activo as boolean,
        contentHash: item.contentHash,
        lastSyncedAt: new Date(),
      },
    });
  }

  private async upsertCenter(item: ScrapedItem): Promise<void> {
    const data = item.data;

    await this.prisma.renecCenter.upsert({
      where: { centerId: data.centerId as string },
      create: {
        centerId: data.centerId as string,
        nombre: data.nombre as string,
        activo: (data.activo as boolean) ?? true,
        direccion: data.direccion as string | null,
        telefono: this.normalizePhone(data.telefono as string),
        email: data.email as string | null,
        estado: data.estado as string | null,
        estadoInegi: this.normalizeEstadoInegi(data.estado as string),
        municipio: data.municipio as string | null,
        codigoPostal: data.codigoPostal as string | null,
        sourceUrl: item.srcUrl,
        contentHash: item.contentHash,
      },
      update: {
        nombre: data.nombre as string,
        activo: data.activo as boolean,
        estado: data.estado as string | null,
        estadoInegi: this.normalizeEstadoInegi(data.estado as string),
        contentHash: item.contentHash,
        lastSyncedAt: new Date(),
      },
    });
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
    // Remove all non-digit characters except +
    const digits = phone.replace(/[^\d+]/g, "");
    // Add Mexico country code if not present
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
