/**
 * Document Exporters
 *
 * Export document content to various formats (HTML, PDF, DOCX)
 */

import type {
  Template,
  Section,
  Document,
  ExportResult,
  ExportOptions,
} from '../types';

// ============================================
// HTML Exporter
// ============================================

/**
 * Render section data as HTML
 */
function renderSectionDataHTML(section: Section, data: unknown): string {
  switch (section.type) {
    case 'textarea':
    case 'text': {
      const text = (data as string) || '';
      // Convert newlines to paragraphs
      const paragraphs = text
        .split('\n')
        .filter((p) => p.trim())
        .map((p) => `<p>${escapeHtml(p)}</p>`)
        .join('');
      return paragraphs || '<p class="empty">Sin contenido</p>';
    }

    case 'list': {
      const items = (data as string[]) || [];
      if (items.length === 0) return '<p class="empty">No hay elementos</p>';
      return `<ul class="list">${items.map((item) => `<li>${escapeHtml(String(item))}</li>`).join('')}</ul>`;
    }

    case 'table':
    case 'matrix': {
      const rows = (data as Record<string, unknown>[]) || [];
      if (rows.length === 0) return '<p class="empty">No hay datos</p>';

      const headers = section.headers || Object.keys(rows[0] || {});
      return `
        <table class="table">
          <thead>
            <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) =>
                  `<tr>${headers
                    .map((header) => `<td>${escapeHtml(String(row[header] || ''))}</td>`)
                    .join('')}</tr>`
              )
              .join('')}
          </tbody>
        </table>
      `;
    }

    case 'structured': {
      if (!section.subsections) return '<p class="empty">No hay datos</p>';
      const structData = (data as Record<string, unknown>) || {};
      return section.subsections
        .map((subsection) => {
          const subSection: Section = {
            id: subsection.id,
            title: subsection.title,
            type: subsection.type,
            required: true,
            headers: subsection.headers,
          };
          return `
            <div class="subsection">
              <h4>${escapeHtml(subsection.title)}</h4>
              ${renderSectionDataHTML(subSection, structData[subsection.id])}
            </div>
          `;
        })
        .join('');
    }

    case 'form_fields': {
      if (!section.fields) return '<p class="empty">No hay datos</p>';
      const formData = (data as Record<string, unknown>) || {};
      return `
        <dl class="form-data">
          ${section.fields
            .map(
              (field) =>
                `<dt>${escapeHtml(field.label)}</dt><dd>${escapeHtml(String(formData[field.name] || '-'))}</dd>`
            )
            .join('')}
        </dl>
      `;
    }

    case 'date': {
      const dateValue = data as string;
      if (!dateValue) return '<p class="empty">-</p>';
      try {
        return `<p>${new Date(dateValue).toLocaleDateString('es-MX')}</p>`;
      } catch {
        return `<p>${escapeHtml(dateValue)}</p>`;
      }
    }

    case 'signature': {
      return data
        ? '<p class="signature">✓ Firmado</p>'
        : '<p class="empty">Pendiente de firma</p>';
    }

    case 'checkbox': {
      return data ? '<p>✓ Sí</p>' : '<p>✗ No</p>';
    }

    default: {
      const value = data;
      return `<p>${escapeHtml(String(value || ''))}</p>`;
    }
  }
}

/**
 * Render document sections as HTML
 */
function renderDocumentSectionsHTML(template: Template, document: Document): string {
  return template.sections
    .map((section) => {
      const data = document.data[section.id];
      return `
        <div class="section">
          <h2 class="section-title">${escapeHtml(section.title)}</h2>
          ${section.description ? `<p class="section-description">${escapeHtml(section.description)}</p>` : ''}
          <div class="section-content">
            ${renderSectionDataHTML(section, data)}
          </div>
        </div>
      `;
    })
    .join('');
}

/**
 * Export document to HTML
 */
