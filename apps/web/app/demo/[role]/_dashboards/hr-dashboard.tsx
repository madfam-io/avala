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
  Shield,
  FileText,
  Users,
  TrendingUp,
  Download,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Calendar,
  Award,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import { ContextualCTA } from "../../_components";
import {
  DEMO_TENANT,
  DEMO_COURSES,
  DEMO_ENROLLMENTS,
  DEMO_DC3S,
  DEMO_ANALYTICS,
  getTrainees,
  getCourseById,
  getUserById,
} from "../../_data/demo-seed";

export function HRDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const trainees = getTrainees();

  return (
    <div className="container py-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Bienvenida, Laura</h1>
          <p className="text-muted-foreground">
            Panel de Gestión de Capacitación — {DEMO_TENANT.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar SIRCE
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Inscripción
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {DEMO_ANALYTICS.overview.complianceRate}%
                </div>
                <div className="text-xs text-muted-foreground">
                  Cumplimiento STPS
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {DEMO_ANALYTICS.overview.dc3Generated}
                </div>
                <div className="text-xs text-muted-foreground">
                  DC-3 este año
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {DEMO_ANALYTICS.overview.trainedThisYear}
                </div>
                <div className="text-xs text-muted-foreground">
                  Capacitados 2025
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {DEMO_ANALYTICS.overview.completionRate}%
                </div>
                <div className="text-xs text-muted-foreground">
                  Tasa completación
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="compliance">Cumplimiento</TabsTrigger>
          <TabsTrigger value="dc3">DC-3</TabsTrigger>
          <TabsTrigger value="team">Equipo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Department Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Progreso por Departamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {DEMO_ANALYTICS.departmentProgress.map((dept) => (
                  <div key={dept.department} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{dept.department}</span>
                      <span className="text-muted-foreground">
                        {dept.trained}/{dept.total} ({dept.compliance}%)
                      </span>
                    </div>
                    <Progress value={dept.compliance} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent DC-3 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">DC-3 Recientes</CardTitle>
                <Button variant="ghost" size="sm">
                  Ver todos
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {DEMO_DC3S.slice(0, 4).map((dc3) => {
                    const trainee = getUserById(dc3.traineeId);
                    const course = getCourseById(dc3.courseId);
                    return (
                      <div
                        key={dc3.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{trainee?.avatar}</div>
                          <div>
                            <div className="font-medium text-sm">
                              {trainee?.firstName} {trainee?.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {course?.title}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-700"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Válido
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {dc3.odlSerial}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* LFT Plan Progress */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Plan Anual LFT 2025</CardTitle>
                  <CardDescription>
                    Seguimiento del plan de capacitación conforme Art. 153 LFT
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  Ver Plan Completo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Cursos</div>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold">
                      {DEMO_ANALYTICS.lftPlanProgress.completedCourses}
                    </span>
                    <span className="text-muted-foreground mb-1">
                      / {DEMO_ANALYTICS.lftPlanProgress.plannedCourses}
                    </span>
                  </div>
                  <Progress
                    value={
                      (DEMO_ANALYTICS.lftPlanProgress.completedCourses /
                        DEMO_ANALYTICS.lftPlanProgress.plannedCourses) *
                      100
                    }
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Horas</div>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold">
                      {DEMO_ANALYTICS.lftPlanProgress.completedHours}
                    </span>
                    <span className="text-muted-foreground mb-1">
                      / {DEMO_ANALYTICS.lftPlanProgress.plannedHours} hrs
                    </span>
                  </div>
                  <Progress
                    value={
                      (DEMO_ANALYTICS.lftPlanProgress.completedHours /
                        DEMO_ANALYTICS.lftPlanProgress.plannedHours) *
                      100
                    }
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Presupuesto
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold">
                      $
                      {(
                        DEMO_ANALYTICS.lftPlanProgress.spentBudget / 1000
                      ).toFixed(0)}
                      K
                    </span>
                    <span className="text-muted-foreground mb-1">
                      / $
                      {(
                        DEMO_ANALYTICS.lftPlanProgress.plannedBudget / 1000
                      ).toFixed(0)}
                      K
                    </span>
                  </div>
                  <Progress
                    value={
                      (DEMO_ANALYTICS.lftPlanProgress.spentBudget /
                        DEMO_ANALYTICS.lftPlanProgress.plannedBudget) *
                      100
                    }
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <ContextualCTA role="hr" />
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">
                  Estado de Cumplimiento por Curso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Curso</TableHead>
                      <TableHead>EC</TableHead>
                      <TableHead>Completados</TableHead>
                      <TableHead>DC-3</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {DEMO_COURSES.map((course) => {
                      const completions = DEMO_ENROLLMENTS.filter(
                        (e) =>
                          e.courseId === course.id && e.status === "COMPLETED",
                      ).length;
                      const dc3Count = DEMO_DC3S.filter(
                        (d) => d.courseId === course.id,
                      ).length;
                      return (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">
                            {course.title}
                          </TableCell>
                          <TableCell>
                            {course.ecCode ? (
                              <Badge variant="outline">{course.ecCode}</Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>{completions}</TableCell>
                          <TableCell>{dc3Count}</TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                dc3Count >= completions
                                  ? "bg-green-100 text-green-700"
                                  : "bg-amber-100 text-amber-700"
                              }
                            >
                              {dc3Count >= completions ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Completo
                                </>
                              ) : (
                                <>
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pendiente
                                </>
                              )}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exportar SIRCE Q1
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Generar DC-3 Masivo
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Actualizar Plan LFT
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Ver Pendientes
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dc3" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Constancias DC-3 Emitidas
                </CardTitle>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Generar DC-3
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Folio</TableHead>
                    <TableHead>Trabajador</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DEMO_DC3S.map((dc3) => {
                    const trainee = getUserById(dc3.traineeId);
                    const course = getCourseById(dc3.courseId);
                    return (
                      <TableRow key={dc3.id}>
                        <TableCell className="font-mono text-sm">
                          {dc3.odlSerial}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{trainee?.avatar}</span>
                            <span>
                              {trainee?.firstName} {trainee?.lastName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {course?.title}
                        </TableCell>
                        <TableCell>{dc3.issuedAt}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              dc3.status === "ISSUED"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }
                          >
                            {dc3.status === "ISSUED" ? "Válido" : "Revocado"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Download className="h-4 w-4" />
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

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Equipo de Trabajo</CardTitle>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Colaborador
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Cursos</TableHead>
                    <TableHead>Credenciales</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainees.map((trainee) => {
                    const enrollments = DEMO_ENROLLMENTS.filter(
                      (e) => e.odlUserId === trainee.id,
                    );
                    const completed = enrollments.filter(
                      (e) => e.status === "COMPLETED",
                    ).length;
                    const inProgress = enrollments.filter(
                      (e) => e.status === "IN_PROGRESS",
                    ).length;
                    const dc3s = DEMO_DC3S.filter(
                      (d) => d.traineeId === trainee.id,
                    ).length;
                    return (
                      <TableRow key={trainee.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{trainee.avatar}</span>
                            <div>
                              <div className="font-medium">
                                {trainee.firstName} {trainee.lastName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {trainee.jobTitle}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{trainee.department}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {completed} completados
                            </Badge>
                            {inProgress > 0 && (
                              <Badge variant="outline">
                                {inProgress} en curso
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Award className="h-4 w-4 text-amber-500" />
                            <span>{dc3s}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              inProgress > 0
                                ? "bg-blue-100 text-blue-700"
                                : "bg-green-100 text-green-700"
                            }
                          >
                            {inProgress > 0 ? "En capacitación" : "Al día"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
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
