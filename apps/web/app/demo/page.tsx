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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  PlayCircle,
  BookOpen,
  Video,
  Clock,
  Users,
  Award,
  GraduationCap,
  Lock,
  Sparkles,
  ArrowRight,
} from "lucide-react";

// ============================================================================
// Sample Course Data
// ============================================================================

interface DemoLesson {
  id: string;
  title: string;
  durationMin: number;
  videoUrl?: string;
  content?: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
}

interface DemoModule {
  id: string;
  title: string;
  lessons: DemoLesson[];
}

interface DemoCourse {
  id: string;
  code: string;
  title: string;
  description: string;
  instructor: string;
  totalLessons: number;
  totalDuration: string;
  enrolled: number;
  modules: DemoModule[];
  thumbnail: string;
}

const DEMO_COURSES: DemoCourse[] = [
  {
    id: "course-1",
    code: "MFG-101",
    title: "Introduction to 3D Printing for Engineers",
    description:
      "Learn the fundamentals of FDM, SLA, and SLS 3D printing technologies. Understand material selection, design considerations, and best practices for manufacturing.",
    instructor: "Dr. María García",
    totalLessons: 12,
    totalDuration: "4.5 hours",
    enrolled: 342,
    thumbnail: "🖨️",
    modules: [
      {
        id: "mod-1",
        title: "Module 1: Fundamentals of Additive Manufacturing",
        lessons: [
          {
            id: "lesson-1",
            title: "What is 3D Printing?",
            durationMin: 15,
            content: `# What is 3D Printing?

3D printing, also known as additive manufacturing, is a process of creating three-dimensional objects from a digital file by laying down successive layers of material.

## Key Concepts

- **Layer-by-layer construction**: Unlike traditional subtractive manufacturing
- **Digital design**: CAD files drive the printing process
- **Material versatility**: Plastics, metals, ceramics, and more

## Applications

1. Rapid prototyping
2. Custom manufacturing
3. Medical implants
4. Aerospace components
5. Consumer products`,
            status: "COMPLETED",
          },
          {
            id: "lesson-2",
            title: "FDM Technology Deep Dive",
            durationMin: 22,
            videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            content:
              "Fused Deposition Modeling (FDM) is the most common 3D printing technology...",
            status: "COMPLETED",
          },
          {
            id: "lesson-3",
            title: "SLA and Resin Printing",
            durationMin: 18,
            content:
              "Stereolithography (SLA) uses UV light to cure liquid resin into solid parts...",
            status: "IN_PROGRESS",
          },
        ],
      },
      {
        id: "mod-2",
        title: "Module 2: Materials Science",
        lessons: [
          {
            id: "lesson-4",
            title: "PLA vs ABS vs PETG",
            durationMin: 20,
            content:
              "Understanding the differences between common FDM materials...",
            status: "NOT_STARTED",
          },
          {
            id: "lesson-5",
            title: "Engineering-Grade Materials",
            durationMin: 25,
            content:
              "Nylon, Polycarbonate, and composite materials for demanding applications...",
            status: "NOT_STARTED",
          },
        ],
      },
      {
        id: "mod-3",
        title: "Module 3: Design for Manufacturing",
        lessons: [
          {
            id: "lesson-6",
            title: "Design Guidelines for FDM",
            durationMin: 30,
            content:
              "Best practices for designing parts optimized for FDM printing...",
            status: "NOT_STARTED",
          },
          {
            id: "lesson-7",
            title: "Support Structures & Orientation",
            durationMin: 22,
            content:
              "How to minimize supports and choose optimal print orientation...",
            status: "NOT_STARTED",
          },
        ],
      },
    ],
  },
  {
    id: "course-2",
    code: "CNC-201",
    title: "CNC Machining Fundamentals",
    description:
      "Master the basics of CNC milling and turning. From G-code to toolpath optimization.",
    instructor: "Ing. Carlos Mendoza",
    totalLessons: 15,
    totalDuration: "6 hours",
    enrolled: 189,
    thumbnail: "⚙️",
    modules: [
      {
        id: "mod-cnc-1",
        title: "Module 1: Introduction to CNC",
        lessons: [
          {
            id: "cnc-1",
            title: "What is CNC Machining?",
            durationMin: 18,
            status: "NOT_STARTED",
          },
          {
            id: "cnc-2",
            title: "Types of CNC Machines",
            durationMin: 20,
            status: "NOT_STARTED",
          },
        ],
      },
    ],
  },
  {
    id: "course-3",
    code: "QA-301",
    title: "Quality Control in Manufacturing",
    description:
      "Implement robust quality systems, statistical process control, and inspection techniques.",
    instructor: "Dra. Ana Rodríguez",
    totalLessons: 10,
    totalDuration: "3.5 hours",
    enrolled: 256,
    thumbnail: "📊",
    modules: [
      {
        id: "mod-qa-1",
        title: "Module 1: Quality Fundamentals",
        lessons: [
          {
            id: "qa-1",
            title: "Introduction to Quality Systems",
            durationMin: 15,
            status: "NOT_STARTED",
          },
          {
            id: "qa-2",
            title: "Six Sigma Basics",
            durationMin: 25,
            status: "NOT_STARTED",
          },
        ],
      },
    ],
  },
];

