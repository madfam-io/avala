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
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Download,
  Calendar,
  FileSpreadsheet,
  Shield,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
} from "lucide-react";
import { ContextualCTA } from "../../_components";
import {
  DEMO_TENANT,
  DEMO_ANALYTICS,
  DEMO_COURSES,
} from "../../_data/demo-seed";

export function ExecutiveDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const {
    overview,
    lftPlanProgress,
    departmentProgress,
    courseCompletions,
    monthlyDC3,
  } = DEMO_ANALYTICS;

  // Calculate ROI metrics
  const costPerTrainee = lftPlanProgress.spentBudget / overview.trainedThisYear;
  const complianceSavings = overview.complianceRate * 5000; // Estimated savings from compliance
  const roi =
    ((complianceSavings - lftPlanProgress.spentBudget) /
      lftPlanProgress.spentBudget) *
    100;

  return (
    <div className="container py-6 space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Ejecutivo</h1>
          <p className="text-muted-foreground">
            {DEMO_TENANT.name} — Métricas de Capacitación y Cumplimiento
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Q1 2025
          </Button>
          <Button variant="outline">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exportar SIRCE
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Reporte PDF
          </Button>
        </div>
      </div>

      {/* Executive KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700"
              >
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +3%
              </Badge>
            </div>
            <div className="text-3xl font-bold text-green-700">
              {overview.complianceRate}%
            </div>
            <div className="text-sm text-muted-foreground">
              Cumplimiento STPS
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +15%
              </Badge>
            </div>
            <div className="text-3xl font-bold text-blue-700">
              {overview.trainedThisYear}
            </div>
            <div className="text-sm text-muted-foreground">
              Capacitados 2025
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <Badge
                variant="secondary"
                className="bg-purple-100 text-purple-700"
              >
                <ArrowDownRight className="h-3 w-3 mr-1" />
                -8%
              </Badge>
            </div>
            <div className="text-3xl font-bold text-purple-700">
              ${costPerTrainee.toFixed(0)}
            </div>
            <div className="text-sm text-muted-foreground">
              Costo por Capacitado
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-700"
              >
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +12%
              </Badge>
            </div>
            <div className="text-3xl font-bold text-amber-700">
              {roi.toFixed(0)}%
            </div>
            <div className="text-sm text-muted-foreground">
              ROI Capacitación
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="compliance">Cumplimiento</TabsTrigger>
          <TabsTrigger value="investment">Inversión</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Monthly DC-3 Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  DC-3 Generados por Mes
                </CardTitle>
                <CardDescription>
                  Tendencia anual de certificaciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 h-48">
                  {monthlyDC3.map((item, i) => (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <div
                        className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                        style={{ height: `${(item.count / 25) * 100}%` }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {item.month}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div>
                    <div className="text-2xl font-bold">
                      {overview.dc3Generated}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total DC-3 2025
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-700"
                  >
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +24% vs 2024
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Department Compliance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Cumplimiento por Departamento
                </CardTitle>
                <CardDescription>
                  Estado de capacitación por área
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {departmentProgress.map((dept) => (
                  <div key={dept.department} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{dept.department}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {dept.trained}/{dept.total}
                        </span>
                        <Badge
                          variant="secondary"
                          className={
                            dept.compliance >= 90
                              ? "bg-green-100 text-green-700"
                              : dept.compliance >= 70
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                          }
                        >
                          {dept.compliance}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={dept.compliance} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Course Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Desempeño por Curso</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Curso</TableHead>
                    <TableHead>Completaciones</TableHead>
                    <TableHead>Promedio</TableHead>
                    <TableHead>Tendencia</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courseCompletions.map((course, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        {course.course}
                      </TableCell>
                      <TableCell>{course.completions}</TableCell>
                      <TableCell>
                        <span
                          className={
                            course.avgScore >= 85
                              ? "text-green-600 font-medium"
                              : course.avgScore >= 70
                                ? "text-amber-600 font-medium"
                                : "text-red-600 font-medium"
                          }
                        >
                          {course.avgScore}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700"
                        >
                          <ArrowUpRight className="h-3 w-3 mr-1" />+
                          {Math.floor(Math.random() * 15) + 5}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Activo</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <ContextualCTA role="executive" />
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">
                  Estado de Cumplimiento Normativo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-green-600" />
                        <span className="font-semibold">LFT Art. 153</span>
                      </div>
                      <Badge className="bg-green-600">Cumplido</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Plan anual de capacitación registrado y en ejecución
                      conforme a la Ley Federal del Trabajo.
                    </p>
                    <Progress
                      value={
                        (lftPlanProgress.completedCourses /
                          lftPlanProgress.plannedCourses) *
                        100
                      }
                      className="h-2 mt-3"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {lftPlanProgress.completedCourses}/
                      {lftPlanProgress.plannedCourses} cursos del plan
                      completados
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-green-600" />
                        <span className="font-semibold">DC-3 STPS</span>
                      </div>
                      <Badge className="bg-green-600">Al día</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Constancias de habilidades laborales emitidas para todo el
                      personal capacitado.
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <div>
                        <div className="text-2xl font-bold">
                          {overview.dc3Generated}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          DC-3 emitidos
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {overview.credentialsIssued}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Credenciales OB3
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold">Reporte SIRCE</span>
                      </div>
                      <Badge variant="outline">Próximo: Abr 2025</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Exportación trimestral de registros al Sistema de Registro
                      de Cursos de Capacitación.
                    </p>
                    <Button variant="outline" size="sm" className="mt-3">
                      <Download className="mr-2 h-4 w-4" />
                      Generar SIRCE Q1
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Riesgo de Incumplimiento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-6">
                  <div className="text-5xl font-bold text-green-600 mb-2">
                    Bajo
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Nivel de riesgo actual
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded bg-green-50">
                    <span className="text-sm">Plan LFT</span>
                    <Badge className="bg-green-600">OK</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-green-50">
                    <span className="text-sm">DC-3 actualizados</span>
                    <Badge className="bg-green-600">OK</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-amber-50">
                    <span className="text-sm">Capacitación NOM</span>
                    <Badge className="bg-amber-600">Revisar</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="investment" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Budget Overview */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">
                  Ejecución Presupuestal 2025
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-3xl font-bold">
                      ${(lftPlanProgress.plannedBudget / 1000).toFixed(0)}K
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Presupuesto
                    </div>
                  </div>
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <div className="text-3xl font-bold text-primary">
                      ${(lftPlanProgress.spentBudget / 1000).toFixed(0)}K
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Ejecutado
                    </div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">
                      $
                      {(
                        (lftPlanProgress.plannedBudget -
                          lftPlanProgress.spentBudget) /
                        1000
                      ).toFixed(0)}
                      K
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Disponible
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Ejecución presupuestal</span>
                    <span>
                      {(
                        (lftPlanProgress.spentBudget /
                          lftPlanProgress.plannedBudget) *
                        100
                      ).toFixed(0)}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      (lftPlanProgress.spentBudget /
                        lftPlanProgress.plannedBudget) *
                      100
                    }
                    className="h-3"
                  />
                </div>
              </CardContent>
            </Card>

            {/* ROI Card */}
            <Card className="bg-gradient-to-br from-primary/5 to-blue-500/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Retorno de Inversión</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">
                    {roi.toFixed(0)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ROI estimado
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Ahorro cumplimiento
                    </span>
                    <span className="font-medium">
                      ${(complianceSavings / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Inversión</span>
                    <span className="font-medium">
                      ${(lftPlanProgress.spentBudget / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">
                      Beneficio neto
                    </span>
                    <span className="font-bold text-green-600">
                      $
                      {(
                        (complianceSavings - lftPlanProgress.spentBudget) /
                        1000
                      ).toFixed(0)}
                      K
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cost Analysis Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Análisis de Costos por Programa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Programa</TableHead>
                    <TableHead>Participantes</TableHead>
                    <TableHead>Inversión</TableHead>
                    <TableHead>Costo/Persona</TableHead>
                    <TableHead>Completación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DEMO_COURSES.slice(0, 4).map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">
                        {course.title}
                      </TableCell>
                      <TableCell>
                        {Math.floor(Math.random() * 30) + 10}
                      </TableCell>
                      <TableCell>
                        ${((Math.random() * 50 + 20) * 1000).toFixed(0)}
                      </TableCell>
                      <TableCell>
                        ${(Math.random() * 1500 + 500).toFixed(0)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700"
                        >
                          {Math.floor(Math.random() * 20) + 80}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reportes Disponibles</CardTitle>
              <CardDescription>
                Genera y descarga reportes ejecutivos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    name: "Reporte SIRCE Q1 2025",
                    type: "SIRCE",
                    icon: FileSpreadsheet,
                    ready: true,
                  },
                  {
                    name: "Dashboard Ejecutivo",
                    type: "PDF",
                    icon: BarChart3,
                    ready: true,
                  },
                  {
                    name: "Cumplimiento LFT",
                    type: "PDF",
                    icon: Shield,
                    ready: true,
                  },
                  {
                    name: "ROI Capacitación",
                    type: "Excel",
                    icon: TrendingUp,
                    ready: true,
                  },
                  {
                    name: "DC-3 Emitidos",
                    type: "CSV",
                    icon: Award,
                    ready: true,
                  },
                  {
                    name: "Análisis de Brechas",
                    type: "PDF",
                    icon: PieChart,
                    ready: false,
                  },
                ].map((report, i) => (
                  <Card key={i} className={!report.ready ? "opacity-60" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <report.icon className="h-5 w-5" />
                        </div>
                        <Badge variant="outline">{report.type}</Badge>
                      </div>
                      <h3 className="font-medium mb-2">{report.name}</h3>
                      <Button
                        variant={report.ready ? "default" : "outline"}
                        size="sm"
                        className="w-full"
                        disabled={!report.ready}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {report.ready ? "Descargar" : "Próximamente"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
