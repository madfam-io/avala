/**
 * @avala/document-engine types
 *
 * Type definitions for EC-aligned document templates and generation
 */

import { z } from 'zod';

// ============================================
// Section Types
// ============================================

export type SectionType =
  | 'text'
  | 'textarea'
  | 'list'
  | 'table'
  | 'matrix'
  | 'structured'
  | 'form_fields'
  | 'signature'
  | 'date'
  | 'checkbox'
  | 'radio'
  | 'select';

// Field schema for form_fields sections
export const FieldSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: z.enum(['text', 'textarea', 'number', 'date', 'email', 'tel', 'select', 'checkbox', 'radio']),
  required: z.boolean().default(true),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(), // For select/radio
  validation: z
    .object({
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      pattern: z.string().optional(),
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
});

export type Field = z.infer<typeof FieldSchema>;

// Validation schema
export const ValidationSchema = z.object({
  required: z.boolean().default(false),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  minItems: z.number().optional(),
  maxItems: z.number().optional(),
  minRows: z.number().optional(),
  maxRows: z.number().optional(),
  pattern: z.string().optional(),
  customValidator: z.string().optional(), // Function name for custom validation
});

export type Validation = z.infer<typeof ValidationSchema>;

// Subsection schema (recursive structure)
export interface Subsection {
  id: string;
  title: string;
  type: SectionType;
  placeholder?: string;
  validation?: Validation;
  headers?: string[]; // For table/matrix
  fields?: Field[]; // For form_fields
  subsections?: Subsection[]; // For nested structured sections
}

// Section schema
export const SectionSchema: z.ZodType<{
  id: string;
  title: string;
  type: SectionType;
  required: boolean;
  description?: string;
  placeholder?: string;
  validation?: Validation;
  headers?: string[];
  fields?: Field[];
  subsections?: Subsection[];
}> = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum([
    'text',
    'textarea',
    'list',
    'table',
    'matrix',
    'structured',
    'form_fields',
    'signature',
    'date',
    'checkbox',
    'radio',
    'select',
  ]),
  required: z.boolean().default(true),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  validation: ValidationSchema.optional(),
  headers: z.array(z.string()).optional(),
  fields: z.array(FieldSchema).optional(),
  subsections: z.array(z.lazy(() => z.any())).optional(), // Recursive
});

export type Section = z.infer<typeof SectionSchema>;

// ============================================
// Template Types
// ============================================

export type DocumentCategory =
  | 'ec_deliverable' // EC standard deliverable
  | 'dc3' // DC-3 compliance document
  | 'lft' // LFT training plan
  | 'sirce' // SIRCE export
  | 'certificate' // Completion certificate
  | 'custom'; // Custom tenant template

// Video support for tutorials
export const VideoSupportSchema = z.object({
  id: z.string(), // YouTube video ID
  title: z.string(),
  description: z.string().optional(),
  timestamp: z.number().optional(), // Start timestamp in seconds
});

export type VideoSupport = z.infer<typeof VideoSupportSchema>;

