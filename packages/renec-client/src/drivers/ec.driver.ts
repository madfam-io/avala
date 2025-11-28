/**
 * EC Standards Driver (Updated for Angular SPA - Nov 2025)
 * Extracts Estándares de Competencia from CONOCER's new Angular portal
 *
 * The new RENEC portal at https://conocer.gob.mx/conocer/#/renec
 * is an Angular SPA that loads data dynamically via API calls.
 *
 * Features:
 * - EC Standards list extraction from #/renec
 * - EC Detail page extraction including certifiers, training centers
 * - Support for Angular Material tables with role="gridcell"
 */

import { BaseDriver, type ExtractedItem } from "./base.driver";
import {
  type ECStandard,
  type RenecClientConfig,
  RENEC_ENDPOINTS,
} from "../types";
import { cleanText, isValidECCode, generateRunId } from "../utils/helpers";

/** Extended EC data including certifiers and related entities */
export interface ECDetailData extends Partial<ECStandard> {
  descripcionCompleta?: string;
  ocupaciones?: string[];
  dofUrl?: string;
  dofFecha?: string;
  certificadores?: ECCertifierInfo[];
  centrosCapacitacion?: string[];
  comiteInfo?: {
    nombre: string;
    descripcion?: string;
  };
}

/** Certifier information from EC detail page */
export interface ECCertifierInfo {
  nombre: string;
  tipo?: "ECE" | "OC";
  estado?: string;
}

export class ECDriver extends BaseDriver {
  private runId: string;

  constructor(config: Partial<RenecClientConfig> = {}) {
    super(config);
    this.runId = generateRunId();
  }

  getStartUrls(): string[] {
    // Use the new SPA endpoint
    return [this.buildUrl(RENEC_ENDPOINTS.spa.renec)];
  }

  /**
   * Override harvest to handle Angular SPA
   */
  async harvest(): Promise<ExtractedItem[]> {
    const items: ExtractedItem[] = [];

    try {
      await this.initBrowser();

      const url = this.getStartUrls()[0];
      console.log(`[ECDriver] Navigating to: ${url}`);

      // Navigate to the RENEC SPA
      await this.page!.goto(url, { waitUntil: "networkidle" });

      // Wait for Angular to render the table
      const tableLoaded = await this.waitForAngularTable();
      if (!tableLoaded) {
        console.warn(
          "[ECDriver] Table did not load - trying alternative approach",
        );
        // Try intercepting API response instead
        const apiItems = await this.harvestViaApiIntercept();
        if (apiItems.length > 0) {
          return apiItems;
        }
      }

      // Extract from rendered table
      const tableItems = await this.extractFromTable();
      items.push(...tableItems);

      // Handle pagination if available
      let hasMore = await this.hasNextPage();
      while (hasMore) {
        await this.clickNextPage();
        await this.waitForAngularTable();
        const pageItems = await this.extractFromTable();
        items.push(...pageItems);
        hasMore = await this.hasNextPage();
      }

      console.log(`[ECDriver] Extracted ${items.length} EC standards`);
    } catch (error) {
      this.logError("harvest", error as Error);
    } finally {
      await this.closeBrowser();
    }

    return items;
  }

  /**
   * Wait for Angular table to render with data
   */
  private async waitForAngularTable(): Promise<boolean> {
    if (!this.page) return false;

    try {
      // Wait for loading indicator to disappear
      await this.page.waitForFunction(
        () => !document.body.textContent?.includes("cargando"),
        { timeout: 15000 },
      );

      // Wait for table rows to appear
      await this.page.waitForSelector(
        "table tbody tr, mat-row, .mat-row, [role='row']",
        {
          timeout: 15000,
        },
      );

      // Small delay for Angular to stabilize
      await this.page.waitForTimeout(1000);

      return true;
    } catch (error) {
      console.warn(
        "[ECDriver] Timeout waiting for table:",
        (error as Error).message,
      );
      return false;
    }
  }

