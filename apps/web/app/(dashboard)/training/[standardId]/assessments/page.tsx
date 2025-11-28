"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Target,
  Clock,
  CheckCircle,
  Play,
  Lock,
  AlertCircle,
} from "lucide-react";
import {
  assessmentApi,
  trainingApi,
  type ECAssessment,
  type ECEnrollment,
} from "@/lib/api/ec-api";

export default function AssessmentsPage() {
  const params = useParams();
  const router = useRouter();
  const standardId = params.standardId as string;

  const [assessments, setAssessments] = useState<ECAssessment[]>([]);
  const [enrollment, setEnrollment] = useState<ECEnrollment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [standardId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assessmentsData, enrollmentsResult] = await Promise.all([
        assessmentApi.getAssessments(standardId),
        trainingApi.getEnrollments({ ecStandardId: standardId }),
      ]);

      setAssessments(assessmentsData);

      if (enrollmentsResult.data.length > 0) {
        setEnrollment(enrollmentsResult.data[0]);
      }
    } catch (error) {
      console.error("Error loading assessments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAssessmentStatus = (assessment: ECAssessment) => {
    if (!enrollment) return "locked";

    // Get assessment progress from enrollment metadata if available
    const enrollmentWithMeta = enrollment as unknown as {
      assessmentProgress?: Record<
        string,
        { passed?: boolean; attempts?: number }
      >;
    };
    const assessmentProgress = enrollmentWithMeta.assessmentProgress || {};
    const status = assessmentProgress[assessment.id];

    if (status?.passed) return "passed";
    if (status?.attempts && status.attempts > 0) return "attempted";

    // Check prerequisites
    if (assessment.prerequisites) {
      const prereqs = assessment.prerequisites as string[];
      for (const prereqId of prereqs) {
        if (!assessmentProgress[prereqId]?.passed) {
          return "locked";
        }
      }
    }

    return "available";
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "passed":
        return {
          badge: "bg-green-100 text-green-800",
          label: "Aprobado",
          icon: CheckCircle,
          canStart: false,
        };
      case "attempted":
        return {
          badge: "bg-yellow-100 text-yellow-800",
          label: "Intentado",
          icon: AlertCircle,
          canStart: true,
        };
      case "available":
        return {
          badge: "bg-blue-100 text-blue-800",
          label: "Disponible",
          icon: Play,
          canStart: true,
        };
      case "locked":
      default:
        return {
          badge: "bg-gray-100 text-gray-800",
          label: "Bloqueado",
          icon: Lock,
          canStart: false,
        };
    }
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
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() =>
          router.push(`/training/${standardId}/learn?tab=assessments`)
        }
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver al curso
      </Button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Evaluaciones</h1>
        <p className="text-muted-foreground mt-2">
          Demuestra tu competencia completando las evaluaciones del estándar
        </p>
      </div>

      {/* Assessments List */}
      <div className="space-y-4">
        {assessments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold">No hay evaluaciones disponibles</h3>
              <p className="text-muted-foreground mt-2">
                Las evaluaciones se habilitarán a medida que avances en el curso
              </p>
            </CardContent>
          </Card>
        ) : (
          assessments.map((assessment) => {
            const status = getAssessmentStatus(assessment);
            const config = getStatusConfig(status);
            const StatusIcon = config.icon;

            return (
              <Card
                key={assessment.id}
                className={status === "locked" ? "opacity-75" : ""}
              >
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-full ${
                          status === "passed"
                            ? "bg-green-100"
                            : status === "locked"
                              ? "bg-gray-100"
                              : "bg-primary/10"
                        }`}
                      >
                        <Target
                          className={`h-6 w-6 ${
                            status === "passed"
                              ? "text-green-600"
                              : status === "locked"
                                ? "text-gray-400"
                                : "text-primary"
                          }`}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold">{assessment.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {assessment.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            {(assessment.questions as unknown[])?.length ||
                              0}{" "}
                            preguntas
                          </span>
                          {assessment.timeLimit && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {assessment.timeLimit} min
                            </span>
                          )}
                          <span>Mínimo: {assessment.passingScore || 70}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={config.badge}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                      {config.canStart && (
                        <Button
                          onClick={() =>
                            router.push(
                              `/training/${standardId}/assessments/${assessment.id}`,
                            )
                          }
                        >
                          {status === "attempted" ? "Reintentar" : "Comenzar"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
