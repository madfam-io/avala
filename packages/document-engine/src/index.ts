/**
 * @avala/document-engine
 *
 * Document generation engine for EC-aligned deliverables and compliance documents
 * Ported from ec0249 DocumentEngine with TypeScript enhancements
 */

// Types
export * from './types';

// Templates
export {
  DC3Template,
  ECDeliverableTemplate,
  ProblemDescriptionTemplate,
  MethodologyReportTemplate,
  CertificateTemplate,
  SYSTEM_TEMPLATES,
  getTemplateById,
  getTemplatesByCategory,
  getTemplatesByECCode,
  getTemplatesByElement,
  getAllSystemTemplates,
} from './templates';

// Validators
export {
  getDefaultValue,
  initializeDocumentData,
  isSectionComplete,
  validateSection,
  validateDocument,
  calculateCompletionPercentage,
  validateTemplate,
} from './validators';

// Exporters
export {
  exportToHTML,
  exportToPDF,
  exportToDocx,
  exportDocument,
} from './exporters';

// Re-export common types
import type {
  Template,
  Document,
  Section,
  DocumentStatus,
  DocumentCategory,
  ExportFormat,
  ExportOptions,
  ExportResult,
  DocumentValidationResult,
  DC3Data,
} from './types';

export type {
  Template,
  Document,
  Section,
  DocumentStatus,
  DocumentCategory,
  ExportFormat,
  ExportOptions,
  ExportResult,
  DocumentValidationResult,
  DC3Data,
};

// Document Engine class for stateful document management
import {
  initializeDocumentData,
  validateDocument as validateDoc,
  calculateCompletionPercentage,
} from './validators';
import { exportDocument as exportDoc } from './exporters';
import { getTemplateById, SYSTEM_TEMPLATES } from './templates';

export interface DocumentEngineConfig {
  autoSave?: boolean;
  saveInterval?: number;
  validationMode?: 'strict' | 'lenient';
}

/**
 * Document Engine - Manages document creation, editing, and export
 */
export class DocumentEngine {
  private config: Required<DocumentEngineConfig>;
  private templates: Map<string, Template> = new Map();
  private documents: Map<string, Document> = new Map();

  constructor(config: DocumentEngineConfig = {}) {
    this.config = {
      autoSave: config.autoSave ?? true,
      saveInterval: config.saveInterval ?? 30000,
      validationMode: config.validationMode ?? 'strict',
    };

    // Load system templates
    for (const template of SYSTEM_TEMPLATES) {
      this.templates.set(template.id, template);
    }
  }