  /**
   * Extract EC standards from the rendered Angular table
   */
  private async extractFromTable(): Promise<ExtractedItem[]> {
    if (!this.page) return [];

    const items: ExtractedItem[] = [];

    try {
      // Try different table selectors (Angular Material vs standard HTML)
      const rows = await this.page.$$(
        "table tbody tr, mat-row, .mat-mdc-row, [role='row']:not([role='row']:first-child)",
      );

      console.log(`[ECDriver] Found ${rows.length} table rows`);

      for (const row of rows) {
        try {
          const rowData = await this.page.evaluate((el) => {
            // Get all cells in the row
            const cells = el.querySelectorAll(
              "td, mat-cell, .mat-mdc-cell, [role='cell'], [role='gridcell']",
            );
            const cellTexts: string[] = [];

            cells.forEach((cell) => {
              cellTexts.push(cell.textContent?.trim() || "");
            });

            // Also check for click handler to get EC ID
            const clickableEl = el.querySelector("a, [routerlink], [click]");
            const link =
              clickableEl?.getAttribute("href") ||
              clickableEl?.getAttribute("routerlink") ||
              "";

            return { cells: cellTexts, link };
          }, row);

          // Expected columns: Código, Nivel, Título, Comité, Sector Productivo
          if (rowData.cells.length >= 3) {
            const ecCode = rowData.cells[0]?.trim();
            const nivel = rowData.cells[1]?.trim();
            const titulo = rowData.cells[2]?.trim();
            const comite = rowData.cells[3]?.trim() || "";
            const sector = rowData.cells[4]?.trim() || "";

            if (ecCode && isValidECCode(ecCode)) {
              const ecData: Partial<ECStandard> = {
                ecClave: ecCode,
                titulo: cleanText(titulo),
                nivel: nivel,
                comite: comite,
                sector: sector,
                vigente: true, // Assume active if in main list
                renecUrl: `${this.config.baseUrl}${RENEC_ENDPOINTS.spa.ecDetail}${ecCode}`,
                extractedAt: new Date().toISOString(),
              };

              ecData.contentHash = this.computeHash(
                ecData as Record<string, unknown>,
              );

              items.push({
                type: "ec_standard",
                data: ecData as Record<string, unknown>,
              });

              this.updateStats("itemsExtracted");
            }
          }
        } catch (rowError) {
          // Skip problematic rows
          continue;
        }
      }
    } catch (error) {
      this.logError("extractFromTable", error as Error);
    }

    return items;
  }

  /**
   * Alternative: Intercept API calls to get raw data
   */
  private async harvestViaApiIntercept(): Promise<ExtractedItem[]> {
    if (!this.page) return [];

    const items: ExtractedItem[] = [];

    try {
      // Set up request interception
      const apiData: Record<string, unknown>[] = [];

      await this.page.route("**/*", async (route) => {
        const request = route.request();
        const url = request.url();

        // Look for API calls that might contain EC data
        if (
          url.includes("api") ||
          url.includes("estandar") ||
          url.includes("renec")
        ) {
          const response = await route.fetch();
          try {
            const json = await response.json();
            if (Array.isArray(json)) {
              apiData.push(...json);
            } else if (json.data && Array.isArray(json.data)) {
              apiData.push(...json.data);
            } else if (json.content && Array.isArray(json.content)) {
              apiData.push(...json.content);
            }
          } catch {
            // Not JSON, continue
          }
          await route.fulfill({ response });
        } else {
          await route.continue();
        }
      });

      // Reload to capture API calls
      await this.page.reload({ waitUntil: "networkidle" });
      await this.page.waitForTimeout(3000);

      // Process captured API data
      for (const item of apiData) {
        const ecCode =
          (item.codigo as string) ||
          (item.ecClave as string) ||
          (item.code as string);

        if (ecCode && isValidECCode(ecCode)) {
          const ecData: Partial<ECStandard> = {
            ecClave: ecCode,
            titulo: cleanText(
              (item.titulo as string) || (item.title as string) || "",
            ),
            nivel: (item.nivel as string) || (item.level as string) || "",
            comite: (item.comite as string) || (item.committee as string) || "",
            sector:
              (item.sector as string) ||
              (item.sectorProductivo as string) ||
              "",
            vigente: item.vigente !== false && item.active !== false,
            renecUrl: `${this.config.baseUrl}${RENEC_ENDPOINTS.spa.ecDetail}${ecCode}`,
            extractedAt: new Date().toISOString(),
          };

          ecData.contentHash = this.computeHash(
            ecData as Record<string, unknown>,
          );

          items.push({
            type: "ec_standard",
            data: ecData as Record<string, unknown>,
          });

          this.updateStats("itemsExtracted");
        }
      }

      console.log(
        `[ECDriver] Extracted ${items.length} EC standards via API intercept`,
      );
    } catch (error) {
      this.logError("harvestViaApiIntercept", error as Error);
    }

    return items;
  }