// ============================================================================
// Demo Limits
// ============================================================================

const DEMO_LESSON_LIMIT = 3;

// ============================================================================
// Components
// ============================================================================

function CourseCard({
  course,
  onSelect,
  isSelected,
}: {
  course: DemoCourse;
  onSelect: () => void;
  isSelected: boolean;
}) {
  const completedLessons = course.modules
    .flatMap((m) => m.lessons)
    .filter((l) => l.status === "COMPLETED").length;
  const progress = Math.round((completedLessons / course.totalLessons) * 100);

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onSelect}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="text-4xl mb-2">{course.thumbnail}</div>
          <Badge variant="outline">{course.code}</Badge>
        </div>
        <CardTitle className="text-lg">{course.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {course.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {course.totalLessons} lessons
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {course.totalDuration}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{course.enrolled} enrolled</span>
          </div>
          {progress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LessonContent({
  lesson,
  onComplete,
  isLocked,
}: {
  lesson: DemoLesson;
  onComplete: () => void;
  isLocked: boolean;
}) {
  if (isLocked) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Demo Limit Reached</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {"You've explored"} {DEMO_LESSON_LIMIT} {"lessons in this demo."}
              Sign up to unlock all courses and track your learning progress!
            </p>
            <div className="space-y-3">
              <Button className="w-full" size="lg">
                <Sparkles className="mr-2 h-4 w-4" />
                Start Free Trial
              </Button>
              <Button variant="outline" className="w-full">
                View Pricing Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Video Player */}
        {lesson.videoUrl && (
          <Card>
            <CardContent className="p-0">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <iframe
                  src={lesson.videoUrl}
                  className="w-full h-full"
                  allowFullScreen
                  title={lesson.title}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lesson Content */}
        {lesson.content && (
          <Card>
            <CardContent className="p-6">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{lesson.content}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Complete Button */}
        {lesson.status !== "COMPLETED" && (
          <div className="flex justify-center">
            <Button size="lg" onClick={onComplete}>
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Mark as Complete
            </Button>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

// ============================================================================
// Main Demo Page
// ============================================================================

export default function AvalaDemo() {
  const [selectedCourse, setSelectedCourse] = useState<DemoCourse>(
    DEMO_COURSES[0],
  );
  const [currentLessonId, setCurrentLessonId] = useState<string>("lesson-1");
  const [completedInDemo, setCompletedInDemo] = useState<Set<string>>(
    new Set(["lesson-1", "lesson-2"]),
  );
  const [showUpsell, setShowUpsell] = useState(false);

  const allLessons = selectedCourse.modules.flatMap((m) => m.lessons);
  const currentLesson = allLessons.find((l) => l.id === currentLessonId);
  const currentModule = selectedCourse.modules.find((m) =>
    m.lessons.some((l) => l.id === currentLessonId),
  );

  const completedCount = completedInDemo.size;

  const handleSelectLesson = (lessonId: string) => {
    const lessonIndex = allLessons.findIndex((l) => l.id === lessonId);
    const completedLessonsBeforeThis = allLessons
      .slice(0, lessonIndex)
      .filter((l) => completedInDemo.has(l.id)).length;

    // Allow selecting only if within demo limit or already completed
    if (
      completedLessonsBeforeThis < DEMO_LESSON_LIMIT ||
      completedInDemo.has(lessonId)
    ) {
      setCurrentLessonId(lessonId);
    } else {
      setShowUpsell(true);
    }
  };

  const handleCompleteLesson = () => {
    if (!currentLessonId) return;

    const newCompleted = new Set(completedInDemo);
    newCompleted.add(currentLessonId);
    setCompletedInDemo(newCompleted);

    // Move to next lesson
    const currentIndex = allLessons.findIndex((l) => l.id === currentLessonId);
    if (currentIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentIndex + 1];
      if (nextLesson && newCompleted.size < DEMO_LESSON_LIMIT) {
        setCurrentLessonId(nextLesson.id);
      } else {
        setShowUpsell(true);
      }
    }
  };

  const currentLessonIndex = allLessons.findIndex(
    (l) => l.id === currentLessonId,
  );
  const previousLesson =
    currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson =
    currentLessonIndex < allLessons.length - 1
      ? allLessons[currentLessonIndex + 1]
      : null;

  const isCurrentLessonLocked =
    !completedInDemo.has(currentLessonId) &&
    allLessons
      .slice(0, currentLessonIndex)
      .filter((l) => completedInDemo.has(l.id)).length >= DEMO_LESSON_LIMIT;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            <div>
              <h1 className="font-bold text-xl">Avala LMS</h1>
              <p className="text-xs text-muted-foreground">Interactive Demo</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Demo Mode: {DEMO_LESSON_LIMIT - completedCount} lessons remaining
            </Badge>
            <Button>
              Sign Up Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {/* Course Selection */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Available Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DEMO_COURSES.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onSelect={() => {
                  setSelectedCourse(course);
                  setCurrentLessonId(course.modules[0].lessons[0].id);
                }}
                isSelected={selectedCourse.id === course.id}
              />
            ))}
          </div>
        </div>

        {/* Learning Player */}
        <div className="flex h-[600px] bg-white dark:bg-slate-900 rounded-xl shadow-lg overflow-hidden">
          {/* Left Sidebar - Course Navigation */}
          <div className="w-80 border-r flex flex-col">
            {/* Course Header */}
            <div className="p-4 border-b space-y-2">
              <Badge variant="outline">{selectedCourse.code}</Badge>
              <h2 className="font-semibold line-clamp-2">
                {selectedCourse.title}
              </h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Award className="h-4 w-4" />
                <span>{selectedCourse.instructor}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Demo Progress</span>
                  <span className="font-medium">
                    {completedCount}/{DEMO_LESSON_LIMIT} lessons
                  </span>
                </div>
                <Progress
                  value={(completedCount / DEMO_LESSON_LIMIT) * 100}
                  className="h-2"
                />
              </div>
            </div>

            {/* Module/Lesson List */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {selectedCourse.modules.map((module) => (
                  <div key={module.id} className="space-y-2">
                    <h3 className="font-medium text-sm text-muted-foreground">
                      {module.title}
                    </h3>
                    <div className="space-y-1 pl-2">
                      {module.lessons.map((lesson, index) => {
                        const isActive = lesson.id === currentLessonId;
                        const isCompleted = completedInDemo.has(lesson.id);
                        const lessonGlobalIndex = allLessons.findIndex(
                          (l) => l.id === lesson.id,
                        );
                        const completedBefore = allLessons
                          .slice(0, lessonGlobalIndex)
                          .filter((l) => completedInDemo.has(l.id)).length;
                        const isLocked =
                          !isCompleted && completedBefore >= DEMO_LESSON_LIMIT;

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => handleSelectLesson(lesson.id)}
                            className={`w-full flex items-center gap-2 p-2 rounded-md text-sm text-left transition-colors ${
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : isLocked
                                  ? "opacity-50 cursor-not-allowed"
                                  : "hover:bg-muted"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
                            ) : isLocked ? (
                              <Lock className="h-4 w-4 flex-shrink-0" />
                            ) : isActive ? (
                              <PlayCircle className="h-4 w-4 flex-shrink-0" />
                            ) : (
                              <Circle className="h-4 w-4 flex-shrink-0" />
                            )}
                            <span className="flex-1 line-clamp-1">
                              {index + 1}. {lesson.title}
                            </span>
                            <span className="text-xs opacity-70">
                              {lesson.durationMin}m
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {currentLesson ? (
              <>
                {/* Lesson Header */}
                <div className="p-6 border-b">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        {currentModule?.title}
                      </p>
                      <h1 className="text-2xl font-bold">
                        {currentLesson.title}
                      </h1>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {currentLesson.durationMin} minutes
                        </span>
                        {currentLesson.videoUrl && (
                          <span className="flex items-center gap-1">
                            <Video className="h-4 w-4" />
                            Video lesson
                          </span>
                        )}
                      </div>
                    </div>
                    {completedInDemo.has(currentLessonId) && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Completed
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Lesson Content */}
                <LessonContent
                  lesson={currentLesson}
                  onComplete={handleCompleteLesson}
                  isLocked={isCurrentLessonLocked}
                />

                {/* Navigation Footer */}
                <div className="p-4 border-t">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={() =>
                        previousLesson && handleSelectLesson(previousLesson.id)
                      }
                      disabled={!previousLesson}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Lesson {currentLessonIndex + 1} of {allLessons.length}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() =>
                        nextLesson && handleSelectLesson(nextLesson.id)
                      }
                      disabled={!nextLesson}
                    >
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <Card className="max-w-md">
                  <CardContent className="py-12 text-center">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                    <p className="font-medium text-lg">
                      Select a lesson to begin
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Upsell CTA */}
        {showUpsell && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-lg w-full">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit">
                  <GraduationCap className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-2xl">Unlock Full Access</CardTitle>
                <CardDescription>
                  {"You've completed the demo! Sign up to continue learning"}
                  and earn certificates.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-bold text-primary">50+</div>
                    <div className="text-sm text-muted-foreground">Courses</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-bold text-primary">∞</div>
                    <div className="text-sm text-muted-foreground">Lessons</div>
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Track progress across all courses</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Earn completion certificates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Access exclusive content</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Join the learning community</span>
                  </li>
                </ul>
                <div className="space-y-3 pt-4">
                  <Button className="w-full" size="lg">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Start 14-Day Free Trial
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setShowUpsell(false)}
                  >
                    Continue Exploring Demo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-8 text-center">
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="py-8">
              <h3 className="text-2xl font-bold mb-2">
                Ready to upskill your team?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Avala LMS powers corporate training for manufacturing companies
                across Latin America. Custom courses, progress tracking, and
                team analytics included.
              </p>
              <div className="flex justify-center gap-4">
                <Button size="lg">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Start Free Trial
                </Button>
                <Button variant="outline" size="lg">
                  Contact Sales
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
