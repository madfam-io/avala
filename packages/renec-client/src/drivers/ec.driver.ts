/**
 * EC Standards Driver
 * Extracts Estándares de Competencia from RENEC
 */

import { BaseDriver, type ExtractedItem } from "./base.driver";
import {
  type ECStandard,
  type ECListingType,
  type RenecClientConfig,
  RENEC_ENDPOINTS,
} from "../types";
import {
  cleanText,
  isValidECCode,
  parseDate,
  generateRunId,
} from "../utils/helpers";

export class ECDriver extends BaseDriver {
  private runId: string;

  constructor(config: Partial<RenecClientConfig> = {}) {
    super(config);
    this.runId = generateRunId();
  }

  getStartUrls(): string[] {
    return [
      this.buildUrl(RENEC_ENDPOINTS.ec.active),
      this.buildUrl(RENEC_ENDPOINTS.ec.inactive),
      this.buildUrl(RENEC_ENDPOINTS.ec.historical),
    ];
  }

  private determineListingType(url: string): ECListingType {
    if (url.includes("ESLACT")) return "active";
    if (url.includes("ESLINACT")) return "inactive";
    if (url.includes("ESLHIST")) return "historical";
    if (url.includes("ECNew")) return "new";
    return "unknown";
  }

  async parse(html: string, url: string): Promise<ExtractedItem[]> {
    const items: ExtractedItem[] = [];
    const listingType = this.determineListingType(url);

    if (!this.page) return items;

    try {
      // Try table format
      const rows = await this.page.$$("table.table tr:not(:first-child)");

      if (rows.length > 0) {
        for (const row of rows) {
          const ecData = await this.extractECFromTableRow(row, listingType);
          if (ecData && ecData.ecClave && isValidECCode(ecData.ecClave)) {
            // Fetch detail page
            const detailUrl = this.buildUrl(
              `${RENEC_ENDPOINTS.ec.detail}${ecData.ecClave}`,
            );

            try {
              const detailHtml = await this.fetchPage(detailUrl);
              const detailItem = await this.parseDetail(detailHtml, detailUrl, {
                ecData,
                listingType,
              });

              if (detailItem) {
                items.push(detailItem);
              }
            } catch (error) {
              this.logError(detailUrl, error as Error);
              // Still yield basic data if detail fetch fails
              items.push({
                type: "ec_standard",
                data: {
                  ...ecData,
                  vigente: listingType === "active",
                  renecUrl: detailUrl,
                  extractedAt: new Date().toISOString(),
                  contentHash: this.computeHash(
                    ecData as unknown as Record<string, unknown>,
                  ),
                },
              });
            }
          }
        }
      } else {
        // Try alternative div-based format
        const divItems = await this.page.$$("div.ec-item, div.estandar-item");

        for (const div of divItems) {
          const ecData = await this.extractECFromDiv(div, listingType);
          if (ecData && ecData.ecClave && isValidECCode(ecData.ecClave)) {
            items.push({
              type: "ec_standard",
              data: ecData,
            });
          }
        }
      }
    } catch (error) {
      this.logError(url, error as Error);
    }

    return items;
  }

  async parseDetail(
    html: string,
    url: string,
    meta?: Record<string, unknown>,
  ): Promise<ExtractedItem | null> {
    if (!this.page) return null;

    const ecData = (meta?.ecData as Partial<ECStandard>) || {};
    const listingType = (meta?.listingType as ECListingType) || "unknown";

    try {
      const detailData: ECStandard = {
        ecClave: ecData.ecClave || (await this.extractECCode()),
        titulo: await this.extractTitulo(),
        version: await this.extractVersion(),
        vigente: listingType === "active",
        sector: await this.extractSector(),
        sectorId: await this.extractSectorId(),
        comite: await this.extractComite(),
        comiteId: await this.extractComiteId(),
        descripcion: await this.extractDescripcion(),
        competencias: await this.extractCompetencias(),
        nivel: await this.extractNivel(),
        duracionHoras: await this.extractDuracion(),
        tipoNorma: await this.extractTipoNorma(),
        fechaPublicacion: await this.extractFechaPublicacion(),
        fechaVigencia: await this.extractFechaVigencia(),
        perfilEvaluador: await this.extractPerfilEvaluador(),
        criteriosEvaluacion: await this.extractCriterios(),
        renecUrl: url,
        extractedAt: new Date().toISOString(),
        contentHash: "", // Will be computed after
      };

      // Merge with listing data
      Object.assign(detailData, ecData);

      // Clean and compute hash
      const cleanedData = this.cleanECData(detailData);
      cleanedData.contentHash = this.computeHash(
        cleanedData as unknown as Record<string, unknown>,
      );

      if (
        this.validateItem(cleanedData as unknown as Record<string, unknown>)
      ) {
        this.updateStats("itemsExtracted");
        return {
          type: "ec_standard",
          data: cleanedData as unknown as Record<string, unknown>,
        };
      }
    } catch (error) {
      this.logError(url, error as Error);
    }

    return null;
  }