  /**
   * Check if there's a next page in pagination
   */
  private async hasNextPage(): Promise<boolean> {
    if (!this.page) return false;

    try {
      const nextButton = await this.page.$(
        "button[aria-label='Siguiente']:not([disabled]), " +
          "button.mat-mdc-paginator-navigation-next:not([disabled]), " +
          ".pagination-next:not(.disabled)",
      );
      return nextButton !== null;
    } catch {
      return false;
    }
  }

  /**
   * Click next page button
   */
  private async clickNextPage(): Promise<void> {
    if (!this.page) return;

    try {
      await this.page.click(
        "button[aria-label='Siguiente'], " +
          "button.mat-mdc-paginator-navigation-next, " +
          ".pagination-next a",
      );
      await this.page.waitForTimeout(500);
    } catch (error) {
      console.warn(
        "[ECDriver] Failed to click next page:",
        (error as Error).message,
      );
    }
  }

  // ============================================
  // EC Detail Extraction (Certifiers, Training Centers, etc.)
  // ============================================

  /**
   * Harvest EC standards with full detail data including certifiers
   * This is a more comprehensive but slower extraction
   */
  async harvestWithDetails(
    options: { maxItems?: number; ecCodes?: string[] } = {},
  ): Promise<ExtractedItem[]> {
    const items: ExtractedItem[] = [];
    const { maxItems, ecCodes } = options;

    try {
      await this.initBrowser();

      // First get list of EC codes if not provided
      let targetCodes = ecCodes || [];

      if (targetCodes.length === 0) {
        console.log("[ECDriver] Fetching EC list first...");
        const listItems = await this.harvest();
        targetCodes = listItems
          .map((item) => item.data.ecClave as string)
          .filter(Boolean);

        if (maxItems && targetCodes.length > maxItems) {
          targetCodes = targetCodes.slice(0, maxItems);
        }

        // Add list items to results
        items.push(...listItems);
      }

      console.log(
        `[ECDriver] Extracting details for ${targetCodes.length} ECs...`,
      );

      // Extract detail for each EC
      for (let i = 0; i < targetCodes.length; i++) {
        const ecCode = targetCodes[i];
        console.log(
          `[ECDriver] Processing ${ecCode} (${i + 1}/${targetCodes.length})`,
        );

        try {
          const detailData = await this.extractECDetail(ecCode);
          if (detailData) {
            items.push({
              type: "ec_detail",
              data: detailData as Record<string, unknown>,
            });

            // Also yield certifier relationships
            if (detailData.certificadores?.length) {
              for (const cert of detailData.certificadores) {
                items.push({
                  type: "ec_certifier_relation",
                  data: {
                    ecClave: ecCode,
                    certifierName: cert.nombre,
                    certifierType: cert.tipo,
                    runId: this.runId,
                    extractedAt: new Date().toISOString(),
                  },
                });
              }
            }
          }
        } catch (error) {
          console.warn(
            `[ECDriver] Failed to extract detail for ${ecCode}:`,
            (error as Error).message,
          );
        }

        // Polite delay between detail pages
        await this.page?.waitForTimeout(500);
      }

      console.log(`[ECDriver] Extracted ${items.length} total items`);
    } catch (error) {
      this.logError("harvestWithDetails", error as Error);
    } finally {
      await this.closeBrowser();
    }

    return items;
  }