export function exportToHTML(
  document: Document,
  template: Template,
  options: Partial<ExportOptions> = {}
): ExportResult {
  const includeHeader = options.includeHeader ?? true;
  const includeFooter = options.includeFooter ?? true;

  const styles = `
    <style>
      * { box-sizing: border-box; }
      body {
        font-family: 'Segoe UI', Arial, sans-serif;
        margin: 0;
        padding: 40px;
        line-height: 1.6;
        color: #333;
      }
      .document-container {
        max-width: 800px;
        margin: 0 auto;
      }
      .header {
        border-bottom: 3px solid #2563eb;
        padding-bottom: 20px;
        margin-bottom: 30px;
      }
      .header h1 {
        color: #1e40af;
        margin: 0 0 10px 0;
        font-size: 24px;
      }
      .header .meta {
        color: #6b7280;
        font-size: 14px;
      }
      .header .meta p { margin: 5px 0; }
      .section {
        margin-bottom: 30px;
        page-break-inside: avoid;
      }
      .section-title {
        color: #1e40af;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 8px;
        margin-bottom: 15px;
        font-size: 18px;
      }
      .section-description {
        color: #6b7280;
        font-size: 14px;
        margin-bottom: 15px;
        font-style: italic;
      }
      .section-content p { margin: 10px 0; }
      .subsection { margin: 15px 0 15px 20px; }
      .subsection h4 {
        color: #4b5563;
        margin: 0 0 10px 0;
        font-size: 15px;
      }
      .table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
        font-size: 14px;
      }
      .table th, .table td {
        border: 1px solid #d1d5db;
        padding: 10px;
        text-align: left;
      }
      .table th {
        background-color: #f3f4f6;
        font-weight: 600;
      }
      .table tr:nth-child(even) { background-color: #f9fafb; }
      .list {
        margin: 10px 0;
        padding-left: 25px;
      }
      .list li { margin: 5px 0; }
      .form-data {
        display: grid;
        grid-template-columns: 200px 1fr;
        gap: 5px 15px;
        margin: 10px 0;
      }
      .form-data dt {
        font-weight: 600;
        color: #4b5563;
      }
      .form-data dd {
        margin: 0;
      }
      .empty {
        color: #9ca3af;
        font-style: italic;
      }
      .signature {
        color: #059669;
        font-weight: 600;
      }
      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
        color: #6b7280;
        font-size: 12px;
        text-align: center;
      }
      @media print {
        body { padding: 20px; }
        .section { page-break-inside: avoid; }
      }
    </style>
  `;

  const headerHtml = includeHeader
    ? `
      <div class="header">
        <h1>${escapeHtml(document.title)}</h1>
        <div class="meta">
          ${template.element ? `<p><strong>Elemento:</strong> ${escapeHtml(template.element)} - ${escapeHtml(template.elementName || '')}</p>` : ''}
          ${template.ecCode ? `<p><strong>Estándar:</strong> ${escapeHtml(template.ecCode)}</p>` : ''}
          <p><strong>Fecha de creación:</strong> ${new Date(document.createdAt).toLocaleDateString('es-MX')}</p>
          <p><strong>Última actualización:</strong> ${new Date(document.updatedAt).toLocaleDateString('es-MX')}</p>
          <p><strong>Estado:</strong> ${getStatusLabel(document.status)}</p>
        </div>
      </div>
    `
    : '';

  const footerHtml = includeFooter
    ? `
      <div class="footer">
        <p>Documento generado por Avala | ${new Date().toLocaleDateString('es-MX')}</p>
      </div>
    `
    : '';

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(document.title)}</title>
      ${styles}
    </head>
    <body>
      <div class="document-container">
        ${headerHtml}
        <div class="content">
          ${renderDocumentSectionsHTML(template, document)}
        </div>
        ${footerHtml}
      </div>
    </body>
    </html>
  `;

  return {
    content: html,
    filename: `${sanitizeFilename(document.title)}_${document.id}.html`,
    mimeType: 'text/html',
  };
}

// ============================================
// PDF Exporter
// ============================================

/**
 * Export document to PDF-ready HTML
 * Note: Actual PDF generation requires browser print or a PDF library
 */
export function exportToPDF(
  document: Document,
  template: Template,
  options: Partial<ExportOptions> = {}
): ExportResult {
  const pageSize = options.pageSize || 'letter';
  const orientation = options.orientation || 'portrait';

  const pdfStyles = `
    <style>
      @page {
        size: ${pageSize} ${orientation};
        margin: 20mm;
      }
      @media print {
        body {
          font-family: Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.4;
          color: #000;
          background: white;
        }
        .header {
          border-bottom: 2pt solid #1e40af;
          padding-bottom: 10pt;
          margin-bottom: 15pt;
        }
        .header h1 {
          font-size: 16pt;
          font-weight: bold;
          margin: 0 0 5pt 0;
          color: #1e40af;
        }
        .section {
          margin-bottom: 15pt;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 13pt;
          font-weight: bold;
          color: #1e40af;
          border-bottom: 1pt solid #e5e7eb;
          padding-bottom: 3pt;
          margin-bottom: 8pt;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin: 8pt 0;
          font-size: 10pt;
        }
        .table th, .table td {
          border: 0.5pt solid #6b7280;
          padding: 5pt;
          text-align: left;
        }
        .table th {
          background-color: #f3f4f6;
          font-weight: bold;
        }
        .footer {
          position: fixed;
          bottom: 10mm;
          left: 20mm;
          right: 20mm;
          font-size: 9pt;
          color: #6b7280;
          text-align: center;
          border-top: 0.5pt solid #e5e7eb;
          padding-top: 5pt;
        }
      }
    </style>
  `;

  // Get HTML content and add PDF styles
  const htmlExport = exportToHTML(document, template, options);
  const htmlContent = htmlExport.content as string;

  // Replace styles section with PDF-optimized styles
  const pdfHtml = htmlContent.replace(/<style>[\s\S]*?<\/style>/, pdfStyles);

  return {
    content: pdfHtml,
    filename: `${sanitizeFilename(document.title)}_${document.id}.pdf`,
    mimeType: 'application/pdf',
    note: 'Use browser print dialog with "Save as PDF" option',
  };
}

// ============================================
// DOCX Exporter
// ============================================

/**
 * Export document to DOCX-compatible HTML
 * Note: Full DOCX generation requires a library like docx.js
 */
export function exportToDocx(
  document: Document,
  template: Template,
  options: Partial<ExportOptions> = {}
): ExportResult {
  // Generate DOCX-compatible HTML
  const htmlExport = exportToHTML(document, template, options);
  let htmlContent = htmlExport.content as string;

  // Apply DOCX-compatible inline styles
  htmlContent = htmlContent
    .replace(
      /<div class="document-container">/g,
      '<div style="width: 21cm; margin: 0 auto; padding: 2cm; font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.6;">'
    )
    .replace(/<h1>/g, '<h1 style="font-size: 18pt; font-weight: bold; margin-bottom: 1em; color: #1e40af;">')
    .replace(/<h2 class="section-title">/g, '<h2 style="font-size: 14pt; font-weight: bold; margin: 1.5em 0 1em 0; color: #1e40af; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">')
    .replace(/<h4>/g, '<h4 style="font-size: 12pt; font-weight: bold; margin: 1em 0 0.5em 0;">')
    .replace(/<p>/g, '<p style="margin-bottom: 1em;">')
    .replace(/<ul class="list">/g, '<ul style="margin: 1em 0; padding-left: 2em;">')
    .replace(/<table class="table">/g, '<table style="border-collapse: collapse; width: 100%; margin: 1em 0;">')
    .replace(/<th>/g, '<th style="border: 1px solid #6b7280; padding: 8px; background-color: #f3f4f6; font-weight: bold; text-align: left;">')
    .replace(/<td>/g, '<td style="border: 1px solid #6b7280; padding: 8px;">');

  return {
    content: htmlContent,
    filename: `${sanitizeFilename(document.title)}_${document.id}.docx.html`,
    mimeType: 'text/html',
    note: 'Exported as HTML format - open in Word to save as DOCX',
  };
}

// ============================================
// Main Export Function
// ============================================

/**
 * Export document to specified format
 */
export function exportDocument(
  document: Document,
  template: Template,
  options: ExportOptions
): ExportResult {
  switch (options.format) {
    case 'html':
      return exportToHTML(document, template, options);
    case 'pdf':
      return exportToPDF(document, template, options);
    case 'docx':
      return exportToDocx(document, template, options);
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m] || m);
}

/**
 * Sanitize filename
 */
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 50);
}

/**
 * Get status label in Spanish
 */
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Borrador',
    in_progress: 'En progreso',
    completed: 'Completado',
    submitted: 'Enviado',
    approved: 'Aprobado',
    rejected: 'Rechazado',
  };
  return labels[status] || status;
}
