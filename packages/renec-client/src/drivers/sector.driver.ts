/**
 * Sector and Committee driver for RENEC data extraction (Updated Nov 2025)
 * Extracts Sectores and Comités from CONOCER's new Angular SPA
 *
 * The new portal uses:
 * - #/sectoresProductivos for SCIAN productive sectors (20 total)
 * - #/sectoresOrganizacionales for occupational sectors
 */

import { BaseDriver, type ExtractedItem } from "./base.driver";
// Types Sector and Comite are defined in ../types but we use Record<string, unknown> for flexibility
import { RENEC_ENDPOINTS } from "../types";
import { cleanText, computeContentHash } from "../utils/helpers";

// Legacy endpoints (kept for reference - may redirect to homepage)
const LEGACY_SECTOR_ENDPOINTS = {
  sectores: "/RENEC/controlador.do?comp=SECTORES",
  sectorDetail: "/RENEC/controlador.do?comp=SECTOR&id=",
  comites: "/RENEC/controlador.do?comp=COMITES",
  comiteDetail: "/RENEC/controlador.do?comp=COMITE&id=",
  sectorComites: "/RENEC/controlador.do?comp=SECTOR_COMITES&id=",
  comiteStandards: "/RENEC/controlador.do?comp=COMITE_EC&id=",
} as const;



export class SectorDriver extends BaseDriver {
  private pendingDetailRequests: Array<{
    type: "sector" | "comite";
    id: string;
    basicData: Record<string, unknown>;
  }> = [];

  getStartUrls(): string[] {
    // Use new SPA endpoints
    return [this.buildUrl(RENEC_ENDPOINTS.spa.sectors)];
  }

  /**
   * Override harvest for Angular SPA extraction
   */
  async harvest(): Promise<ExtractedItem[]> {
    const items: ExtractedItem[] = [];

    try {
      await this.initBrowser();

      // Extract productive sectors from new SPA
      const sectorItems = await this.harvestProductiveSectors();
      items.push(...sectorItems);

      console.log(`[SectorDriver] Extracted ${items.length} sectors`);
    } catch (error) {
      this.logError("harvest", error as Error);
    } finally {
      await this.closeBrowser();
    }

    return items;
  }