  /**
   * Extract full detail data for a single EC including certifiers
   */
  async extractECDetail(ecCode: string): Promise<ECDetailData | null> {
    if (!this.page) {
      await this.initBrowser();
    }

    try {
      // Navigate to EC detail page - must go through list first
      // Direct navigation to detail redirects to agendarCita
      const listUrl = this.buildUrl(RENEC_ENDPOINTS.spa.renec);
      await this.page!.goto(listUrl, { waitUntil: "networkidle" });
      await this.waitForAngularTable();

      // Search/filter for the specific EC code
      const searchInput = await this.page!.$(
        'input[type="text"], input[placeholder*="Buscar"], mat-form-field input',
      );
      if (searchInput) {
        await searchInput.fill(ecCode);
        await this.page!.waitForTimeout(1500); // Wait for filter
      }

      // Click on the EC row to navigate to detail
      const ecRow = await this.page!.$(
        `tr:has-text("${ecCode}"), mat-row:has-text("${ecCode}")`,
      );
      if (!ecRow) {
        console.warn(`[ECDriver] EC ${ecCode} not found in list`);
        return null;
      }

      await ecRow.click();
      await this.page!.waitForTimeout(2000); // Wait for navigation

      // Wait for detail page to load
      await this.page!.waitForSelector(
        "mat-expansion-panel, .mat-expansion-panel",
        {
          timeout: 10000,
        },
      );

      const detailData: ECDetailData = {
        ecClave: ecCode,
        extractedAt: new Date().toISOString(),
      };

      // Extract description section
      const descriptionData = await this.extractDescriptionSection();
      Object.assign(detailData, descriptionData);

      // Extract certifiers section
      detailData.certificadores = await this.extractCertifiersSection();

      // Extract training centers section
      detailData.centrosCapacitacion =
        await this.extractTrainingCentersSection();

      // Extract committee info section
      detailData.comiteInfo = await this.extractCommitteeSection();

      detailData.contentHash = this.computeHash(
        detailData as Record<string, unknown>,
      );

      return detailData;
    } catch (error) {
      this.logError(`extractECDetail/${ecCode}`, error as Error);
      return null;
    }
  }

  /**
   * Extract description section from EC detail page
   */
  private async extractDescriptionSection(): Promise<Partial<ECDetailData>> {
    if (!this.page) return {};

    const data: Partial<ECDetailData> = {};

    try {
      // Expand description panel if collapsed
      const descPanel = await this.page.$(
        'mat-expansion-panel:has-text("DESCRIPCIÓN"), mat-expansion-panel:first-of-type',
      );
      if (descPanel) {
        const isExpanded = await descPanel.getAttribute("class");
        if (!isExpanded?.includes("mat-expanded")) {
          await descPanel.click();
          await this.page.waitForTimeout(500);
        }
      }

      // Extract full description text
      data.descripcionCompleta = await this.extractText(
        "mat-expansion-panel:first-of-type .mat-expansion-panel-body p, .descripcion-estandar",
      );

      // Extract occupations list
      const ocupacionesText = await this.extractAllText(
        "mat-expansion-panel:first-of-type li, .ocupaciones li",
      );
      if (ocupacionesText.length > 0) {
        data.ocupaciones = ocupacionesText.map((o) => cleanText(o));
      }

      // Extract DOF link and date
      const dofLink = await this.page.$('a[href*="dof.gob.mx"]');
      if (dofLink) {
        data.dofUrl = (await dofLink.getAttribute("href")) || undefined;
        data.dofFecha = (await dofLink.textContent()) || undefined;
      }
    } catch (error) {
      console.warn(
        "[ECDriver] Error extracting description:",
        (error as Error).message,
      );
    }

    return data;
  }

