"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, FileText, Target, BarChart } from "lucide-react";
import {
  ModuleList,
  LessonViewer,
  ProgressDashboard,
} from "@/components/ec-training";
import { PortfolioDashboard } from "@/components/ec-portfolio";
import {
  ecApi,
  trainingApi,
  type ECStandard,
  type ECEnrollment,
  type ECLesson,
  type ECModule,
} from "@/lib/api/ec-api";

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const standardId = params.standardId as string;
  const tab = searchParams.get("tab") || "modules";

  const [standard, setStandard] = useState<ECStandard | null>(null);
  const [enrollment, setEnrollment] = useState<ECEnrollment | null>(null);
  const [currentLesson, setCurrentLesson] = useState<ECLesson | null>(null);
  const [currentModule, setCurrentModule] = useState<ECModule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [standardId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [standardData, enrollmentsResult] = await Promise.all([
        ecApi.getStandard(standardId),
        trainingApi.getEnrollments({ ecStandardId: standardId }),
      ]);

      setStandard(standardData);

      if (enrollmentsResult.data.length > 0) {
        setEnrollment(enrollmentsResult.data[0]);

        // Load current lesson if available
        if (enrollmentsResult.data[0].currentLessonId) {
          const lessonData = await ecApi.getLesson(
            enrollmentsResult.data[0].currentLessonId,
          );
          setCurrentLesson(lessonData);
        }
      } else {
        // Redirect to standard page if not enrolled
        router.push(`/training/${standardId}`);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonSelect = async (lesson: ECLesson, moduleId?: string) => {
    setCurrentLesson(lesson);
    // Find and set the current module
    if (moduleId && standard?.modules) {
      const module = standard.modules.find((m) => m.id === moduleId);
      if (module) {
        setCurrentModule(module);
      }
    }
  };

  const handleLessonComplete = async (lessonId: string) => {
    if (!enrollment) return;

    try {
      await trainingApi.updateProgress(enrollment.id, lessonId, {
        markCompleted: true,
      });

      // Reload enrollment to get updated progress
      const enrollmentsResult = await trainingApi.getEnrollments({
        ecStandardId: standardId,
      });
      if (enrollmentsResult.data.length > 0) {
        setEnrollment(enrollmentsResult.data[0]);
      }
    } catch (error) {
      console.error("Error completing lesson:", error);
    }
  };

  const handleVideoProgress = async (
    lessonId: string,
    progress: number,
    _watchedSeconds: number,
  ) => {
    if (!enrollment) return;

    try {
      await trainingApi.updateVideoProgress(enrollment.id, lessonId, progress);
    } catch (error) {
      console.error("Error updating video progress:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!standard || !enrollment) {
    return (
      <div className="container py-8 text-center">
        <h2 className="text-xl font-semibold">No se encontró la inscripción</h2>
        <Button
          variant="link"
          onClick={() => router.push("/training")}
          className="mt-4"
        >
          Volver al catálogo
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/training/${standardId}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="font-semibold">{standard.title}</h1>
                <p className="text-sm text-muted-foreground">{standard.code}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Progreso</p>
              <p className="text-lg font-bold">
                {enrollment.progressPercentage || 0}%
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container py-6">
        <Tabs defaultValue={tab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="modules" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Módulos</span>
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Portafolio</span>
            </TabsTrigger>
            <TabsTrigger
              value="assessments"
              className="flex items-center gap-2"
            >
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Evaluaciones</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              <span className="hidden sm:inline">Progreso</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="modules" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Module List */}
              <div className="lg:col-span-1">
                <ModuleList
                  modules={standard.modules || []}
                  moduleProgress={enrollment.moduleProgress}
                  lessonProgress={enrollment.lessonProgress}
                  currentLessonId={currentLesson?.id}
                  onLessonClick={(lesson, moduleId) =>
                    handleLessonSelect(lesson, moduleId)
                  }
                />
              </div>

              {/* Lesson Viewer */}
              <div className="lg:col-span-2">
                {currentLesson && currentModule ? (
                  <LessonViewer
                    lesson={currentLesson}
                    module={currentModule}
                    onComplete={() => handleLessonComplete(currentLesson.id)}
                    onVideoProgress={(progress) => {
                      handleVideoProgress(currentLesson.id, progress, 0);
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-96 border rounded-lg bg-muted/50">
                    <div className="text-center">
                      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold">Selecciona una lección</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Elige una lección del panel izquierdo para comenzar
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="portfolio">
            <PortfolioDashboard
              enrollmentId={enrollment.id}
              ecStandardId={standardId}
              onCreateDocument={(template) => {
                router.push(
                  `/training/${standardId}/portfolio/new?templateId=${template.id}`,
                );
              }}
              onEditDocument={(doc) => {
                router.push(`/training/${standardId}/portfolio/${doc.id}`);
              }}
              onViewDocument={(doc) => {
                router.push(
                  `/training/${standardId}/portfolio/${doc.id}?view=true`,
                );
              }}
            />
          </TabsContent>

          <TabsContent value="assessments">
            <div className="text-center py-12">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg">
                Evaluaciones del estándar
              </h3>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                Completa las evaluaciones de cada módulo para demostrar tu
                competencia
              </p>
              <Button
                className="mt-6"
                onClick={() =>
                  router.push(`/training/${standardId}/assessments`)
                }
              >
                Ver evaluaciones disponibles
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="progress">
            <ProgressDashboard
              enrollmentId={enrollment.id}
              onContinueLearning={(lessonId) => {
                ecApi.getLesson(lessonId).then((lesson) => {
                  setCurrentLesson(lesson);
                  router.push(`/training/${standardId}/learn?tab=modules`);
                });
              }}
              onViewModule={(moduleId) => {
                const module = standard.modules?.find((m) => m.id === moduleId);
                if (module?.lessons?.[0]) {
                  handleLessonSelect(module.lessons[0]);
                }
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