// Template definition
export const TemplateSchema = z.object({
  id: z.string(),
  tenantId: z.string().uuid().optional(), // null for system templates

  // Basic info
  title: z.string(),
  description: z.string().optional(),
  category: z.enum(['ec_deliverable', 'dc3', 'lft', 'sirce', 'certificate', 'custom']),
  icon: z.string().default('📄'),

  // EC alignment
  ecCode: z.string().optional(), // e.g., "EC0217.01"
  element: z.string().optional(), // e.g., "E0875"
  elementName: z.string().optional(),
  elementIndex: z.number().optional(),

  // Content structure
  sections: z.array(SectionSchema),

  // Evaluation criteria (for EC deliverables)
  evaluationCriteria: z.array(z.string()).default([]),

  // Metadata
  required: z.boolean().default(false),
  estimatedTime: z.number().optional(), // Minutes
  videoSupport: VideoSupportSchema.optional(),

  // Export settings
  exportFormats: z.array(z.enum(['html', 'pdf', 'docx'])).default(['html', 'pdf']),

  // Status
  status: z.enum(['draft', 'published', 'archived']).default('published'),
  version: z.string().default('1.0'),

  // Timestamps
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Template = z.infer<typeof TemplateSchema>;

// ============================================
// Document Instance Types
// ============================================

export type DocumentStatus =
  | 'draft'
  | 'in_progress'
  | 'completed'
  | 'submitted'
  | 'approved'
  | 'rejected';

export const DocumentSchema = z.object({
  id: z.string(),
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
  templateId: z.string(),

  // Basic info
  title: z.string(),
  status: z.enum(['draft', 'in_progress', 'completed', 'submitted', 'approved', 'rejected']),

  // Content
  data: z.record(z.string(), z.any()), // Section data by section ID

  // Progress
  completionPercentage: z.number().min(0).max(100),

  // Versioning
  version: z.number().default(1),

  // Metadata
  metadata: z.object({
    estimatedTime: z.number().optional(),
    timeSpent: z.number().default(0),
    lastSection: z.string().nullable().optional(),
    validationResults: z.any().optional(),
  }).default({}),

  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
  submittedAt: z.date().optional(),
  approvedAt: z.date().optional(),

  // Review
  reviewerId: z.string().uuid().optional(),
  reviewNotes: z.string().optional(),
});

export type Document = z.infer<typeof DocumentSchema>;

// ============================================
// Validation Types
// ============================================

export interface SectionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DocumentValidationResult {
  isValid: boolean;
  errors: Array<{
    sectionId: string;
    sectionTitle: string;
    errors: string[];
  }>;
  warnings: Array<{
    sectionId: string;
    sectionTitle: string;
    warnings: string[];
  }>;
  completionPercentage: number;
  sectionsValidated: number;
  sectionsWithErrors: number;
}

// ============================================
// Export Types
// ============================================

export type ExportFormat = 'html' | 'pdf' | 'docx';

export interface ExportResult {
  content: string | Blob;
  filename: string;
  mimeType: string;
  note?: string;
}

export interface ExportOptions {
  format: ExportFormat;
  includeHeader?: boolean;
  includeFooter?: boolean;
  includeLogo?: boolean;
  pageSize?: 'letter' | 'a4';
  orientation?: 'portrait' | 'landscape';
}

// ============================================
// DC-3 Specific Types
// ============================================

export const DC3DataSchema = z.object({
  // Company info
  empresa: z.object({
    razonSocial: z.string(),
    rfc: z.string(),
    representanteLegal: z.string(),
    domicilio: z.string().optional(),
    telefono: z.string().optional(),
  }),

  // Training info
  curso: z.object({
    nombre: z.string(),
    duracionHoras: z.number(),
    fechaInicio: z.string(), // ISO date
    fechaFin: z.string(),
    modalidad: z.enum(['presencial', 'virtual', 'mixta']),
    objetivo: z.string().optional(),
    contenidoTematico: z.array(z.string()).optional(),
  }),

  // Instructor info
  instructor: z.object({
    nombre: z.string(),
    curp: z.string().optional(),
    rfc: z.string().optional(),
    numeroRegistroSTPS: z.string().optional(),
  }),

  // Trainee info
  trabajador: z.object({
    nombre: z.string(),
    curp: z.string(),
    puesto: z.string().optional(),
    area: z.string().optional(),
  }),

  // Results
  resultado: z.object({
    calificacion: z.number().optional(),
    aprobado: z.boolean(),
    observaciones: z.string().optional(),
  }),

  // Folio
  folio: z.string().optional(),
  fechaEmision: z.string().optional(),
});

export type DC3Data = z.infer<typeof DC3DataSchema>;

// ============================================
// Template Bank Types
// ============================================

export interface TemplateBank {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  templates: Template[];
  ecCodes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateFilter {
  category?: DocumentCategory | DocumentCategory[];
  ecCode?: string;
  element?: string;
  status?: 'draft' | 'published' | 'archived';
  required?: boolean;
}