  /**
   * Extract certifiers (ECE/OC) from "¿EN DÓNDE PUEDO CERTIFICARME?" section
   */
  private async extractCertifiersSection(): Promise<ECCertifierInfo[]> {
    if (!this.page) return [];

    const certifiers: ECCertifierInfo[] = [];

    try {
      // Find and expand the certifiers panel
      const certPanel = await this.page.$(
        'mat-expansion-panel:has-text("CERTIFICARME"), mat-expansion-panel:has-text("DÓNDE PUEDO CERTIFICARME")',
      );

      if (!certPanel) {
        console.warn("[ECDriver] Certifiers panel not found");
        return [];
      }

      // Expand panel if not already expanded
      const isExpanded = await certPanel.getAttribute("class");
      if (!isExpanded?.includes("mat-expanded")) {
        await certPanel.click();
        await this.page.waitForTimeout(1000); // Wait for content to load
      }

      // Wait for certifier list to appear
      await this.page
        .waitForSelector(
          "mat-expansion-panel .mat-expansion-panel-body li, .certificadores-list li, .mat-list-item",
          { timeout: 5000 },
        )
        .catch(() => {});

      // Extract certifier names from list
      const certifierElements = await this.page.$$(
        'mat-expansion-panel:has-text("CERTIFICARME") li, mat-expansion-panel:has-text("CERTIFICARME") .mat-list-item, .certificadores-list li',
      );

      for (const el of certifierElements) {
        const text = await el.textContent();
        if (text) {
          const nombre = cleanText(text);
          if (nombre && nombre.length > 2) {
            certifiers.push({
              nombre,
              // Try to infer type from name patterns
              tipo: this.inferCertifierType(nombre),
            });
          }
        }
      }

      // If no list items found, try table format
      if (certifiers.length === 0) {
        const tableRows = await this.page.$$(
          'mat-expansion-panel:has-text("CERTIFICARME") table tr, mat-expansion-panel:has-text("CERTIFICARME") mat-row',
        );

        for (const row of tableRows) {
          const cells = await row.$$("td, mat-cell, [role='gridcell']");
          if (cells.length > 0) {
            const nombre = cleanText((await cells[0].textContent()) || "");
            if (nombre && nombre.length > 2) {
              certifiers.push({
                nombre,
                tipo: this.inferCertifierType(nombre),
                estado:
                  cells.length > 1
                    ? cleanText((await cells[1].textContent()) || "")
                    : undefined,
              });
            }
          }
        }
      }

      console.log(`[ECDriver] Extracted ${certifiers.length} certifiers`);
    } catch (error) {
      console.warn(
        "[ECDriver] Error extracting certifiers:",
        (error as Error).message,
      );
    }

    return certifiers;
  }

  /**
   * Extract training centers from "¿EN DÓNDE PUEDO CAPACITARME?" section
   */
  private async extractTrainingCentersSection(): Promise<string[]> {
    if (!this.page) return [];

    const centers: string[] = [];

    try {
      // Find and expand the training centers panel
      const trainingPanel = await this.page.$(
        'mat-expansion-panel:has-text("CAPACITARME"), mat-expansion-panel:has-text("DÓNDE PUEDO CAPACITARME")',
      );

      if (!trainingPanel) {
        return [];
      }

      // Expand panel if not already expanded
      const isExpanded = await trainingPanel.getAttribute("class");
      if (!isExpanded?.includes("mat-expanded")) {
        await trainingPanel.click();
        await this.page.waitForTimeout(1000);
      }

      // Extract training center names
      const centerElements = await this.page.$$(
        'mat-expansion-panel:has-text("CAPACITARME") li, mat-expansion-panel:has-text("CAPACITARME") .mat-list-item',
      );

      for (const el of centerElements) {
        const text = await el.textContent();
        if (text) {
          const nombre = cleanText(text);
          if (nombre && nombre.length > 2) {
            centers.push(nombre);
          }
        }
      }

      console.log(`[ECDriver] Extracted ${centers.length} training centers`);
    } catch (error) {
      console.warn(
        "[ECDriver] Error extracting training centers:",
        (error as Error).message,
      );
    }

    return centers;
  }

