"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BookOpen,
  Users,
  ClipboardCheck,
  Plus,
  Play,
  Edit,
  Eye,
  Clock,
  CheckCircle2,
  Award,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import { ContextualCTA } from "../../_components";
import {
  DEMO_COURSES,
  DEMO_ENROLLMENTS,
  DEMO_ASSESSMENTS,
  getUserById,
  getCourseById,
} from "../../_data/demo-seed";

export function InstructorDashboard() {
  const [activeTab, setActiveTab] = useState("courses");

  // Filter courses for this instructor
  const myCourses = DEMO_COURSES.filter(
    (c) => c.instructorId === "user-inst-001",
  );
  const pendingAssessments = DEMO_ASSESSMENTS.filter(
    (a) => a.status === "PENDING",
  );

  return (
    <div className="container py-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Hola, Carlos</h1>
          <p className="text-muted-foreground">
            Panel de Instructor — Gestiona tus cursos y evaluaciones
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            Reportes
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Curso
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{myCourses.length}</div>
                <div className="text-xs text-muted-foreground">
                  Cursos Activos
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {
                    DEMO_ENROLLMENTS.filter((e) =>
                      myCourses.some((c) => c.id === e.courseId),
                    ).length
                  }
                </div>
                <div className="text-xs text-muted-foreground">
                  Alumnos Inscritos
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <ClipboardCheck className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-700">
                  {pendingAssessments.length}
                </div>
                <div className="text-xs text-muted-foreground">Por Evaluar</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">87%</div>
                <div className="text-xs text-muted-foreground">
                  Tasa Aprobación
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="courses">Mis Cursos</TabsTrigger>
          <TabsTrigger value="assessments" className="relative">
            Evaluaciones
            {pendingAssessments.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {pendingAssessments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="students">Alumnos</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {myCourses.map((course) => {
              const enrollments = DEMO_ENROLLMENTS.filter(
                (e) => e.courseId === course.id,
              );
              const completed = enrollments.filter(
                (e) => e.status === "COMPLETED",
              ).length;
              const inProgress = enrollments.filter(
                (e) => e.status === "IN_PROGRESS",
              ).length;
              const totalLessons = course.modules.reduce(
                (acc, m) => acc + m.lessons.length,
                0,
              );

              return (
                <Card key={course.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{course.thumbnail}</div>
                        <div>
                          <Badge variant="outline" className="mb-1">
                            {course.code}
                          </Badge>
                          <CardTitle className="text-lg">
                            {course.title}
                          </CardTitle>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {course.ecCode && (
                      <Badge className="bg-primary/10 text-primary">
                        {course.ecCode} — {course.ecName}
                      </Badge>
                    )}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-2 bg-muted/50 rounded-lg">
                        <div className="font-bold">{course.modules.length}</div>
                        <div className="text-xs text-muted-foreground">
                          Módulos
                        </div>
                      </div>
                      <div className="p-2 bg-muted/50 rounded-lg">
                        <div className="font-bold">{totalLessons}</div>
                        <div className="text-xs text-muted-foreground">
                          Lecciones
                        </div>
                      </div>
                      <div className="p-2 bg-muted/50 rounded-lg">
                        <div className="font-bold">{course.durationHours}h</div>
                        <div className="text-xs text-muted-foreground">
                          Duración
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Alumnos inscritos</span>
                        <span>{enrollments.length}</span>
                      </div>
                      <div className="flex gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {completed} completados
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-700"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {inProgress} en curso
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1">
                        <Eye className="mr-2 h-4 w-4" />
                        Ver
                      </Button>
                      <Button className="flex-1">
                        <Play className="mr-2 h-4 w-4" />
                        Impartir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <ContextualCTA role="instructor" />
        </TabsContent>

        <TabsContent value="assessments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evaluaciones Pendientes</CardTitle>
              <CardDescription>
                Revisa y califica las entregas de tus alumnos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingAssessments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>¡No hay evaluaciones pendientes!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingAssessments.map((assessment) => {
                    const trainee = getUserById(assessment.traineeId);
                    const course = getCourseById(assessment.courseId);
                    return (
                      <div
                        key={assessment.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-amber-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-2xl">{trainee?.avatar}</div>
                          <div>
                            <div className="font-medium">
                              {trainee?.firstName} {trainee?.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {course?.title}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">
                                {assessment.type === "QUIZ"
                                  ? "Examen"
                                  : assessment.type === "SIMULATION"
                                    ? "Simulación"
                                    : "Práctica"}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Entregado: {assessment.submittedAt}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Entrega
                          </Button>
                          <Button size="sm">
                            <ClipboardCheck className="mr-2 h-4 w-4" />
                            Calificar
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evaluaciones Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alumno</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Calificación</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DEMO_ASSESSMENTS.filter((a) => a.status === "GRADED").map(
                    (assessment) => {
                      const trainee = getUserById(assessment.traineeId);
                      const course = getCourseById(assessment.courseId);
                      return (
                        <TableRow key={assessment.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{trainee?.avatar}</span>
                              <span>
                                {trainee?.firstName} {trainee?.lastName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {course?.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {assessment.type === "QUIZ"
                                ? "Examen"
                                : "Práctica"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                (assessment.score || 0) >= 80
                                  ? "text-green-600 font-medium"
                                  : (assessment.score || 0) >= 60
                                    ? "text-amber-600 font-medium"
                                    : "text-red-600 font-medium"
                              }
                            >
                              {assessment.score}%
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {assessment.gradedAt}
                          </TableCell>
                        </TableRow>
                      );
                    },
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mis Alumnos</CardTitle>
              <CardDescription>
                Seguimiento del progreso de alumnos en tus cursos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alumno</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead>Última Actividad</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DEMO_ENROLLMENTS.filter((e) =>
                    myCourses.some((c) => c.id === e.courseId),
                  ).map((enrollment) => {
                    const trainee = getUserById(enrollment.odlUserId);
                    const course = getCourseById(enrollment.courseId);
                    return (
                      <TableRow key={enrollment.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{trainee?.avatar}</span>
                            <div>
                              <div className="font-medium">
                                {trainee?.firstName} {trainee?.lastName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {trainee?.department}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[150px]">
                          <div className="truncate">{course?.title}</div>
                        </TableCell>
                        <TableCell>
                          <div className="w-32 space-y-1">
                            <Progress
                              value={enrollment.progress}
                              className="h-2"
                            />
                            <div className="text-xs text-muted-foreground text-right">
                              {enrollment.progress}%
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {enrollment.enrolledAt}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Ver progreso"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Enviar mensaje"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
