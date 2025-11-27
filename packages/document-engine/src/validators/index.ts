/**
 * Document Validators
 *
 * Validation logic for document sections and templates
 */

import type {
  Template,
  Section,
  Document,
  Validation,
  SectionValidationResult,
  DocumentValidationResult,
} from '../types';

// ============================================
// Section Validators
// ============================================

/**
 * Get default value for a section type
 */
export function getDefaultValue(type: string): unknown {
  switch (type) {
    case 'list':
      return [];
    case 'table':
    case 'matrix':
      return [];
    case 'textarea':
    case 'text':
      return '';
    case 'number':
      return 0;
    case 'date':
      return '';
    case 'boolean':
    case 'checkbox':
      return false;
    case 'structured':
    case 'form_fields':
      return {};
    default:
      return '';
  }
}

/**
 * Initialize document data from template
 */
export function initializeDocumentData(
  template: Template,
  initialData: Record<string, unknown> = {}
): Record<string, unknown> {
  const data: Record<string, unknown> = { ...initialData };

  for (const section of template.sections) {
    if (data[section.id] === undefined) {
      switch (section.type) {
        case 'structured':
          data[section.id] = {};
          if (section.subsections) {
            const sectionData = data[section.id] as Record<string, unknown>;
            for (const subsection of section.subsections) {
              sectionData[subsection.id] = getDefaultValue(subsection.type);
            }
          }
          break;

        case 'form_fields':
          data[section.id] = {};
          if (section.fields) {
            const formData = data[section.id] as Record<string, unknown>;
            for (const field of section.fields) {
              formData[field.name] = '';
            }
          }
          break;

        case 'matrix':
        case 'table':
        case 'list':
          data[section.id] = [];
          break;

        default:
          data[section.id] = getDefaultValue(section.type);
      }
    }
  }

  return data;
}

/**
 * Check if a section is complete
 */
export function isSectionComplete(
  section: Section,
  data: unknown
): boolean {
  if (!section.required) return true;
  if (data === undefined || data === null) return false;

  const validation = section.validation;

  switch (section.type) {
    case 'textarea':
    case 'text': {
      const text = data as string;
      const minLength = validation?.minLength || 10;
      return typeof text === 'string' && text.length >= minLength;
    }

    case 'list': {
      const list = data as unknown[];
      const minItems = validation?.minItems || 1;
      return Array.isArray(list) && list.length >= minItems;
    }

    case 'table':
    case 'matrix': {
      const rows = data as unknown[];
      const minRows = validation?.minRows || 1;
      return Array.isArray(rows) && rows.length >= minRows;
    }

    case 'structured': {
      if (!section.subsections) return true;
      const structData = data as Record<string, unknown>;
      return section.subsections.every((subsection) => {
        const subData = structData[subsection.id];
        // Create a minimal Section-like object for recursive validation
        const subSection: Section = {
          id: subsection.id,
          title: subsection.title,
          type: subsection.type,
          required: true,
          validation: subsection.validation,
          headers: subsection.headers,
          fields: subsection.fields,
          subsections: subsection.subsections,
        };
        return isSectionComplete(subSection, subData);
      });
    }

    case 'form_fields': {
      if (!section.fields) return true;
      const formData = data as Record<string, unknown>;
      return section.fields.every((field) => {
        const value = formData[field.name];
        if (!field.required) return true;
        return value !== undefined && value !== null && String(value).trim().length > 0;
      });
    }

    case 'date':
    case 'signature': {
      const value = data as string;
      return typeof value === 'string' && value.trim().length > 0;
    }

    case 'checkbox': {
      return data === true;
    }

    default: {
      const value = data;
      return value !== undefined && value !== null && String(value).trim().length > 0;
    }
  }
}

/**
 * Validate a single section
 */
