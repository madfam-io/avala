'use client';

import { useState, useCallback } from 'react';
import {
  portfolioApi,
  type ECDocument,
  type DocumentTemplate,
} from '@/lib/api/ec-api';

export interface DocumentField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'number' | 'file' | 'signature';
  required: boolean;
  placeholder?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

export type FieldValue = string | number | File | null;

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface UseDocumentFormOptions {
  template: DocumentTemplate;
  existingDocument?: ECDocument;
  enrollmentId: string;
  onSave?: (document: ECDocument) => void;
  onSubmit?: (document: ECDocument) => void;
}

interface UseDocumentFormReturn {
  formData: Record<string, FieldValue>;
  errors: Record<string, string>;
  saving: boolean;
  submitting: boolean;
  lastSaved: Date | null;
  validationResult: ValidationResult | null;
  fields: DocumentField[];
  handleFieldChange: (fieldId: string, value: FieldValue) => void;
  handleSave: () => Promise<void>;
  handleSubmit: () => Promise<void>;
  validateForm: () => boolean;
}

export function useDocumentForm({
  template,
  existingDocument,
  enrollmentId,
  onSave,
  onSubmit,
}: UseDocumentFormOptions): UseDocumentFormReturn {
  const [formData, setFormData] = useState<Record<string, FieldValue>>(() => {
    if (existingDocument?.content) {
      return existingDocument.content as Record<string, FieldValue>;
    }
    return {};
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);

  const fields: DocumentField[] =
    (template.structure as { fields?: DocumentField[] })?.fields || [];

  const validateField = useCallback(
    (field: DocumentField, value: FieldValue): string | null => {
      if (field.required && !value) {
        return `${field.label} es requerido`;
      }

      if (typeof value === 'string' && field.validation) {
        const { minLength, maxLength, pattern } = field.validation;

        if (minLength && value.length < minLength) {
          return `${field.label} debe tener al menos ${minLength} caracteres`;
        }

        if (maxLength && value.length > maxLength) {
          return `${field.label} no puede exceder ${maxLength} caracteres`;
        }

        if (pattern && !new RegExp(pattern).test(value)) {
          return `${field.label} tiene un formato inválido`;
        }
      }

      return null;
    },
    [],
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    for (const field of fields) {
      const error = validateField(field, formData[field.id]);
      if (error) {
        newErrors[field.id] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [fields, formData, validateField]);

  const handleFieldChange = useCallback((fieldId: string, value: FieldValue) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => {
      if (prev[fieldId]) {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      }
      return prev;
    });
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      let result: ECDocument;
      if (existingDocument) {
        result = await portfolioApi.updateDocument(
          existingDocument.id,
          formData as Record<string, unknown>,
        );
      } else {
        result = await portfolioApi.createDocument(enrollmentId, template.id);
      }

      setLastSaved(new Date());
      onSave?.(result);
    } catch (error) {
      console.error('Error saving document:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [existingDocument, formData, enrollmentId, template.id, onSave]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      await handleSave();

      if (existingDocument) {
        const validation = await portfolioApi.validateDocument(
          existingDocument.id,
        );
        setValidationResult({
          valid: validation.isValid,
          errors: validation.errors.map((e) => e.message),
        });

        if (validation.isValid) {
          const result = await portfolioApi.submitDocument(existingDocument.id);
          onSubmit?.(result);
        }
      }
    } catch (error) {
      console.error('Error submitting document:', error);
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, handleSave, existingDocument, onSubmit]);

  return {
    formData,
    errors,
    saving,
    submitting,
    lastSaved,
    validationResult,
    fields,
    handleFieldChange,
    handleSave,
    handleSubmit,
    validateForm,
  };
}
