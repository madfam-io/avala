/**
 * Evaluation Center Driver
 * Extracts Centros de Evaluación from RENEC
 */

import { BaseDriver, type ExtractedItem } from './base.driver';
import {
  type EvaluationCenter,
  type CenterECOffering,
  type RenecClientConfig,
  RENEC_ENDPOINTS,
} from '../types';
import {
  cleanText,
  isValidECCode,
  normalizePhone,
  normalizeEstadoInegi,
  generateRunId,
} from '../utils/helpers';

export class CenterDriver extends BaseDriver {
  private runId: string;

  constructor(config: Partial<RenecClientConfig> = {}) {
    super(config);
    this.runId = generateRunId();
  }

  getStartUrls(): string[] {
    return [this.buildUrl(RENEC_ENDPOINTS.center.list)];
  }

  async parse(html: string, url: string): Promise<ExtractedItem[]> {
    const items: ExtractedItem[] = [];

    if (!this.page) return items;

    try {
      // Try table format
      const rows = await this.page.$$('table.table tr:not(:first-child)');

      if (rows.length > 0) {
        for (const row of rows) {
          const centerData = await this.extractCenterFromTableRow(row);

          if (centerData?.centroId) {
            // Fetch detail page
            const detailUrl = this.buildUrl(
              `${RENEC_ENDPOINTS.center.detail}${centerData.centroId}`
            );

            try {
              const detailHtml = await this.fetchPage(detailUrl);
              const detailItem = await this.parseDetail(detailHtml, detailUrl, {
                centerData,
              });

              if (detailItem) {
                items.push(detailItem);

                // Also yield EC offerings
                const center = detailItem.data as EvaluationCenter;
                if (center.estandaresOfrecidos?.length) {
                  for (const ecCode of center.estandaresOfrecidos) {
                    items.push({
                      type: 'center_ec_offering',
                      data: {
                        centroId: center.centroId,
                        ecClave: ecCode,
                        runId: this.runId,
                        extractedAt: new Date().toISOString(),
                      } as CenterECOffering,
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
        const cards = await this.page.$$('div.centro-card, div.ce-item');

        for (const card of cards) {
          const centerData = await this.extractCenterFromCard(card);
          if (centerData) {
            items.push({
              type: 'evaluation_center',
              data: centerData,
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
    meta?: Record<string, unknown>
  ): Promise<ExtractedItem | null> {
    if (!this.page) return null;

    const centerData = (meta?.centerData as Partial<EvaluationCenter>) || {};

    try {
      const estado = await this.extractEstado() || centerData.estado;

      const detailData: EvaluationCenter = {
        centroId: centerData.centroId || '',
        nombre: await this.extractNombre() || centerData.nombre || '',
        certId: await this.extractCertId() || centerData.certId,
        estado,
        estadoInegi: estado ? normalizeEstadoInegi(estado) : undefined,
        municipio: await this.extractMunicipio(),
        direccion: await this.extractDireccion(),
        cp: await this.extractCP(),
        telefono: await this.extractTelefono(),
        correo: await this.extractCorreo(),
        estandaresOfrecidos: await this.extractEstandaresOfrecidos(),
        srcUrl: url,
        extractedAt: new Date().toISOString(),
      };

      // Merge with listing data
      Object.assign(detailData, centerData);

      if (this.validateItem(detailData as Record<string, unknown>)) {
        this.updateStats('itemsExtracted');
        return {
          type: 'evaluation_center',
          data: detailData,
        };
      }
    } catch (error) {
      this.logError(url, error as Error);
    }

    return null;
  }

  private async extractCenterFromTableRow(
    row: unknown
  ): Promise<Partial<EvaluationCenter> | null> {
    try {
      const data = await this.page!.evaluate((el: Element) => {
        // Look for ID in link or data attribute
        const link = el.querySelector('a[href*="id="]');
        let centroId = '';

        if (link) {
          const href = link.getAttribute('href') || '';
          const match = href.match(/id=(\w+)/);
          if (match) centroId = match[1];
        }

        if (!centroId) {
          centroId = el.getAttribute('data-id') || '';
        }

        const cells = el.querySelectorAll('td');
        return {
          centroId,
          nombre: cells[0]?.textContent?.trim() || '',
          certId: cells[1]?.textContent?.trim() || '', // Parent certifier
          estado: cells[2]?.textContent?.trim() || '',
        };
      }, row as Element);

      if (data.centroId || data.nombre) {
        return {
          centroId: data.centroId,
          nombre: cleanText(data.nombre),
          certId: cleanText(data.certId) || undefined,
          estado: cleanText(data.estado).toUpperCase() || undefined,
        };
      }
    } catch {
      // Ignore individual row errors
    }

    return null;
  }

  private async extractCenterFromCard(
    card: unknown
  ): Promise<Partial<EvaluationCenter> | null> {
    try {
      const data = await this.page!.evaluate((el: Element) => {
        return {
          centroId: el.getAttribute('data-centro-id') || '',
          nombre: el.querySelector('.centro-name, h3')?.textContent?.trim() || '',
          certId: el.querySelector('.oec-parent')?.textContent?.trim() || '',
          estado: el.querySelector('.centro-estado')?.textContent?.trim() || '',
        };
      }, card as Element);

      if (data.centroId || data.nombre) {
        return {
          centroId: data.centroId,
          nombre: cleanText(data.nombre),
          certId: cleanText(data.certId) || undefined,
          estado: cleanText(data.estado).toUpperCase() || undefined,
        };
      }
    } catch {
      // Ignore
    }

    return null;
  }

  private async extractNombre(): Promise<string> {
    const selectors = [
      'td:has-text("Nombre") + td',
      'h1.centro-title',
      'div.nombre-centro',
    ];

    for (const selector of selectors) {
      const text = await this.extractText(selector);
      if (text) return text;
    }

    return '';
  }

  private async extractCertId(): Promise<string | undefined> {
    // Look for parent certifier reference
    const text = await this.extractText('td:has-text("Certificador") + td');

    if (text) {
      // Try to extract OC code
      const match = text.match(/OC\d{3,4}/);
      if (match) return match[0];
    }

    // Try link
    const href = await this.extractAttribute('a[href*="cert="]', 'href');
    if (href) {
      const match = href.match(/cert=(\w+)/);
      if (match) return match[1];
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

  private async extractDireccion(): Promise<string | undefined> {
    const selectors = [
      'td:has-text("Dirección") + td',
      'td:has-text("Domicilio") + td',
      'div.direccion',
    ];

    for (const selector of selectors) {
      const text = await this.extractText(selector);
      if (text) return text;
    }

    return undefined;
  }

  private async extractCP(): Promise<string | undefined> {
    let text = await this.extractText('td:has-text("C.P.") + td');

    if (!text) {
      const direccion = await this.extractDireccion();
      if (direccion) {
        const match = direccion.match(/C\.?P\.?\s*(\d{5})/i);
        if (match) return match[1];
      }
    }

    return text ? text.replace(/\D/g, '').slice(0, 5) : undefined;
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

  private async extractEstandaresOfrecidos(): Promise<string[]> {
    const ecCodes: string[] = [];

    // Try list of EC codes
    const codes = await this.extractAllText(
      'div.estandares-ofrecidos li, ul.ec-list li'
    );

    for (const code of codes) {
      const match = code.match(/EC\d{4}/);
      if (match && isValidECCode(match[0])) {
        ecCodes.push(match[0]);
      }
    }

    // Try modal or expanded content
    if (ecCodes.length === 0 && this.page) {
      try {
        const modalCodes = await this.page.evaluate(() => {
          const items = document.querySelectorAll('[data-ec-code]');
          return Array.from(items).map(el => el.getAttribute('data-ec-code') || '');
        });

        for (const code of modalCodes) {
          if (isValidECCode(code)) {
            ecCodes.push(code);
          }
        }
      } catch {
        // Ignore
      }
    }

    return [...new Set(ecCodes)];
  }

  validateItem(item: Record<string, unknown>): boolean {
    // Check if it's a relation
    if (item.type === 'center_ec_offering') {
      return Boolean(item.centroId && item.ecClave);
    }

    // Main center validation
    const required = ['centroId', 'nombre', 'srcUrl'];

    for (const field of required) {
      if (!item[field]) {
        console.warn(`[CenterDriver] Missing required field: ${field}`);
        return false;
      }
    }

    return true;
  }
}
