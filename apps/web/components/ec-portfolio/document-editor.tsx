"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Save,
  Send,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import {
  portfolioApi,
  type ECDocument,
  type DocumentTemplate,
} from "@/lib/api/ec-api";

interface DocumentField {
  id: string;
  label: string;
  type: "text" | "textarea" | "date" | "number" | "file" | "signature";
  required: boolean;
  placeholder?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

interface DocumentEditorProps {
  template: DocumentTemplate;
  existingDocument?: ECDocument;
  enrollmentId: string;
  onSave?: (document: ECDocument) => void;
  onSubmit?: (document: ECDocument) => void;
}

type FieldValue = string | number | File | null;

export function DocumentEditor({
  template,
  existingDocument,
  enrollmentId,
  onSave,
  onSubmit,
}: DocumentEditorProps) {
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
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    errors: string[];
  } | null>(null);

  const fields: DocumentField[] =
    (template.structure as { fields?: DocumentField[] })?.fields || [];

  const validateField = (
    field: DocumentField,
    value: FieldValue,
  ): string | null => {
    if (field.required && !value) {
      return `${field.label} es requerido`;
    }

    if (typeof value === "string" && field.validation) {
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
  };

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
  }, [fields, formData]);

  const handleFieldChange = (fieldId: string, value: FieldValue) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        templateId: template.id,
        enrollmentId,
        content: formData,
      };

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
      console.error("Error saving document:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      // First save
      await handleSave();

      // Then validate
      if (existingDocument) {
        const validation = await portfolioApi.validateDocument(
          existingDocument.id,
        );
        setValidationResult({
          valid: validation.isValid,
          errors: validation.errors.map((e) => e.message),
        });

        if (validation.isValid) {
          // Submit for review
          const result = await portfolioApi.submitDocument(existingDocument.id);
          onSubmit?.(result);
        }
      }
    } catch (error) {
      console.error("Error submitting document:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: DocumentField) => {
    const value = formData[field.id];
    const error = errors[field.id];

    const commonProps = {
      id: field.id,
      placeholder: field.placeholder,
      className: error ? "border-red-500" : "",
    };

    switch (field.type) {
      case "text":
      case "date":
      case "number":
        return (
          <Input
            {...commonProps}
            type={field.type}
            value={(value as string | number) || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );

      case "textarea":
        return (
          <Textarea
            {...commonProps}
            value={(value as string) || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            rows={4}
          />
        );

      case "file":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                type="file"
                className="hidden"
                id={`file-${field.id}`}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  handleFieldChange(field.id, file || null);
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  document.getElementById(`file-${field.id}`)?.click()
                }
              >
                <Upload className="h-4 w-4 mr-2" />
                Subir archivo
              </Button>
              {value instanceof File && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {value.name}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFieldChange(field.id, null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        );

      case "signature":
        return (
          <div className="border rounded-lg p-4 bg-muted/50">
            <p className="text-sm text-muted-foreground mb-2">
              Área de firma digital
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                handleFieldChange(field.id, `signed_${Date.now()}`)
              }
            >
              Firmar documento
            </Button>
            {value && (
              <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Documento firmado
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "SUBMITTED":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "Aprobado";
      case "REJECTED":
        return "Rechazado";
      case "SUBMITTED":
        return "En revisión";
      case "DRAFT":
      case "IN_PROGRESS":
        return "Borrador";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Document Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {template.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {template.description}
            </p>
          </div>
          {existingDocument && (
            <Badge className={getStatusColor(existingDocument.status)}>
              {getStatusLabel(existingDocument.status)}
            </Badge>
          )}
        </CardHeader>
      </Card>

      {/* Validation Result */}
      {validationResult && !validationResult.valid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {validationResult.errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Form Fields */}
      <Card>
        <CardContent className="pt-6">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            {fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <label
                  htmlFor={field.id}
                  className="text-sm font-medium flex items-center gap-1"
                >
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </label>
                {renderField(field)}
                {errors[field.id] && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors[field.id]}
                  </p>
                )}
              </div>
            ))}
          </form>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {lastSaved && <span>Guardado: {lastSaved.toLocaleTimeString()}</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={saving || submitting}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar borrador
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              saving || submitting || existingDocument?.status === "SUBMITTED"
            }
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Enviar para revisión
          </Button>
        </div>
      </div>
    </div>
  );
}