  /**
   * Extract committee info from "COMITÉ DE GESTIÓN" section
   */
  private async extractCommitteeSection(): Promise<
    { nombre: string; descripcion?: string } | undefined
  > {
    if (!this.page) return undefined;

    try {
      // Find and expand the committee panel
      const committeePanel = await this.page.$(
        'mat-expansion-panel:has-text("COMITÉ"), mat-expansion-panel:has-text("GESTIÓN")',
      );

      if (!committeePanel) {
        return undefined;
      }

      // Expand panel if not already expanded
      const isExpanded = await committeePanel.getAttribute("class");
      if (!isExpanded?.includes("mat-expanded")) {
        await committeePanel.click();
        await this.page.waitForTimeout(500);
      }

      // Extract committee info
      const nombre = await this.extractText(
        'mat-expansion-panel:has-text("COMITÉ") h3, mat-expansion-panel:has-text("COMITÉ") .comite-nombre',
      );

      const descripcion = await this.extractText(
        'mat-expansion-panel:has-text("COMITÉ") p, mat-expansion-panel:has-text("COMITÉ") .comite-descripcion',
      );

      if (nombre) {
        return {
          nombre: cleanText(nombre),
          descripcion: descripcion ? cleanText(descripcion) : undefined,
        };
      }
    } catch (error) {
      console.warn(
        "[ECDriver] Error extracting committee info:",
        (error as Error).message,
      );
    }

    return undefined;
  }

  /**
   * Infer certifier type from name patterns
   */
  private inferCertifierType(nombre: string): "ECE" | "OC" | undefined {
    const lower = nombre.toLowerCase();

    // Universities and educational institutions are typically ECEs
    if (
      lower.includes("universidad") ||
      lower.includes("instituto") ||
      lower.includes("colegio") ||
      lower.includes("escuela") ||
      lower.includes("tecnológico") ||
      lower.includes("politécnico")
    ) {
      return "ECE";
    }

    // Government agencies are typically ECEs
    if (
      lower.includes("secretaría") ||
      lower.includes("gobierno") ||
      lower.includes("imss") ||
      lower.includes("issste") ||
      lower.includes("pemex")
    ) {
      return "ECE";
    }

    // Companies with S.A., S.C., etc. are typically OCs
    if (
      lower.includes("s.a.") ||
      lower.includes("s.c.") ||
      lower.includes("s. de r.l.") ||
      lower.includes("consultoría") ||
      lower.includes("consultores")
    ) {
      return "OC";
    }

    return undefined;
  }

  // ============================================
  // Legacy methods (kept for compatibility)
  // ============================================

  async parse(html: string, url: string): Promise<ExtractedItem[]> {
    // Not used in SPA mode - data is extracted via Playwright
    return [];
  }

  async parseDetail(
    html: string,
    url: string,
    meta?: Record<string, unknown>,
  ): Promise<ExtractedItem | null> {
    // Not used in SPA mode
    return null;
  }

  validateItem(item: Record<string, unknown>): boolean {
    const required = ["ecClave", "titulo"];

    for (const field of required) {
      if (!item[field]) {
        console.warn(`[ECDriver] Missing required field: ${field}`);
        return false;
      }
    }

    if (!isValidECCode(item.ecClave as string)) {
      console.warn(`[ECDriver] Invalid EC code: ${item.ecClave}`);
      return false;
    }

    return true;
  }
}
