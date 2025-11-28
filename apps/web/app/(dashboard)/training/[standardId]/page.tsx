"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  FileText,
  Award,
  Clock,
  Users,
  ArrowLeft,
  Play,
} from "lucide-react";
import {
  ecApi,
  trainingApi,
  type ECStandard,
  type ECModule,
  type ECElement,
} from "@/lib/api/ec-api";

type ExtendedStandard = ECStandard & {
  modules?: ECModule[];
  elements?: ECElement[];
};

export default function StandardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const standardId = params.standardId as string;

  const [standard, setStandard] = useState<ExtendedStandard | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [, setEnrollmentId] = useState<string | null>(null);

  useEffect(() => {
    loadStandardData();
  }, [standardId]);

  const loadStandardData = async () => {
    try {
      setLoading(true);
      const standardData = await ecApi.getStandard(standardId);
      setStandard(standardData);

      // Check if user is enrolled - using a mock userId for now
      // In production, get userId from auth context
      try {
        const enrollment = await trainingApi.getEnrollmentByUserAndEC(
          "current-user",
          standardId,
        );
        if (enrollment) {
          setIsEnrolled(true);
          setEnrollmentId(enrollment.id);
        }
      } catch {
        // Not enrolled - that's fine
        setIsEnrolled(false);
      }
    } catch (error) {
      console.error("Error loading standard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      // In production, get userId and tenantId from auth context
      const enrollment = await trainingApi.enroll({
        userId: "current-user",
        ecCode: standardId,
        tenantId: "default-tenant",
      });
      setIsEnrolled(true);
      setEnrollmentId(enrollment.id);
      router.push(`/training/${standardId}/learn`);
    } catch (error) {
      console.error("Error enrolling:", error);
    } finally {
      setEnrolling(false);
    }
  };

  const handleContinue = () => {
    router.push(`/training/${standardId}/learn`);
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

  if (!standard) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Estándar no encontrado</h2>
          <Button
            variant="link"
            onClick={() => router.push("/training")}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al catálogo
          </Button>
        </div>
      </div>
    );
  }

  const modules = standard.modules || [];
  const totalLessons = modules.reduce(
    (acc: number, m: ECModule) => acc + (m.lessons?.length || 0),
    0,
  );

  return (
    <div className="container py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/training")}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver al catálogo
      </Button>

      {/* Header */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <Badge variant="outline" className="mb-2">
              {standard.code}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight">
              {standard.title}
            </h1>
            <p className="text-muted-foreground mt-2">{standard.description}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <BookOpen className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">{modules.length}</p>
                <p className="text-sm text-muted-foreground">Módulos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">{totalLessons}</p>
                <p className="text-sm text-muted-foreground">Lecciones</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">
                  {standard.estimatedHours || "--"}
                </p>
                <p className="text-sm text-muted-foreground">Horas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">
                  {standard._count?.enrollments || 0}
                </p>
                <p className="text-sm text-muted-foreground">Inscritos</p>
              </CardContent>
            </Card>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="content" className="space-y-4">
            <TabsList>
              <TabsTrigger value="content">Contenido</TabsTrigger>
              <TabsTrigger value="elements">Elementos</TabsTrigger>
              <TabsTrigger value="requirements">Requisitos</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              {modules.map((module: ECModule, idx: number) => (
                <Card key={module.id}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {idx + 1}
                      </span>
                      {module.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      {module.description}
                    </p>
                    <div className="space-y-2">
                      {module.lessons?.map((lesson, lessonIdx) => (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                        >
                          <span className="text-sm text-muted-foreground">
                            {idx + 1}.{lessonIdx + 1}
                          </span>
                          <span>{lesson.title}</span>
                          {lesson.estimatedMinutes && (
                            <Badge variant="secondary" className="ml-auto">
                              {lesson.estimatedMinutes} min
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="elements" className="space-y-4">
              {standard.elements?.map((element: ECElement) => (
                <Card key={element.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{element.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {element.description}
                    </p>
                    {element.performanceCriteria &&
                      element.performanceCriteria.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">
                            Criterios de desempeño:
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            {element.performanceCriteria.map(
                              (criterion: string, idx: number) => (
                                <li key={idx}>{criterion}</li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="requirements">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Requisitos previos</h4>
                      <p className="text-muted-foreground">
                        No se requieren conocimientos previos
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Certificación</h4>
                      <p className="text-muted-foreground">
                        Al completar este estándar, podrás obtener la
                        certificación oficial de CONOCER en {standard.code}.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {standard.thumbnailUrl && (
                  <div className="aspect-video rounded-lg bg-muted overflow-hidden">
                    <img
                      src={standard.thumbnailUrl}
                      alt={standard.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {isEnrolled ? (
                  <Button className="w-full" size="lg" onClick={handleContinue}>
                    <Play className="h-5 w-5 mr-2" />
                    Continuar aprendiendo
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleEnroll}
                    disabled={enrolling}
                  >
                    {enrolling ? "Inscribiendo..." : "Inscribirme ahora"}
                  </Button>
                )}

                <div className="pt-4 border-t space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nivel</span>
                    <span className="font-medium">
                      {standard.level || "Básico"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duración</span>
                    <span className="font-medium">
                      {standard.estimatedHours || "--"} horas
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Certificación</span>
                    <span className="font-medium flex items-center gap-1">
                      <Award className="h-4 w-4 text-yellow-500" />
                      CONOCER
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
