/**
 * Certifier Driver (ECE/OC)
 * Extracts Entidades de Certificación y Evaluación and Organismos Certificadores from RENEC
 */

import { BaseDriver, type ExtractedItem } from "./base.driver";
import {
  type Certifier,
  type CertifierType,
  type ECEAccreditation,
  type RenecClientConfig,
  RENEC_ENDPOINTS,
} from "../types";
import {
  cleanText,
  isValidECCode,
  normalizePhone,
  normalizeEstadoInegi,
  parseDate,
  generateRunId,
} from "../utils/helpers";

export class CertifierDriver extends BaseDriver {
  private runId: string;

  constructor(config: Partial<RenecClientConfig> = {}) {
    super(config);
    this.runId = generateRunId();
  }

  getStartUrls(): string[] {
    return [
      this.buildUrl(RENEC_ENDPOINTS.legacy.certifier.eceList),
      this.buildUrl(RENEC_ENDPOINTS.legacy.certifier.ocList),
    ];
  }

  private determineCertType(url: string): CertifierType {
    if (url.includes("comp=ECE")) return "ECE";
    return "OC";
  }

  async parse(html: string, url: string): Promise<ExtractedItem[]> {
    const items: ExtractedItem[] = [];
    const certType = this.determineCertType(url);

    if (!this.page) return items;

    try {
      // Try table format
      const rows = await this.page.$$("table.table tr:not(:first-child)");

      if (rows.length > 0) {
        for (const row of rows) {
          const certData = await this.extractCertFromTableRow(row, certType);

          if (certData?.certId) {
            // Fetch detail page
            const detailUrl = this.buildUrl(
              `${RENEC_ENDPOINTS.legacy.certifier.detail}${certData.certId}`,
            );

            try {
              const detailHtml = await this.fetchPage(detailUrl);
              const detailItem = await this.parseDetail(detailHtml, detailUrl, {
                certData,
                certType,
              });

              if (detailItem) {
                items.push(detailItem);

                // Also yield EC relationships
                const cert = detailItem.data as unknown as Certifier;
                if (cert.estandaresAcreditados?.length) {
                  for (const ecCode of cert.estandaresAcreditados) {
                    items.push({
                      type: "ece_ec_relation",
                      data: {
                        certId: cert.certId,
                        ecClave: ecCode,
                        acreditadoDesde: cert.fechaAcreditacion,
                        runId: this.runId,
                        extractedAt: new Date().toISOString(),
                      } as unknown as Record<string, unknown>,
                    });
                  }
                }
              }
            } catch (error) {
              this.logError(detailUrl, error as Error);
            }
          }
        }
      } else {
        // Try card format
        const cards = await this.page.$$("div.certificador-card, div.oec-item");

        for (const card of cards) {
          const certData = await this.extractCertFromCard(card, certType);
          if (certData) {
            items.push({
              type: "certifier",
              data: certData,
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

    const certData = (meta?.certData as Partial<Certifier>) || {};
    const certType = (meta?.certType as CertifierType) || "ECE";

    try {
      const estado = (await this.extractEstado()) || certData.estado;

      const detailData: Certifier = {
        certId: certData.certId || "",
        tipo: certType,
        nombreLegal:
          (await this.extractNombreLegal()) || certData.nombreLegal || "",
        siglas: (await this.extractSiglas()) || certData.siglas,
        estatus: (await this.extractEstatus()) || certData.estatus || "ACTIVO",
        domicilioTexto: await this.extractDomicilio(),
        estado,
        estadoInegi: estado ? normalizeEstadoInegi(estado) : undefined,
        municipio: await this.extractMunicipio(),
        cp: await this.extractCP(),
        telefono: await this.extractTelefono(),
        correo: await this.extractCorreo(),
        sitioWeb: await this.extractSitioWeb(),
        representanteLegal: await this.extractRepresentante(),
        fechaAcreditacion: await this.extractFechaAcreditacion(),
        estandaresAcreditados: await this.extractEstandaresAcreditados(),
        srcUrl: url,
        extractedAt: new Date().toISOString(),
        rowHash: "", // Will be computed
      };

      // Merge with listing data
      Object.assign(detailData, certData);

      // Clean and compute hash
      const cleanedData = this.cleanCertData(detailData);
      cleanedData.rowHash = this.computeHash(
        cleanedData as unknown as Record<string, unknown>,
      );

      if (
        this.validateItem(cleanedData as unknown as Record<string, unknown>)
      ) {
        this.updateStats("itemsExtracted");
        return {
          type: "certifier",
          data: cleanedData as unknown as Record<string, unknown>,
        };
      }
    } catch (error) {
      this.logError(url, error as Error);
    }

    return null;
  }

  private async extractCertFromTableRow(
    row: unknown,
    certType: CertifierType,
  ): Promise<Partial<Certifier> | null> {
    try {
      // Note: evaluate runs in browser context where DOM types exist
      const data = await this.page!.evaluate((el) => {
        // Look for ID in link or data attribute
        const element = el as HTMLElement;
        const link = element.querySelector('a[href*="id="]');
        let certId = "";

        if (link) {
          const href = link.getAttribute("href") || "";
          const match = href.match(/id=(\w+)/);
          if (match) certId = match[1];
        }

        if (!certId) {
          certId = element.getAttribute("data-id") || "";
        }

        const cells = element.querySelectorAll("td");
        return {
          certId,
          nombreLegal: cells[0]?.textContent?.trim() || "",
          siglas: cells[1]?.textContent?.trim() || "",
          estado: cells[2]?.textContent?.trim() || "",
          estatus: cells[3]?.textContent?.trim() || "",
        };
      }, row);

      if (data.certId || data.nombreLegal) {
        return {
          certId: data.certId,
          tipo: certType,
          nombreLegal: cleanText(data.nombreLegal),
          siglas: cleanText(data.siglas) || undefined,
          estado: cleanText(data.estado).toUpperCase() || undefined,
          estatus: cleanText(data.estatus) || "ACTIVO",
        };
      }
    } catch {
      // Ignore individual row errors
    }

    return null;
  }

  private async extractCertFromCard(
    card: unknown,
    certType: CertifierType,
  ): Promise<Partial<Certifier> | null> {
    try {
      // Note: evaluate runs in browser context where DOM types exist
      const data = await this.page!.evaluate((el) => {
        const element = el as HTMLElement;
        return {
          certId: element.getAttribute("data-cert-id") || "",
          nombreLegal:
            element.querySelector(".cert-name, h3")?.textContent?.trim() || "",
          siglas:
            element.querySelector(".cert-siglas")?.textContent?.trim() || "",
          estado:
            element.querySelector(".cert-estado")?.textContent?.trim() || "",
          estatus:
            element.querySelector(".cert-status")?.textContent?.trim() || "",
        };
      }, card);

      if (data.certId || data.nombreLegal) {
        return {
          certId: data.certId,
          tipo: certType,
          nombreLegal: cleanText(data.nombreLegal),
          siglas: cleanText(data.siglas) || undefined,
          estado: cleanText(data.estado).toUpperCase() || undefined,
          estatus: cleanText(data.estatus) || "ACTIVO",
        };
      }
    } catch {
      // Ignore
    }

    return null;
  }

  private async extractNombreLegal(): Promise<string> {
    const selectors = [
      'td:has-text("Nombre") + td',
      "h1.cert-title",
      "div.nombre-legal",
    ];

    for (const selector of selectors) {
      const text = await this.extractText(selector);
      if (text) return text;
    }

    return "";
  }

  private async extractSiglas(): Promise<string | undefined> {
    const text = await this.extractText('td:has-text("Siglas") + td');
    return text || undefined;
  }

  private async extractEstatus(): Promise<string> {
    let text = await this.extractText('td:has-text("Estatus") + td');
    if (!text) {
      text = await this.extractText("span.status");
    }
    return cleanText(text) || "ACTIVO";
  }

  private async extractDomicilio(): Promise<string | undefined> {
    const selectors = ['td:has-text("Domicilio") + td', "div.domicilio"];

    for (const selector of selectors) {
      const text = await this.extractText(selector);
      if (text) return text;
    }

    return undefined;
  }

  private async extractEstado(): Promise<string | undefined> {
    const text = await this.extractText('td:has-text("Estado") + td');
    return text ? cleanText(text).toUpperCase() : undefined;
  }

  private async extractMunicipio(): Promise<string | undefined> {
    const text = await this.extractText('td:has-text("Municipio") + td');
    return text || undefined;
  }

  private async extractCP(): Promise<string | undefined> {
    let text = await this.extractText('td:has-text("C.P.") + td');

    if (!text) {
      // Try to extract from address
      const domicilio = await this.extractDomicilio();
      if (domicilio) {
        const match = domicilio.match(/C\.?P\.?\s*(\d{5})/i);
        if (match) return match[1];
      }
    }

    // Clean to just digits
    return text ? text.replace(/\D/g, "").slice(0, 5) : undefined;
  }

  private async extractTelefono(): Promise<string | undefined> {
    const text = await this.extractText('td:has-text("Teléfono") + td');
    return text ? normalizePhone(text) : undefined;
  }

  private async extractCorreo(): Promise<string | undefined> {
    let text = await this.extractText('td:has-text("Correo") + td');

    if (!text) {
      text = await this.extractText('a[href^="mailto:"]');
    }

    return text ? cleanText(text).toLowerCase() : undefined;
  }

  private async extractSitioWeb(): Promise<string | undefined> {
    let href = await this.extractAttribute(
      'td:has-text("Sitio") + td a',
      "href",
    );

    if (!href) {
      href = await this.extractText('td:has-text("Sitio") + td');
    }

    if (href && !href.startsWith("http")) {
      href = `http://${href}`;
    }

    return href || undefined;
  }

  private async extractRepresentante(): Promise<string | undefined> {
    const text = await this.extractText('td:has-text("Representante") + td');
    return text || undefined;
  }

  private async extractFechaAcreditacion(): Promise<string | undefined> {
    const text = await this.extractText('td:has-text("Acreditación") + td');
    return text ? (parseDate(text) ?? undefined) : undefined;
  }

  private async extractEstandaresAcreditados(): Promise<string[]> {
    const ecCodes: string[] = [];

    // Try modal data in scripts
    if (this.page) {
      try {
        const modalData = await this.page.evaluate(() => {
          const scripts = document.querySelectorAll("script");
          for (const script of scripts) {
            const text = script.textContent || "";
            const match = text.match(/modalData\s*=\s*(\{.*?\});/s);
            if (match) {
              try {
                return JSON.parse(match[1]);
              } catch {
                return null;
              }
            }
          }
          return null;
        });

        if (modalData?.standards) {
          for (const std of modalData.standards) {
            if (std.code && isValidECCode(std.code)) {
              ecCodes.push(std.code);
            }
          }
        }
      } catch {
        // Ignore script parsing errors
      }
    }

    // Try HTML modal content
    if (ecCodes.length === 0) {
      const codes = await this.extractAllText(
        "div.modal-estandares span.ec-code",
      );
      for (const code of codes) {
        if (isValidECCode(code.trim())) {
          ecCodes.push(code.trim());
        }
      }
    }

    // Deduplicate
    return [...new Set(ecCodes)];
  }

  private cleanCertData(data: Certifier): Certifier {
    const cleaned = { ...data };

    // Normalize type
    if (cleaned.tipo) {
      cleaned.tipo = cleaned.tipo.toUpperCase() as CertifierType;
    }

    // Deduplicate EC codes
    if (cleaned.estandaresAcreditados) {
      cleaned.estandaresAcreditados = [
        ...new Set(cleaned.estandaresAcreditados),
      ];
    }

    return cleaned;
  }

  validateItem(item: Record<string, unknown>): boolean {
    // Check if it's a relation
    if (item.type === "ece_ec_relation") {
      return Boolean(item.certId && item.ecClave);
    }

    // Main certifier validation
    const required = ["certId", "tipo", "nombreLegal", "srcUrl"];

    for (const field of required) {
      if (!item[field]) {
        console.warn(`[CertifierDriver] Missing required field: ${field}`);
        return false;
      }
    }

    const tipo = item.tipo as string;
    if (!["ECE", "OC"].includes(tipo)) {
      console.warn(`[CertifierDriver] Invalid certifier type: ${tipo}`);
      return false;
    }

    return true;
  }
}
