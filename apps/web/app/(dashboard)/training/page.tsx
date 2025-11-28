"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ECCatalog } from "@/components/ec-training";
import {
  ecApi,
  trainingApi,
  type ECStandard,
  type ECEnrollment,
} from "@/lib/api/ec-api";

export default function TrainingPage() {
  const router = useRouter();
  const [standards, setStandards] = useState<ECStandard[]>([]);
  const [enrollments, setEnrollments] = useState<ECEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [standardsData, enrollmentsResult] = await Promise.all([
        ecApi.listStandards({ status: "PUBLISHED" }),
        trainingApi.getUserEnrollments("current-user"),
      ]);
      setStandards(standardsData.data);
      setEnrollments(enrollmentsResult);
    } catch (error) {
      console.error("Error loading training data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (ecCode: string) => {
    try {
      await trainingApi.enroll({
        userId: "current-user",
        ecCode,
        tenantId: "default-tenant",
      });
      // Reload enrollments
      const enrollmentsResult =
        await trainingApi.getUserEnrollments("current-user");
      setEnrollments(enrollmentsResult);
    } catch (error) {
      console.error("Error enrolling:", error);
    }
  };

  const handleContinue = (enrollment: ECEnrollment) => {
    router.push(`/training/${enrollment.ec?.code || enrollment.ecId}/learn`);
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

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Catálogo de Capacitación
        </h1>
        <p className="text-muted-foreground mt-2">
          Explora los estándares de competencia disponibles y comienza tu
          formación profesional
        </p>
      </div>
      <ECCatalog
        standards={standards}
        enrollments={enrollments}
        onEnroll={handleEnroll}
        onContinue={handleContinue}
      />
    </div>
  );
}
