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
  BookOpen,
  Award,
  Trophy,
  Play,
  CheckCircle2,
  Clock,
  Star,
  Flame,
  Share2,
  Download,
  ExternalLink,
  FileText,
  Medal,
} from "lucide-react";
import { ContextualCTA } from "../../_components";
import {
  DEMO_COURSES,
  DEMO_ENROLLMENTS,
  DEMO_CREDENTIALS,
  DEMO_DC3S,
  getUserById,
  getCourseById,
} from "../../_data/demo-seed";

// Trainee context - Miguel Hernández
const CURRENT_TRAINEE_ID = "user-trainee-001";

export function TraineeDashboard() {
  const [activeTab, setActiveTab] = useState("learning");

  const trainee = getUserById(CURRENT_TRAINEE_ID);
  const myEnrollments = DEMO_ENROLLMENTS.filter(
    (e) => e.odlUserId === CURRENT_TRAINEE_ID,
  );
  const myCredentials = DEMO_CREDENTIALS.filter(
    (c) => c.traineeId === CURRENT_TRAINEE_ID,
  );
  const myDC3s = DEMO_DC3S.filter((d) => d.traineeId === CURRENT_TRAINEE_ID);

  const completedCourses = myEnrollments.filter(
    (e) => e.status === "COMPLETED",
  ).length;
  const inProgressCourses = myEnrollments.filter(
    (e) => e.status === "IN_PROGRESS",
  );

  // Calculate XP and level (gamification)
  const totalXP = completedCourses * 500 + myCredentials.length * 200;
  const level = Math.floor(totalXP / 1000) + 1;
  const xpToNextLevel = 1000 - (totalXP % 1000);

  return (
    <div className="container py-6 space-y-6">
      {/* Welcome Header with Gamification */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="text-5xl">{trainee?.avatar}</div>
          <div>
            <h1 className="text-2xl font-bold">¡Hola, {trainee?.firstName}!</h1>
            <p className="text-muted-foreground">
              {trainee?.jobTitle} — {trainee?.department}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-700"
              >
                <Star className="h-3 w-3 mr-1" />
                Nivel {level}
              </Badge>
              <Badge variant="outline">
                <Flame className="h-3 w-3 mr-1 text-orange-500" />5 días de
                racha
              </Badge>
            </div>
          </div>
        </div>
        <Card className="w-full md:w-auto">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Experiencia</div>
                <div className="text-xl font-bold">{totalXP} XP</div>
                <Progress
                  value={(totalXP % 1000) / 10}
                  className="h-2 w-32 mt-1"
                />
                <div className="text-xs text-muted-foreground">
                  {xpToNextLevel} XP para nivel {level + 1}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
                <div className="text-2xl font-bold">
                  {inProgressCourses.length}
                </div>
                <div className="text-xs text-muted-foreground">En Progreso</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{completedCourses}</div>
                <div className="text-xs text-muted-foreground">Completados</div>
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
                <div className="text-2xl font-bold">{myCredentials.length}</div>
                <div className="text-xs text-muted-foreground">
                  Credenciales
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{myDC3s.length}</div>
                <div className="text-xs text-muted-foreground">
                  DC-3 Obtenidos
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="learning">Mi Aprendizaje</TabsTrigger>
          <TabsTrigger value="credentials">Credenciales</TabsTrigger>
          <TabsTrigger value="achievements">Logros</TabsTrigger>
        </TabsList>

        <TabsContent value="learning" className="space-y-6">
          {/* Continue Learning */}
          {inProgressCourses.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Continuar Aprendiendo</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {inProgressCourses.map((enrollment) => {
                  const course = getCourseById(enrollment.courseId);
                  if (!course) return null;
                  return (
                    <Card key={enrollment.id} className="overflow-hidden">
                      <div className="flex">
                        <div className="w-24 bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center text-4xl">
                          {course.thumbnail}
                        </div>
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <Badge variant="outline" className="mb-1">
                                {course.code}
                              </Badge>
                              <h3 className="font-semibold line-clamp-1">
                                {course.title}
                              </h3>
                            </div>
                          </div>
                          {course.ecCode && (
                            <Badge variant="secondary" className="mb-2 text-xs">
                              {course.ecCode}
                            </Badge>
                          )}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Progreso
                              </span>
                              <span className="font-medium">
                                {enrollment.progress}%
                              </span>
                            </div>
                            <Progress
                              value={enrollment.progress}
                              className="h-2"
                            />
                          </div>
                          <Button className="w-full mt-3" size="sm">
                            <Play className="mr-2 h-4 w-4" />
                            Continuar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed Courses */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Cursos Completados</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {myEnrollments
                .filter((e) => e.status === "COMPLETED")
                .map((enrollment) => {
                  const course = getCourseById(enrollment.courseId);
                  if (!course) return null;
                  return (
                    <Card key={enrollment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="text-3xl">{course.thumbnail}</div>
                          <div className="flex-1">
                            <div className="font-medium line-clamp-1">
                              {course.title}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Completado: {enrollment.completedAt}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-700"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {enrollment.score}%
                          </Badge>
                          <Button variant="ghost" size="sm">
                            Ver Certificado
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>

          {/* Recommended Courses */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Cursos Recomendados</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DEMO_COURSES.filter(
                (c) => !myEnrollments.some((e) => e.courseId === c.id),
              )
                .slice(0, 3)
                .map((course) => (
                  <Card
                    key={course.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="text-3xl">{course.thumbnail}</div>
                        <div>
                          <Badge variant="outline" className="mb-1">
                            {course.code}
                          </Badge>
                          <h3 className="font-medium">{course.title}</h3>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {course.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {course.durationHours}h
                        </div>
                        <Button size="sm">Inscribirse</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>

          <ContextualCTA role="trainee" />
        </TabsContent>

        <TabsContent value="credentials" className="space-y-6">
          {/* Open Badges */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Mis Credenciales Verificables
              </CardTitle>
              <CardDescription>
                Badges Open Badge 3.0 que puedes compartir y verificar
                públicamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {myCredentials.map((credential) => {
                  const course = getCourseById(credential.courseId);
                  return (
                    <Card
                      key={credential.id}
                      className="bg-gradient-to-br from-primary/5 to-blue-500/5 border-primary/20"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white">
                            <Medal className="h-8 w-8" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">
                              {credential.achievementName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {course?.title}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-700"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Verificado
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {credential.issuedAt}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <Share2 className="mr-2 h-4 w-4" />
                            Compartir
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Verificar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* DC-3 Certificates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-600" />
                Constancias DC-3
              </CardTitle>
              <CardDescription>
                Documentos oficiales de capacitación STPS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {myDC3s.map((dc3) => {
                  const course = getCourseById(dc3.courseId);
                  return (
                    <div
                      key={dc3.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-100">
                          <FileText className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <div className="font-medium">{course?.title}</div>
                          <div className="text-sm text-muted-foreground">
                            Folio: {dc3.odlSerial}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700"
                        >
                          Válido
                        </Badge>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mis Logros</CardTitle>
              <CardDescription>
                Reconocimientos por tu dedicación al aprendizaje
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    icon: "🎯",
                    name: "Primer Curso",
                    desc: "Completaste tu primer curso",
                    unlocked: true,
                  },
                  {
                    icon: "🔥",
                    name: "Racha 5 días",
                    desc: "5 días seguidos aprendiendo",
                    unlocked: true,
                  },
                  {
                    icon: "⭐",
                    name: "Excelencia",
                    desc: "Calificación 90%+",
                    unlocked: true,
                  },
                  {
                    icon: "🏆",
                    name: "Maestro CNC",
                    desc: "Completa EC0249",
                    unlocked: false,
                  },
                  {
                    icon: "📚",
                    name: "Aprendiz",
                    desc: "Completa 5 cursos",
                    unlocked: false,
                  },
                  {
                    icon: "🎓",
                    name: "Instructor",
                    desc: "Obtén EC0217",
                    unlocked: false,
                  },
                  {
                    icon: "💎",
                    name: "Diamante",
                    desc: "Alcanza nivel 10",
                    unlocked: false,
                  },
                  {
                    icon: "🌟",
                    name: "Leyenda",
                    desc: "1000+ XP",
                    unlocked: false,
                  },
                ].map((achievement, i) => (
                  <Card
                    key={i}
                    className={`text-center ${
                      achievement.unlocked
                        ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200"
                        : "opacity-50 grayscale"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="text-4xl mb-2">{achievement.icon}</div>
                      <div className="font-medium text-sm">
                        {achievement.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {achievement.desc}
                      </div>
                      {achievement.unlocked && (
                        <Badge
                          variant="secondary"
                          className="mt-2 bg-amber-100 text-amber-700"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Desbloqueado
                        </Badge>
                      )}
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