  /**
   * Register a custom template
   */
  registerTemplate(template: Template): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): Template | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Get all registered templates
   */
  getAllTemplates(): Template[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by filter
   */
  getTemplates(filter: {
    category?: DocumentCategory;
    ecCode?: string;
    element?: string;
  }): Template[] {
    let templates = Array.from(this.templates.values());

    if (filter.category) {
      templates = templates.filter((t) => t.category === filter.category);
    }
    if (filter.ecCode) {
      templates = templates.filter((t) => t.ecCode === filter.ecCode);
    }
    if (filter.element) {
      templates = templates.filter((t) => t.element === filter.element);
    }

    return templates;
  }

  /**
   * Create a new document from template
   */
  createDocument(
    templateId: string,
    tenantId: string,
    userId: string,
    initialData: Record<string, unknown> = {}
  ): Document {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const documentId = this.generateDocumentId(templateId);
    const now = new Date();

    const document: Document = {
      id: documentId,
      tenantId,
      userId,
      templateId,
      title: template.title,
      status: 'draft',
      data: initializeDocumentData(template, initialData),
      completionPercentage: 0,
      version: 1,
      metadata: {
        estimatedTime: template.estimatedTime,
        timeSpent: 0,
        lastSection: null,
      },
      createdAt: now,
      updatedAt: now,
    };

    this.documents.set(documentId, document);
    return document;
  }

  /**
   * Get document by ID
   */
  getDocument(documentId: string): Document | undefined {
    return this.documents.get(documentId);
  }

  /**
   * Update document data
   */
  updateDocument(
    documentId: string,
    data: Partial<Record<string, unknown>>,
    sectionId?: string
  ): Document {
    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    const template = this.templates.get(document.templateId);
    if (!template) {
      throw new Error(`Template not found: ${document.templateId}`);
    }

    // Update document data
    document.data = { ...document.data, ...data };
    document.updatedAt = new Date();
    document.version += 1;

    // Track last section edited
    if (sectionId) {
      document.metadata.lastSection = sectionId;
    }

    // Recalculate completion percentage
    document.completionPercentage = calculateCompletionPercentage(document, template);

    // Update status based on completion
    if (document.completionPercentage >= 100) {
      document.status = 'completed';
    } else if (document.completionPercentage > 0 && document.status === 'draft') {
      document.status = 'in_progress';
    }

    return document;
  }

  /**
   * Validate document
   */
  validateDocument(documentId: string): DocumentValidationResult {
    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    const template = this.templates.get(document.templateId);
    if (!template) {
      throw new Error(`Template not found: ${document.templateId}`);
    }

    const result = validateDoc(document, template);

    // Store validation results in document metadata
    document.metadata.validationResults = result;

    return result;
  }

  /**
   * Export document to specified format
   */
  exportDocument(
    documentId: string,
    options: ExportOptions
  ): ExportResult {
    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    const template = this.templates.get(document.templateId);
    if (!template) {
      throw new Error(`Template not found: ${document.templateId}`);
    }

    return exportDoc(document, template, options);
  }

  /**
   * Submit document for review
   */
  submitDocument(documentId: string): Document {
    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    // Validate before submission
    const validation = this.validateDocument(documentId);
    if (this.config.validationMode === 'strict' && !validation.isValid) {
      throw new Error('Document validation failed. Please complete all required sections.');
    }

    document.status = 'submitted';
    document.submittedAt = new Date();
    document.updatedAt = new Date();

    return document;
  }

  /**
   * Approve document
   */
  approveDocument(documentId: string, reviewerId: string, notes?: string): Document {
    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    document.status = 'approved';
    document.approvedAt = new Date();
    document.reviewerId = reviewerId;
    document.reviewNotes = notes;
    document.updatedAt = new Date();

    return document;
  }

  /**
   * Reject document
   */
  rejectDocument(documentId: string, reviewerId: string, notes: string): Document {
    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    document.status = 'rejected';
    document.reviewerId = reviewerId;
    document.reviewNotes = notes;
    document.updatedAt = new Date();

    return document;
  }

  /**
   * Delete document
   */
  deleteDocument(documentId: string): boolean {
    return this.documents.delete(documentId);
  }

  /**
   * Get documents by user
   */
  getDocumentsByUser(userId: string): Document[] {
    return Array.from(this.documents.values()).filter(
      (doc) => doc.userId === userId
    );
  }

  /**
   * Get documents by tenant
   */
  getDocumentsByTenant(tenantId: string): Document[] {
    return Array.from(this.documents.values()).filter(
      (doc) => doc.tenantId === tenantId
    );
  }

  /**
   * Get documents by status
   */
  getDocumentsByStatus(status: DocumentStatus): Document[] {
    return Array.from(this.documents.values()).filter(
      (doc) => doc.status === status
    );
  }

  /**
   * Generate unique document ID
   */
  private generateDocumentId(templateId: string): string {
    return `${templateId}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Load documents from external source
   */
  loadDocuments(documents: Document[]): void {
    for (const doc of documents) {
      this.documents.set(doc.id, doc);
    }
  }

  /**
   * Export all documents (for persistence)
   */
  exportAllDocuments(): Document[] {
    return Array.from(this.documents.values());
  }
}

// Default export
export default DocumentEngine;
