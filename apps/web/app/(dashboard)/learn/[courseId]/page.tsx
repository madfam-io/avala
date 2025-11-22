'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  PlayCircle,
  BookOpen,
  Video,
} from 'lucide-react';

interface LessonProgress {
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  completedAt: string | null;
  viewedAt: string | null;
}

interface Lesson {
  id: string;
  title: string;
  order: number;
  contentRef: string | null;
  videoUrl: string | null;
  durationMin: number | null;
  progress: LessonProgress;
}

interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
  progress: {
    totalLessons: number;
    completedLessons: number;
    percentage: number;
  };
}

interface EnrollmentProgress {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  courseCode: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  enrolledAt: string;
  completedAt: string | null;
  progress: {
    totalLessons: number;
    completedLessons: number;
    percentage: number;
  };
  modules: Module[];
}

/**
 * Learning Player Page
 * Phase 3-A: Enrollment & Learning Player
 * Features:
 * - Module/lesson sidebar navigation
 * - Video player and lesson content
 * - Previous/Next navigation
 * - Mark lesson as complete
 * - Progress tracking
 */
export default function LearnPage({ params }: { params: { courseId: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const enrollmentId = searchParams.get('enrollment');
  const [enrollment, setEnrollment] = useState<EnrollmentProgress | null>(null);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    if (enrollmentId) {
      fetchEnrollment();
    }
  }, [enrollmentId]);

  useEffect(() => {
    if (enrollment && !currentLessonId) {
      // Auto-select first incomplete lesson
      const firstIncompleteLesson = findFirstIncompleteLesson();
      if (firstIncompleteLesson) {
        setCurrentLessonId(firstIncompleteLesson.id);
      } else if (enrollment.modules[0]?.lessons[0]) {
        // If all complete, select first lesson
        setCurrentLessonId(enrollment.modules[0].lessons[0].id);
      }
    }
  }, [enrollment, currentLessonId]);

  const fetchEnrollment = async () => {
    if (!enrollmentId) return;

    try {
      setIsLoading(true);
      const data = await apiClient.get<EnrollmentProgress>(`/enrollments/${enrollmentId}`);
      setEnrollment(data);
    } catch (error) {
      console.error('Failed to fetch enrollment:', error);
      toast({
        title: 'Error',
        description: 'Failed to load course',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const findFirstIncompleteLesson = (): Lesson | null => {
    if (!enrollment) return null;

    for (const module of enrollment.modules) {
      for (const lesson of module.lessons) {
        if (lesson.progress.status !== 'COMPLETED') {
          return lesson;
        }
      }
    }
    return null;
  };

  const getCurrentLesson = (): Lesson | null => {
    if (!enrollment || !currentLessonId) return null;

    for (const module of enrollment.modules) {
      const lesson = module.lessons.find((l) => l.id === currentLessonId);
      if (lesson) return lesson;
    }
    return null;
  };

  const getCurrentModule = (): Module | null => {
    if (!enrollment || !currentLessonId) return null;

    return (
      enrollment.modules.find((m) => m.lessons.some((l) => l.id === currentLessonId)) || null
    );
  };

  const getAdjacentLessons = (): { previous: Lesson | null; next: Lesson | null } => {
    if (!enrollment) return { previous: null, next: null };

    const allLessons = enrollment.modules.flatMap((m) => m.lessons);
    const currentIndex = allLessons.findIndex((l) => l.id === currentLessonId);

    if (currentIndex === -1) return { previous: null, next: null };

    return {
      previous: currentIndex > 0 ? allLessons[currentIndex - 1] : null,
      next: currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null,
    };
  };

  const handleSelectLesson = async (lessonId: string) => {
    if (!enrollmentId) return;

    try {
      // Mark as in progress when viewed
      await apiClient.post(`/enrollments/${enrollmentId}/lessons/${lessonId}/start`, {});
      setCurrentLessonId(lessonId);
      // Refresh to update progress
      fetchEnrollment();
    } catch (error) {
      console.error('Failed to start lesson:', error);
    }
  };

  const handleCompleteLesson = async () => {
    if (!enrollmentId || !currentLessonId) return;

    try {
      setIsCompleting(true);
      const result = await apiClient.post(
        `/enrollments/${enrollmentId}/lessons/${currentLessonId}/complete`,
        {},
      );

      toast({
        title: 'Success',
        description: result.enrollmentCompleted
          ? 'Lesson completed! You have finished the entire course!'
          : 'Lesson marked as complete',
      });

      // Move to next lesson if available
      const { next } = getAdjacentLessons();
      if (next) {
        setCurrentLessonId(next.id);
      }

      fetchEnrollment();
    } catch (error: any) {
      console.error('Failed to complete lesson:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to complete lesson',
        variant: 'destructive',
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleNavigate = (direction: 'previous' | 'next') => {
    const { previous, next } = getAdjacentLessons();
    const targetLesson = direction === 'previous' ? previous : next;
    if (targetLesson) {
      handleSelectLesson(targetLesson.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading course...</div>
      </div>
    );
  }

  if (!enrollment || !enrollmentId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <p className="font-medium text-lg">Course not found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please enroll in this course to start learning
            </p>
            <Button className="mt-4" onClick={() => router.push('/dashboard/learning')}>
              Go to My Learning
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentLesson = getCurrentLesson();
  const currentModule = getCurrentModule();
  const { previous, next } = getAdjacentLessons();

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Course Navigation */}
      <div className="w-80 border-r flex flex-col">
        {/* Course Header */}
        <div className="p-4 border-b space-y-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/learning')}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
          <div>
            <Badge variant="outline" className="mb-1">
              {enrollment.courseCode}
            </Badge>
            <h2 className="font-semibold text-lg line-clamp-2">{enrollment.courseTitle}</h2>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Course Progress</span>
              <span className="font-medium">{enrollment.progress.percentage}%</span>
            </div>
            <Progress value={enrollment.progress.percentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {enrollment.progress.completedLessons} of {enrollment.progress.totalLessons} lessons
              completed
            </p>
          </div>
        </div>

        {/* Module/Lesson List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {enrollment.modules.map((module) => (
              <div key={module.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">{module.title}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {module.progress.completedLessons}/{module.progress.totalLessons}
                  </Badge>
                </div>
                <div className="space-y-1 pl-2">
                  {module.lessons.map((lesson, index) => {
                    const isActive = lesson.id === currentLessonId;
                    const isCompleted = lesson.progress.status === 'COMPLETED';
                    const isInProgress = lesson.progress.status === 'IN_PROGRESS';

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => handleSelectLesson(lesson.id)}
                        className={`w-full flex items-center gap-2 p-2 rounded-md text-sm text-left transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
                        ) : isInProgress ? (
                          <PlayCircle className="h-4 w-4 flex-shrink-0 text-blue-600" />
                        ) : (
                          <Circle className="h-4 w-4 flex-shrink-0" />
                        )}
                        <span className="flex-1 line-clamp-2">
                          {index + 1}. {lesson.title}
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
                  <p className="text-sm text-muted-foreground">{currentModule?.title}</p>
                  <h1 className="text-2xl font-bold">{currentLesson.title}</h1>
                </div>
                {currentLesson.progress.status !== 'COMPLETED' && (
                  <Button onClick={handleCompleteLesson} disabled={isCompleting}>
                    {isCompleting ? (
                      'Completing...'
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mark Complete
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Lesson Content */}
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Video Player */}
                {currentLesson.videoUrl && (
                  <Card>
                    <CardContent className="p-0">
                      <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                        {currentLesson.videoUrl.includes('youtube.com') ||
                        currentLesson.videoUrl.includes('youtu.be') ? (
                          <iframe
                            src={currentLesson.videoUrl.replace('watch?v=', 'embed/')}
                            className="w-full h-full"
                            allowFullScreen
                            title={currentLesson.title}
                          />
                        ) : (
                          <div className="text-center text-white">
                            <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-sm">Video player</p>
                            <a
                              href={currentLesson.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs underline mt-2 inline-block"
                            >
                              Open video in new tab
                            </a>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Lesson Content */}
                {currentLesson.contentRef && (
                  <Card>
                    <CardContent className="p-6">
                      <div className="prose max-w-none">
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {currentLesson.contentRef}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!currentLesson.videoUrl && !currentLesson.contentRef && (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                      <p className="text-muted-foreground">No content available for this lesson</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>

            {/* Navigation Footer */}
            <div className="p-6 border-t">
              <div className="flex items-center justify-between max-w-4xl mx-auto">
                <Button
                  variant="outline"
                  onClick={() => handleNavigate('previous')}
                  disabled={!previous}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                  Lesson {enrollment.modules.flatMap((m) => m.lessons).findIndex((l) => l.id === currentLessonId) + 1} of{' '}
                  {enrollment.progress.totalLessons}
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleNavigate('next')}
                  disabled={!next}
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
                <p className="font-medium text-lg">No lesson selected</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Select a lesson from the sidebar to start learning
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
