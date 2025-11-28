"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { DocumentEditor } from "@/components/ec-portfolio";
import { portfolioApi, trainingApi, type ECDocument, type DocumentTemplate } from "@/lib/api/ec-api";

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const standardId = params.standardId as string;
  const documentId = params.documentId as string;
  const isNew = documentId === "new";
  const templateId = searchParams.get("templateId");
  // viewOnly flag for future read-only mode support
void searchParams.get("view");

  const [document, setDocument] = useState<ECDocument | null>(null);
  const [template, setTemplate] = useState<DocumentTemplate | null>(null);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [documentId, templateId, standardId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get enrollment
      const enrollments = await trainingApi.getEnrollments({ ecStandardId: standardId });
      if (enrollments.data.length === 0) {
        router.push(`/training/${standardId}`);
        return;
      }
      setEnrollmentId(enrollments.data[0].id);

      if (isNew && templateId) {
        // Creating new document - load template
        const templateData = await portfolioApi.getTemplate(templateId);
        setTemplate(templateData);
      } else if (!isNew) {
        // Editing existing document
        const docData = await portfolioApi.getDocument(documentId);
        setDocument(docData);

        // Load template for the document
        const templateData = await portfolioApi.getTemplate(docData.templateId);
        setTemplate(templateData);
      }
    } catch (error) {
      console.error("Error loading document data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (savedDoc: ECDocument) => {
    setDocument(savedDoc);
    // If it was a new document, update URL
    if (isNew) {
      router.replace(`/training/${standardId}/portfolio/${savedDoc.id}`);
    }
  };

  const handleSubmit = (submittedDoc: ECDocument) => {
    setDocument(submittedDoc);
    // Navigate back to portfolio dashboard
    router.push(`/training/${standardId}/learn?tab=portfolio`);
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!template || !enrollmentId) {
    return (
      <div className="container py-8 text-center">
        <h2 className="text-xl font-semibold">Documento no encontrado</h2>
        <Button
          variant="link"
          onClick={() => router.push(`/training/${standardId}/learn?tab=portfolio`)}
          className="mt-4"
        >
          Volver al portafolio
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push(`/training/${standardId}/learn?tab=portfolio`)}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver al portafolio
      </Button>

      {/* Document Editor */}
      <DocumentEditor
        template={template}
        existingDocument={document || undefined}
        enrollmentId={enrollmentId}
        onSave={handleSave}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