  /**
   * Extract productive sectors from #/sectoresProductivos
   */
  private async harvestProductiveSectors(): Promise<ExtractedItem[]> {
    const items: ExtractedItem[] = [];

    if (!this.page) return items;

    try {
      const url = this.buildUrl(RENEC_ENDPOINTS.spa.sectors);
      console.log(`[SectorDriver] Navigating to: ${url}`);

      await this.page.goto(url, { waitUntil: "networkidle" });

      // Wait for Angular to render
      await this.page.waitForTimeout(2000);

      // Wait for sector content to appear - the page shows sector cards with paragraphs
      const loaded = await this.page
        .waitForSelector("main p, mat-card, .sector-card, table tbody tr", {
          timeout: 15000,
        })
        .then(() => true)
        .catch(() => false);

      if (!loaded) {
        console.warn("[SectorDriver] Sector content did not load");
        return items;
      }

      // The sectors page shows cards with images and paragraph titles
      // Structure: generic > generic > (img + paragraph with sector name)
      // First try to find all paragraph elements that contain sector names
      const sectorParagraphs = await this.page.$$("main p");
      console.log(
        `[SectorDriver] Found ${sectorParagraphs.length} paragraphs in main`,
      );

      // Filter to find sector name paragraphs (they're typically in ALL CAPS and longer than 10 chars)
      const sectorNames: string[] = [];
      for (const p of sectorParagraphs) {
        const text = await p.textContent();
        if (text) {
          const trimmed = text.trim();
          // Sector names are uppercase, exclude headers and short items
          if (
            trimmed.length > 5 &&
            trimmed === trimmed.toUpperCase() &&
            !trimmed.includes("SECTORES PRODUCTIVOS") &&
            !trimmed.includes("SCIAN") &&
            !trimmed.includes("ESTÁNDARES DE COMPETENCIA") &&
            !trimmed.includes("ESTÁNDARES DE MARCA") &&
            !trimmed.includes("¿QUÉ ES")
          ) {
            sectorNames.push(trimmed);
          }
        }
      }

      console.log(`[SectorDriver] Found ${sectorNames.length} sector names`);

      // Create sector items from the names
      for (let i = 0; i < sectorNames.length; i++) {
        const nombre = sectorNames[i];
        const sector: Record<string, unknown> = {
          sectorId: `SCIAN-${String(i + 1).padStart(2, "0")}`,
          nombre: cleanText(nombre),
          srcUrl: url,
          extractedAt: new Date().toISOString(),
        };

        sector.contentHash = computeContentHash(sector);

        if (this.validateSector(sector)) {
          items.push({ type: "sector", data: sector });
          this.updateStats("itemsExtracted");
        }
      }

      // If we found sectors, return early
      if (items.length > 0) {
        return items;
      }

      // Fallback: Try card format
      const cards = await this.page.$$("mat-card, .sector-card, .mat-mdc-card");

      if (cards.length > 0) {
        console.log(`[SectorDriver] Found ${cards.length} sector cards`);

        for (let i = 0; i < cards.length; i++) {
          const card = cards[i];
          try {
            const sectorData = await this.page.evaluate((el) => {
              const element = el as HTMLElement;
              const title =
                element.querySelector("mat-card-title, h2, h3, .title")
                  ?.textContent || "";
              const subtitle =
                element.querySelector("mat-card-subtitle, .subtitle, p")
                  ?.textContent || "";

              // Try to extract count from subtitle
              const countMatch = subtitle.match(/(\d+)\s*estándares?/i);
              const count = countMatch
                ? parseInt(countMatch[1], 10)
                : undefined;

              return {
                nombre: title.trim(),
                numEstandares: count,
                descripcion: subtitle.trim(),
              };
            }, card);

            if (sectorData.nombre) {
              const sector: Record<string, unknown> = {
                sectorId: `SCIAN-${i + 1}`,
                nombre: cleanText(sectorData.nombre),
                descripcion: sectorData.descripcion
                  ? cleanText(sectorData.descripcion)
                  : undefined,
                numEstandares: sectorData.numEstandares,
                srcUrl: url,
                extractedAt: new Date().toISOString(),
              };

              sector.contentHash = computeContentHash(sector);

              if (this.validateSector(sector)) {
                items.push({ type: "sector", data: sector });
                this.updateStats("itemsExtracted");
              }
            }
          } catch {
            continue;
          }
        }
      }

      // Pattern 2: Table rows
      if (items.length === 0) {
        const rows = await this.page.$$(
          "table tbody tr, mat-row, .mat-mdc-row, [role='row']",
        );

        console.log(`[SectorDriver] Found ${rows.length} table rows`);

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          try {
            const rowData = await this.page.evaluate((el) => {
              const element = el as HTMLElement;
              const cells = element.querySelectorAll(
                "td, mat-cell, .mat-mdc-cell, [role='cell'], [role='gridcell']",
              );
              const cellTexts: string[] = [];

              cells.forEach((cell) => {
                cellTexts.push(cell.textContent?.trim() || "");
              });

              return cellTexts;
            }, row);

            if (rowData.length > 0 && rowData[0]) {
              const sector: Record<string, unknown> = {
                sectorId: `SCIAN-${i + 1}`,
                nombre: cleanText(rowData[0]),
                numEstandares: rowData[1]
                  ? parseInt(rowData[1].replace(/\D/g, ""), 10) || undefined
                  : undefined,
                srcUrl: url,
                extractedAt: new Date().toISOString(),
              };

              sector.contentHash = computeContentHash(sector);

              if (this.validateSector(sector)) {
                items.push({ type: "sector", data: sector });
                this.updateStats("itemsExtracted");
              }
            }
          } catch {
            continue;
          }
        }
      }

      // Pattern 3: List items
      if (items.length === 0) {
        const listItems = await this.page.$$(
          "mat-list-item, .mat-list-item, .mat-mdc-list-item",
        );

        console.log(`[SectorDriver] Found ${listItems.length} list items`);

        for (let i = 0; i < listItems.length; i++) {
          const item = listItems[i];
          try {
            const text = await item.textContent();
            if (text) {
              const nombre = cleanText(text);
              if (nombre && nombre.length > 3) {
                const sector: Record<string, unknown> = {
                  sectorId: `SCIAN-${i + 1}`,
                  nombre,
                  srcUrl: url,
                  extractedAt: new Date().toISOString(),
                };

                sector.contentHash = computeContentHash(sector);

                if (this.validateSector(sector)) {
                  items.push({ type: "sector", data: sector });
                  this.updateStats("itemsExtracted");
                }
              }
            }
          } catch {
            continue;
          }
        }
      }
    } catch (error) {
      this.logError("harvestProductiveSectors", error as Error);
    }

