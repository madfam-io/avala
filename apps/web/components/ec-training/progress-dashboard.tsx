"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Clock,
  Award,
  TrendingUp,
  Target,
  CheckCircle,
  Play,
  Trophy,
  Flame,
  Star,
} from "lucide-react";
import { trainingApi, type ECEnrollment } from "@/lib/api/ec-api";

interface ProgressStats {
  totalModules: number;
  completedModules: number;
  totalLessons: number;
  completedLessons: number;
  totalAssessments: number;
  passedAssessments: number;
  totalTimeSpent: number;
  currentStreak: number;
  points: number;
  overallProgress: number;
}

interface ModuleProgress {
  id: string;
  name: string;
  progress: number;
  lessonsCompleted: number;
  totalLessons: number;
  assessmentPassed: boolean;
}

interface ProgressDashboardProps {
  enrollmentId: string;
  onContinueLearning?: (lessonId: string) => void;
  onViewModule?: (moduleId: string) => void;
}

export function ProgressDashboard({
  enrollmentId,
  onContinueLearning,
  onViewModule,
}: ProgressDashboardProps) {
  const [enrollment, setEnrollment] = useState<ECEnrollment | null>(null);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
  }, [enrollmentId]);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      const enrollmentData = await trainingApi.getEnrollment(enrollmentId);
      setEnrollment(enrollmentData);

      // Calculate stats from enrollment data
      const progress =
        (
          enrollmentData as unknown as {
            progress?: {
              modules?: ModuleProgress[];
              totalTimeSpent?: number;
              streak?: number;
              points?: number;
            };
          }
        ).progress || {};
      const modules = progress.modules || enrollmentData.moduleProgress || [];

      const calculatedStats: ProgressStats = {
        totalModules: modules.length,
        completedModules: modules.filter(
          (m: ModuleProgress) => m.progress === 100,
        ).length,
        totalLessons: modules.reduce(
          (acc: number, m: ModuleProgress) =>
            acc +
            ((m as unknown as { totalLessons?: number }).totalLessons || 0),
          0,
        ),
        completedLessons: modules.reduce(
          (acc: number, m: ModuleProgress) =>
            acc +
            ((m as unknown as { lessonsCompleted?: number }).lessonsCompleted ||
              0),
          0,
        ),
        totalAssessments: modules.length,
        passedAssessments: modules.filter(
          (m: ModuleProgress) =>
            (m as unknown as { assessmentPassed?: boolean }).assessmentPassed,
        ).length,
        totalTimeSpent: progress.totalTimeSpent || 0,
        currentStreak: progress.streak || 0,
        points: progress.points || 0,
        overallProgress:
          enrollmentData.progressPercentage ||
          enrollmentData.overallProgress ||
          0,
      };

      setStats(calculatedStats);
      // Map to local ModuleProgress type
      const localModules: ModuleProgress[] = modules.map((m) => ({
        id: m.id || (m as unknown as { moduleId?: string }).moduleId || "",
        name:
          (m as unknown as { name?: string }).name ||
          m.module?.title ||
          "Module",
        progress: m.progress || 0,
        lessonsCompleted:
          (m as unknown as { lessonsCompleted?: number }).lessonsCompleted || 0,
        totalLessons:
          (m as unknown as { totalLessons?: number }).totalLessons || 0,
        assessmentPassed:
          (m as unknown as { assessmentPassed?: boolean }).assessmentPassed ||
          false,
      }));
      setModuleProgress(localModules);
    } catch (error) {
      console.error("Error loading progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No se encontró información de progreso
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Progress Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Tu progreso</h2>
              <p className="text-muted-foreground mb-4">
                {enrollment?.ec?.title || "Estándar de Competencia"}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progreso general</span>
                  <span className="font-semibold">
                    {stats.overallProgress}%
                  </span>
                </div>
                <Progress value={stats.overallProgress} className="h-3" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="text-5xl font-bold text-primary">
                {stats.overallProgress}%
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-1">
                {stats.overallProgress < 25
                  ? "Iniciando"
                  : stats.overallProgress < 50
                    ? "En progreso"
                    : stats.overallProgress < 75
                      ? "Avanzando"
                      : stats.overallProgress < 100
                        ? "Casi listo"
                        : "¡Completado!"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats.completedLessons}/{stats.totalLessons}
                </p>
                <p className="text-sm text-muted-foreground">Lecciones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats.passedAssessments}/{stats.totalAssessments}
                </p>
                <p className="text-sm text-muted-foreground">Evaluaciones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatTime(stats.totalTimeSpent)}
                </p>
                <p className="text-sm text-muted-foreground">Tiempo total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <Flame className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.currentStreak}</p>
                <p className="text-sm text-muted-foreground">Días de racha</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Points and Achievements */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Puntos acumulados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-center text-yellow-600">
              {stats.points.toLocaleString()}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-2">
              puntos de experiencia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-purple-500" />
              Logros desbloqueados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center gap-2">
              {stats.completedLessons >= 1 && (
                <Badge className="bg-green-100 text-green-800">
                  Primera lección
                </Badge>
              )}
              {stats.currentStreak >= 3 && (
                <Badge className="bg-orange-100 text-orange-800">
                  Racha de 3 días
                </Badge>
              )}
              {stats.passedAssessments >= 1 && (
                <Badge className="bg-blue-100 text-blue-800">
                  Primera evaluación
                </Badge>
              )}
              {stats.overallProgress >= 50 && (
                <Badge className="bg-purple-100 text-purple-800">
                  Mitad del camino
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso por módulo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {moduleProgress.map((module, idx) => (
              <div
                key={module.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        module.progress === 100
                          ? "bg-green-100 text-green-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {module.progress === 100 ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium">{module.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {module.lessonsCompleted} de {module.totalLessons}{" "}
                        lecciones
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {module.assessmentPassed && (
                      <Badge variant="outline" className="text-green-600">
                        <Award className="h-3 w-3 mr-1" />
                        Aprobado
                      </Badge>
                    )}
                    <span className="font-semibold">{module.progress}%</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewModule?.(module.id)}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Progress value={module.progress} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Continue Learning CTA */}
      {enrollment?.currentLessonId && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Continúa donde te quedaste</h3>
                  <p className="text-sm text-muted-foreground">
                    Retoma tu último progreso
                  </p>
                </div>
              </div>
              <Button
                onClick={() =>
                  onContinueLearning?.(enrollment.currentLessonId!)
                }
              >
                <Play className="h-4 w-4 mr-2" />
                Continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