export function validateSection(
  section: Section,
  data: unknown
): SectionValidationResult {
  const result: SectionValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Check required validation
  if (section.required && (data === undefined || data === null)) {
    result.isValid = false;
    result.errors.push('Esta sección es obligatoria');
    return result;
  }

  if (!section.validation) return result;

  const validation = section.validation;

  // Validate based on section type and validation rules
  switch (section.type) {
    case 'textarea':
    case 'text': {
      const text = (data as string) || '';
      if (validation.minLength && text.length < validation.minLength) {
        result.isValid = false;
        result.errors.push(`Mínimo ${validation.minLength} caracteres requeridos`);
      }
      if (validation.maxLength && text.length > validation.maxLength) {
        result.warnings.push(
          `Se recomienda no exceder ${validation.maxLength} caracteres`
        );
      }
      if (validation.pattern) {
        const regex = new RegExp(validation.pattern);
        if (!regex.test(text)) {
          result.isValid = false;
          result.errors.push('El formato no es válido');
        }
      }
      break;
    }

    case 'list': {
      const list = (data as unknown[]) || [];
      if (validation.minItems && list.length < validation.minItems) {
        result.isValid = false;
        result.errors.push(`Mínimo ${validation.minItems} elementos requeridos`);
      }
      if (validation.maxItems && list.length > validation.maxItems) {
        result.warnings.push(
          `Se recomienda no exceder ${validation.maxItems} elementos`
        );
      }
      break;
    }

    case 'table':
    case 'matrix': {
      const rows = (data as unknown[]) || [];
      if (validation.minRows && rows.length < validation.minRows) {
        result.isValid = false;
        result.errors.push(`Mínimo ${validation.minRows} filas requeridas`);
      }
      if (validation.maxRows && rows.length > validation.maxRows) {
        result.warnings.push(
          `Se recomienda no exceder ${validation.maxRows} filas`
        );
      }
      break;
    }

    case 'structured': {
      if (section.subsections) {
        const structData = (data as Record<string, unknown>) || {};
        for (const subsection of section.subsections) {
          const subSection: Section = {
            id: subsection.id,
            title: subsection.title,
            type: subsection.type,
            required: true,
            validation: subsection.validation,
            headers: subsection.headers,
            fields: subsection.fields,
            subsections: subsection.subsections,
          };
          const subResult = validateSection(subSection, structData[subsection.id]);
          if (!subResult.isValid) {
            result.isValid = false;
            result.errors.push(...subResult.errors.map((e) => `${subsection.title}: ${e}`));
          }
          result.warnings.push(...subResult.warnings.map((w) => `${subsection.title}: ${w}`));
        }
      }
      break;
    }

    case 'form_fields': {
      if (section.fields) {
        const formData = (data as Record<string, unknown>) || {};
        for (const field of section.fields) {
          const value = formData[field.name];
          if (field.required && (!value || String(value).trim().length === 0)) {
            result.isValid = false;
            result.errors.push(`Campo "${field.label}" es obligatorio`);
          }
          if (field.validation) {
            const strValue = String(value || '');
            if (field.validation.minLength && strValue.length < field.validation.minLength) {
              result.isValid = false;
              result.errors.push(
                `Campo "${field.label}" requiere mínimo ${field.validation.minLength} caracteres`
              );
            }
            if (field.validation.pattern) {
              const regex = new RegExp(field.validation.pattern);
              if (!regex.test(strValue)) {
                result.isValid = false;
                result.errors.push(`Campo "${field.label}" tiene formato inválido`);
              }
            }
          }
        }
      }
      break;
    }
  }

  return result;
}

/**
 * Validate entire document
 */
export function validateDocument(
  document: Document,
  template: Template
): DocumentValidationResult {
  const result: DocumentValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    completionPercentage: 0,
    sectionsValidated: 0,
    sectionsWithErrors: 0,
  };

  for (const section of template.sections) {
    result.sectionsValidated++;

    const sectionData = document.data[section.id];
    const sectionValidation = validateSection(section, sectionData);

    if (!sectionValidation.isValid) {
      result.sectionsWithErrors++;
      result.isValid = false;
      result.errors.push({
        sectionId: section.id,
        sectionTitle: section.title,
        errors: sectionValidation.errors,
      });
    }

    if (sectionValidation.warnings.length > 0) {
      result.warnings.push({
        sectionId: section.id,
        sectionTitle: section.title,
        warnings: sectionValidation.warnings,
      });
    }
  }

  // Calculate completion percentage
  result.completionPercentage = calculateCompletionPercentage(document, template);

  return result;
}

/**
 * Calculate document completion percentage
 */
export function calculateCompletionPercentage(
  document: Document,
  template: Template
): number {
  let totalSections = 0;
  let completedSections = 0;

  for (const section of template.sections) {
    totalSections++;

    if (isSectionComplete(section, document.data[section.id])) {
      completedSections++;
    }
  }

  return totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
}

/**
 * Validate template structure
 */
export function validateTemplate(template: Template): boolean {
  if (!template.id || !template.title || !template.sections) {
    return false;
  }

  if (!Array.isArray(template.sections) || template.sections.length === 0) {
    return false;
  }

  for (const section of template.sections) {
    if (!section.id || !section.title || !section.type) {
      return false;
    }
  }

  return true;
}