    return items;
  }

  /**
   * Get the 20 known SCIAN productive sectors
   * This is a fallback if scraping fails
   */
  getKnownSectors(): ExtractedItem[] {
    const scianSectors = [
      "Agricultura, cría y explotación de animales, aprovechamiento forestal, pesca y caza",
      "Minería",
      "Generación, transmisión y distribución de energía eléctrica, suministro de agua y de gas por ductos al consumidor final",
      "Construcción",
      "Industrias manufactureras",
      "Comercio al por mayor",
      "Comercio al por menor",
      "Transportes, correos y almacenamiento",
      "Información en medios masivos",
      "Servicios financieros y de seguros",
      "Servicios inmobiliarios y de alquiler de bienes muebles e intangibles",
      "Servicios profesionales, científicos y técnicos",
      "Corporativos",
      "Servicios de apoyo a los negocios y manejo de desechos y servicios de remediación",
      "Servicios educativos",
      "Servicios de salud y de asistencia social",
      "Servicios de esparcimiento culturales y deportivos, y otros servicios recreativos",
      "Servicios de alojamiento temporal y de preparación de alimentos y bebidas",
      "Otros servicios excepto actividades gubernamentales",
      "Actividades legislativas, gubernamentales, de impartición de justicia y de organismos internacionales y extraterritoriales",
    ];

    return scianSectors.map((nombre, i) => {
      const sector: Record<string, unknown> = {
        sectorId: `SCIAN-${i + 1}`,
        nombre,
        srcUrl: "https://conocer.gob.mx/conocer/#/sectoresProductivos",
        extractedAt: new Date().toISOString(),
      };
      sector.contentHash = computeContentHash(sector);
      return { type: "sector", data: sector };
    });
  }

  async parse(html: string, url: string): Promise<ExtractedItem[]> {
    const items: ExtractedItem[] = [];

    try {
      if (url.includes("SECTORES")) {
        const sectors = await this.parseSectorListing();
        items.push(...sectors);
      } else if (url.includes("COMITES") && !url.includes("SECTOR_COMITES")) {
        const comites = await this.parseComiteListing();
        items.push(...comites);
      } else if (url.includes("SECTOR_COMITES")) {
        const sectorId = this.extractIdFromUrl(url);
        if (sectorId) {
          const comites = await this.parseSectorComites(sectorId);
          items.push(...comites);
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
    try {
      if (url.includes("SECTOR&id=")) {
        return this.parseSectorDetail(url, meta);
      } else if (url.includes("COMITE&id=")) {
        return this.parseComiteDetail(url, meta);
      }
    } catch (error) {
      this.logError(url, error as Error);
    }

    return null;
  }

  validateItem(item: Record<string, unknown>): boolean {
    const type = item.type as string;

    if (type === "sector") {
      return this.validateSector(item);
    } else if (type === "comite") {
      return this.validateComite(item);
    } else if (type === "ec_sector_relation") {
      return this.validateRelation(item);
    }

    return true;
  }

  // ============================================
  // Sector Parsing
  // ============================================

  private async parseSectorListing(): Promise<ExtractedItem[]> {
    const items: ExtractedItem[] = [];

    if (!this.page) return items;

    // Try table format first
    const tableRows = await this.page.$$(
      "table.table tbody tr, table tbody tr",
    );

    if (tableRows.length > 0) {
      for (const row of tableRows) {
        try {
          const sectorId = await this.extractIdFromRow(row);
          const nombre = await row.$eval(
            "td:first-child",
            (el) => el.textContent?.trim() || "",
          );
          const numComitesText = await row
            .$eval("td:nth-child(2)", (el) => el.textContent?.trim() || "")
            .catch(() => "");
          const numEstandaresText = await row
            .$eval("td:nth-child(3)", (el) => el.textContent?.trim() || "")
            .catch(() => "");

          if (sectorId && nombre) {
            const sectorData: Record<string, unknown> = {
              sectorId,
              nombre: cleanText(nombre),
              numComites: this.extractNumber(numComitesText),
              numEstandares: this.extractNumber(numEstandaresText),
              srcUrl: this.page!.url(),
              extractedAt: new Date().toISOString(),
            };

            // Queue detail page request
            this.pendingDetailRequests.push({
              type: "sector",
              id: sectorId,
              basicData: sectorData,
            });
          }
        } catch {
          continue;
        }
      }
    } else {
      // Try card format
      const cards = await this.page.$$('div.sector-card, div[class*="sector"]');

      for (const card of cards) {
        try {
          const sectorId =
            (await card.getAttribute("data-sector-id")) ||
            (await this.extractIdFromLink(card));

          if (sectorId) {
            const nombre = await card
              .$eval(
                "h3, .title, .nombre",
                (el) => el.textContent?.trim() || "",
              )
              .catch(() => "");

            const sectorData: Record<string, unknown> = {
              sectorId,
              nombre: cleanText(nombre),
              srcUrl: this.page!.url(),
              extractedAt: new Date().toISOString(),
            };

            this.pendingDetailRequests.push({
              type: "sector",
              id: sectorId,
              basicData: sectorData,
            });
          }
        } catch {
          continue;
        }
      }
    }

    // Process detail pages
    for (const request of this.pendingDetailRequests.filter(
      (r) => r.type === "sector",
    )) {
      try {
        const detailUrl = this.buildUrl(
          LEGACY_SECTOR_ENDPOINTS.sectorDetail + request.id,
        );
        await this.fetchPage(detailUrl);
        const detail = await this.parseSectorDetail(detailUrl, {
          basicData: request.basicData,
        });

        if (detail) {
          items.push(detail);
        }

        // Also fetch committees for this sector
        const comitesUrl = this.buildUrl(
          LEGACY_SECTOR_ENDPOINTS.sectorComites + request.id,
        );
        try {
          await this.fetchPage(comitesUrl);
          const comiteItems = await this.parseSectorComites(request.id);
          items.push(...comiteItems);
        } catch {
          // Sector might not have committees
        }
      } catch (error) {
        this.logError(`sector/${request.id}`, error as Error);

        // Yield basic data if detail fails
        if (this.validateSector(request.basicData)) {
          const data: Record<string, unknown> = {
            ...request.basicData,
            contentHash: computeContentHash(request.basicData),
          };

          items.push({ type: "sector", data });
          this.updateStats("itemsExtracted");
        }
      }
    }

    // Clear processed requests
    this.pendingDetailRequests = this.pendingDetailRequests.filter(
      (r) => r.type !== "sector",
    );

    return items;
  }

  private async parseSectorDetail(
    url: string,
    meta?: Record<string, unknown>,
  ): Promise<ExtractedItem | null> {
    if (!this.page) return null;

    const basicData = (meta?.basicData as Record<string, unknown>) || {};

    const sectorData: Record<string, unknown> = {
      sectorId: basicData.sectorId || this.extractIdFromUrl(url) || "",
      nombre: (await this.extractNombre()) || basicData.nombre || "",
      descripcion: await this.extractDescripcion(),
      numComites: (await this.extractNumComites()) ?? basicData.numComites,
      numEstandares:
        (await this.extractNumEstandares()) ?? basicData.numEstandares,
      fechaCreacion: await this.extractFecha("Creación"),
      srcUrl: url,
      extractedAt: new Date().toISOString(),
      contentHash: "",
    };

    // Compute content hash
    sectorData.contentHash = computeContentHash(sectorData);

    if (this.validateSector(sectorData)) {
      this.updateStats("itemsExtracted");
      return { type: "sector", data: sectorData };
    }

    return null;
  }

  // ============================================
  // Comité Parsing
  // ============================================

  private async parseComiteListing(): Promise<ExtractedItem[]> {
    const items: ExtractedItem[] = [];

    if (!this.page) return items;

    // Try table format
    const tableRows = await this.page.$$(
      "table.table tbody tr, table tbody tr",
    );

    if (tableRows.length > 0) {
      for (const row of tableRows) {
        try {
          const comiteId = await this.extractIdFromRow(row);
          const nombre = await row.$eval(
            "td:first-child",
            (el) => el.textContent?.trim() || "",
          );
          // sectorNombre extracted but not used in basic data - may be needed for detail lookup
          const _sectorNombre = await row
            .$eval("td:nth-child(2)", (el) => el.textContent?.trim() || "")
            .catch(() => "");
          void _sectorNombre;
          const numEstandaresText = await row
            .$eval("td:nth-child(3)", (el) => el.textContent?.trim() || "")
            .catch(() => "");

          if (comiteId && nombre) {
            const comiteData: Record<string, unknown> = {
              comiteId,
              nombre: cleanText(nombre),
              numEstandares: this.extractNumber(numEstandaresText),
              srcUrl: this.page!.url(),
              extractedAt: new Date().toISOString(),
            };

            this.pendingDetailRequests.push({
              type: "comite",
              id: comiteId,
              basicData: comiteData,
            });
          }
        } catch {
          continue;
        }
      }
    } else {
      // Try alternative format
      const comiteItems = await this.page.$$(
        'div.comite-item, div[class*="comite"]',
      );

      for (const item of comiteItems) {
        try {
          const comiteId =
            (await item.getAttribute("data-comite-id")) ||
            (await this.extractIdFromLink(item));

          if (comiteId) {
            const nombre = await item
              .$eval(
                ".nombre, .title, span",
                (el) => el.textContent?.trim() || "",
              )
              .catch(() => "");

            const comiteData: Record<string, unknown> = {
              comiteId,
              nombre: cleanText(nombre),
              srcUrl: this.page!.url(),
              extractedAt: new Date().toISOString(),
            };

            this.pendingDetailRequests.push({
              type: "comite",
              id: comiteId,
              basicData: comiteData,
            });
          }
        } catch {
          continue;
        }
      }
    }

    // Process detail pages
    for (const request of this.pendingDetailRequests.filter(
      (r) => r.type === "comite",
    )) {
      try {
        const detailUrl = this.buildUrl(
          LEGACY_SECTOR_ENDPOINTS.comiteDetail + request.id,
        );
        await this.fetchPage(detailUrl);
        const detail = await this.parseComiteDetail(detailUrl, {
          basicData: request.basicData,
        });

        if (detail) {
          items.push(detail);

          // Extract and yield EC-Sector relations
          const comiteData = detail.data;
          const sectorId = comiteData.sectorId as string | undefined;
          const estandares = comiteData.estandares as string[] | undefined;

          if (sectorId && estandares) {
            for (const ecClave of estandares) {
              const relation: Record<string, unknown> = {
                ecClave,
                sectorId,
                comiteId: comiteData.comiteId,
                extractedAt: new Date().toISOString(),
              };

              if (this.validateRelation(relation)) {
                items.push({ type: "ec_sector_relation", data: relation });
              }
            }
          }
        }
      } catch (error) {
        this.logError(`comite/${request.id}`, error as Error);

        // Yield basic data if detail fails
        if (this.validateComite(request.basicData)) {
          const data: Record<string, unknown> = {
            ...request.basicData,
            contentHash: computeContentHash(request.basicData),
          };

          items.push({ type: "comite", data });
          this.updateStats("itemsExtracted");
        }
      }
    }

    // Clear processed requests
    this.pendingDetailRequests = this.pendingDetailRequests.filter(
      (r) => r.type !== "comite",
    );

    return items;
  }

  private async parseSectorComites(sectorId: string): Promise<ExtractedItem[]> {
    const items: ExtractedItem[] = [];

    if (!this.page) return items;

    // Extract committees belonging to this sector
    const tableRows = await this.page.$$("table tbody tr");

    for (const row of tableRows) {
      try {
        const comiteId = await this.extractIdFromRow(row);
        const nombre = await row.$eval(
          "td:first-child",
          (el) => el.textContent?.trim() || "",
        );

        if (comiteId && nombre) {
          const comiteData: Record<string, unknown> = {
            comiteId,
            nombre: cleanText(nombre),
            sectorId, // Associate with parent sector
            srcUrl: this.page!.url(),
            extractedAt: new Date().toISOString(),
          };

          // Fetch detail page
          try {
            const detailUrl = this.buildUrl(
              LEGACY_SECTOR_ENDPOINTS.comiteDetail + comiteId,
            );
            await this.fetchPage(detailUrl);
            const detail = await this.parseComiteDetail(detailUrl, {
              basicData: comiteData,
            });

            if (detail) {
              items.push(detail);

              // Extract EC-Sector relations
              const fullData = detail.data;
              const estandares = fullData.estandares as string[] | undefined;

              if (estandares) {
                for (const ecClave of estandares) {
                  items.push({
                    type: "ec_sector_relation",
                    data: {
                      ecClave,
                      sectorId,
                      comiteId,
                      extractedAt: new Date().toISOString(),
                    },
                  });
                }
              }
            }
          } catch {
            // Yield basic data if detail fails
            if (this.validateComite(comiteData)) {
              items.push({
                type: "comite",
                data: {
                  ...comiteData,
                  contentHash: computeContentHash(comiteData),
                },
              });
              this.updateStats("itemsExtracted");
            }
          }
        }
      } catch {
        continue;
      }
    }

    return items;
  }

  private async parseComiteDetail(
    url: string,
    meta?: Record<string, unknown>,
  ): Promise<ExtractedItem | null> {
    if (!this.page) return null;

    const basicData = (meta?.basicData as Record<string, unknown>) || {};

    const comiteData: Record<string, unknown> = {
      comiteId: basicData.comiteId || this.extractIdFromUrl(url) || "",
      nombre: (await this.extractNombre()) || basicData.nombre || "",
      sectorId: basicData.sectorId || (await this.extractSectorId()),
      descripcion: await this.extractDescripcion(),
      objetivo: await this.extractObjetivo(),
      numEstandares:
        (await this.extractNumEstandares()) ?? basicData.numEstandares,
      fechaCreacion: await this.extractFecha("Creación"),
      fechaActualizacion: await this.extractFecha("Actualización"),
      contacto: await this.extractContacto(),
      estandares: await this.extractECStandards(),
      srcUrl: url,
      extractedAt: new Date().toISOString(),
      contentHash: "",
    };

    // Compute content hash
    comiteData.contentHash = computeContentHash(comiteData);

    if (this.validateComite(comiteData)) {
      this.updateStats("itemsExtracted");
      return { type: "comite", data: comiteData };
    }

    return null;
  }

  // ============================================
  // Extraction Helpers
  // ============================================

  private async extractIdFromRow(row: any): Promise<string | null> {
    // Try link href first
    try {
      const link = await row.$('a[href*="id="]');
      if (link) {
        const href = await link.getAttribute("href");
        if (href) {
          return this.extractIdFromUrl(href);
        }
      }
    } catch {
      // Continue to next method
    }

    // Try data attribute
    try {
      const dataId = await row.getAttribute("data-id");
      if (dataId) {
        return dataId;
      }
    } catch {
      // Continue
    }

    return null;
  }

  private async extractIdFromLink(element: any): Promise<string | null> {
    try {
      const link = await element.$('a[href*="id="]');
      if (link) {
        const href = await link.getAttribute("href");
        if (href) {
          return this.extractIdFromUrl(href);
        }
      }
    } catch {
      // Return null
    }

    return null;
  }

  private extractIdFromUrl(url: string): string | null {
    const match = url.match(/id=([^&]+)/);
    return match ? match[1] : null;
  }

  private async extractNombre(): Promise<string> {
    const selectors = [
      "h1",
      'td:has-text("Nombre") + td',
      "div.entity-name",
      ".nombre",
    ];

    for (const selector of selectors) {
      const text = await this.extractText(selector);
      if (text) {
        return cleanText(text);
      }
    }

    return "";
  }

  private async extractDescripcion(): Promise<string | undefined> {
    const selectors = [
      "div.descripcion",
      'td:has-text("Descripción") + td',
      "p.description",
    ];

    for (const selector of selectors) {
      const texts = await this.extractAllText(selector);
      if (texts.length > 0) {
        return cleanText(texts.join(" "));
      }
    }

    return undefined;
  }

  private async extractObjetivo(): Promise<string | undefined> {
    const text = await this.extractText('td:has-text("Objetivo") + td');
    return text ? cleanText(text) : undefined;
  }

  private async extractNumComites(): Promise<number | undefined> {
    const text = await this.extractText('td:has-text("Comités") + td');
    return this.extractNumber(text);
  }

  private async extractNumEstandares(): Promise<number | undefined> {
    const text = await this.extractText('td:has-text("Estándares") + td');
    return this.extractNumber(text);
  }

  private async extractSectorId(): Promise<string | undefined> {
    if (!this.page) return undefined;

    // Look for sector link
    const sectorLink = await this.page.$('a[href*="SECTOR"][href*="id="]');
    if (sectorLink) {
      const href = await sectorLink.getAttribute("href");
      if (href) {
        return this.extractIdFromUrl(href) || undefined;
      }
    }

    // Try text reference
    const sectorText = await this.extractText('td:has-text("Sector") + td');
    if (sectorText) {
      const match = sectorText.match(/\b(\d+)\b/);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }

  private async extractFecha(tipo: string): Promise<string | undefined> {
    const text = await this.extractText(`td:has-text("${tipo}") + td`);
    return text ? this.parseDate(text) : undefined;
  }

  private async extractContacto(): Promise<
    { email?: string; phone?: string } | undefined
  > {
    const contacto: { email?: string; phone?: string } = {};

    const email = await this.extractText('td:has-text("Correo") + td');
    if (email) {
      contacto.email = cleanText(email).toLowerCase();
    }

    const phone = await this.extractText('td:has-text("Teléfono") + td');
    if (phone) {
      contacto.phone = cleanText(phone);
    }

    return Object.keys(contacto).length > 0 ? contacto : undefined;
  }

  private async extractECStandards(): Promise<string[] | undefined> {
    if (!this.page) return undefined;

    const standards: string[] = [];

    const selectors = [
      'div.estandares a[href*="EC"]',
      "ul.ec-list li",
      'td:has-text("Estándares") + td a',
    ];

    for (const selector of selectors) {
      const items = await this.extractAllText(selector);
      if (items.length > 0) {
        for (const item of items) {
          // Extract EC codes using regex
          const matches = item.match(/EC\d{4}/g);
          if (matches) {
            standards.push(...matches);
          }
        }
        break;
      }
    }

    // Remove duplicates and validate
    const uniqueStandards = [...new Set(standards)].filter((ec) =>
      /^EC\d{4}$/.test(ec),
    );

    return uniqueStandards.length > 0 ? uniqueStandards : undefined;
  }

  private extractNumber(text: string | undefined): number | undefined {
    if (!text) return undefined;

    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : undefined;
  }

  private parseDate(dateText: string): string | undefined {
    const text = dateText.trim();

    // DD/MM/YYYY format
    let match = text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }

    // YYYY-MM-DD format
    match = text.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return match[0];
    }

    // Year only
    match = text.match(/\b(\d{4})\b/);
    if (match) {
      return `${match[1]}-01-01`;
    }

    return undefined;
  }

  // ============================================
  // Validation
  // ============================================

  private validateSector(item: Record<string, unknown>): boolean {
    const required = ["sectorId", "nombre"];

    for (const field of required) {
      if (!item[field]) {
        console.warn(`Missing required sector field: ${field}`);
        return false;
      }
    }

    return true;
  }

  private validateComite(item: Record<string, unknown>): boolean {
    const required = ["comiteId", "nombre"];

    for (const field of required) {
      if (!item[field]) {
        console.warn(`Missing required committee field: ${field}`);
        return false;
      }
    }

    return true;
  }

  private validateRelation(item: Record<string, unknown>): boolean {
    const ecClave = item.ecClave as string;
    const sectorId = item.sectorId;

    if (!ecClave || !sectorId) {
      return false;
    }

    return /^EC\d{4}$/.test(ecClave);
  }
}