  private async extractECFromTableRow(
    row: unknown,
    _listingType: ECListingType,
  ): Promise<Partial<ECStandard> | null> {
    try {
      // Using page evaluation for row extraction
      // Note: evaluate runs in browser context where DOM types exist
      const data = await this.page!.evaluate((el) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cells = (el as any).querySelectorAll("td");
        return {
          ecClave: cells[0]?.textContent?.trim() || "",
          titulo: cells[1]?.textContent?.trim() || "",
        };
      }, row);

      if (data.ecClave && isValidECCode(data.ecClave)) {
        return {
          ecClave: data.ecClave,
          titulo: cleanText(data.titulo),
        };
      }
    } catch {
      // Ignore extraction errors for individual rows
    }

    return null;
  }

  private async extractECFromDiv(
    div: unknown,
    listingType: ECListingType,
  ): Promise<Partial<ECStandard> | null> {
    try {
      // Note: evaluate runs in browser context where DOM types exist
      const data = await this.page!.evaluate((el) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const element = el as any;
        return {
          ecClave: element.querySelector(".ec-code")?.textContent?.trim() || "",
          titulo: element.querySelector(".ec-title")?.textContent?.trim() || "",
        };
      }, div);

      if (data.ecClave && isValidECCode(data.ecClave)) {
        return {
          ecClave: data.ecClave,
          titulo: cleanText(data.titulo),
          vigente: listingType === "active",
        };
      }
    } catch {
      // Ignore
    }

    return null;
  }

  private async extractECCode(): Promise<string> {
    const selectors = ["h1.ec-title", ".ec-code", 'span[id="codigo"]'];

    for (const selector of selectors) {
      const text = await this.extractText(selector);
      const match = text.match(/EC\d{4}/);
      if (match) return match[0];
    }

    return "";
  }

  private async extractTitulo(): Promise<string> {
    const selectors = [
      "h1.ec-title",
      "div.titulo-estandar",
      'td:has-text("Título") + td',
      "span#titulo",
    ];

    for (const selector of selectors) {
      const text = await this.extractText(selector);
      if (text && text.length > 10) return text;
    }

    return "";
  }

  private async extractVersion(): Promise<string> {
    const text = await this.extractText('td:has-text("Versión") + td');
    const match = text.match(/(\d+\.?\d*)/);
    return match ? match[1] : "1.0";
  }

  private async extractSector(): Promise<string> {
    return this.extractText('td:has-text("Sector") + td');
  }

  private async extractSectorId(): Promise<string | undefined> {
    const href = await this.extractAttribute('a[href*="sector="]', "href");
    if (href) {
      const match = href.match(/sector=(\d+)/);
      if (match) return match[1];
    }
    return undefined;
  }

  private async extractComite(): Promise<string> {
    return this.extractText('td:has-text("Comité") + td');
  }

  private async extractComiteId(): Promise<string | undefined> {
    const href = await this.extractAttribute('a[href*="comite="]', "href");
    if (href) {
      const match = href.match(/comite=(\d+)/);
      if (match) return match[1];
    }
    return undefined;
  }

  private async extractDescripcion(): Promise<string> {
    const selectors = [
      "div.descripcion",
      'td:has-text("Descripción") + td',
      "div#descripcion",
    ];

    for (const selector of selectors) {
      const text = await this.extractText(selector);
      if (text) return text;
    }

    return "";
  }

  private async extractCompetencias(): Promise<string[]> {
    const selectors = [
      "ul.competencias li",
      "div.competencia-item",
      'td:has-text("Elementos") + td li',
    ];

    for (const selector of selectors) {
      const items = await this.extractAllText(selector);
      if (items.length > 0) return items;
    }

    return [];
  }

  private async extractNivel(): Promise<string> {
    return this.extractText('td:has-text("Nivel") + td');
  }

  private async extractDuracion(): Promise<number | undefined> {
    const text = await this.extractText('td:has-text("Duración") + td');
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : undefined;
  }

  private async extractTipoNorma(): Promise<string> {
    return this.extractText('td:has-text("Tipo") + td');
  }

  private async extractFechaPublicacion(): Promise<string | undefined> {
    const text = await this.extractText('td:has-text("Publicación") + td');
    return text ? (parseDate(text) ?? undefined) : undefined;
  }

  private async extractFechaVigencia(): Promise<string | undefined> {
    const text = await this.extractText('td:has-text("Vigencia") + td');
    return text ? (parseDate(text) ?? undefined) : undefined;
  }

  private async extractPerfilEvaluador(): Promise<string> {
    return this.extractText("div.perfil-evaluador");
  }

  private async extractCriterios(): Promise<string[]> {
    return this.extractAllText("div.criterios li");
  }

  private cleanECData(data: ECStandard): ECStandard {
    const cleaned = { ...data };

    // Normalize EC code
    if (cleaned.ecClave) {
      cleaned.ecClave = cleaned.ecClave.toUpperCase().trim();
    }

    // Filter empty competencies
    if (cleaned.competencias) {
      cleaned.competencias = cleaned.competencias.filter(Boolean);
    }

    // Filter empty criteria
    if (cleaned.criteriosEvaluacion) {
      cleaned.criteriosEvaluacion = cleaned.criteriosEvaluacion.filter(Boolean);
    }

    return cleaned;
  }

  validateItem(item: Record<string, unknown>): boolean {
    const required = ["ecClave", "titulo", "renecUrl"];

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

    if ((item.titulo as string).length < 10) {
      console.warn(`[ECDriver] Title too short: ${item.titulo}`);
      return false;
    }

    return true;
  }
}
