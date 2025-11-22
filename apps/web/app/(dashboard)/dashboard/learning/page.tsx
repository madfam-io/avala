'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, PlayCircle, CheckCircle2, Clock } from 'lucide-react';

interface EnrolledCourse {
  enrollmentId: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  courseDescription: string | null;
  courseDurationHours: number;
  status: 'IN_PROGRESS' | 'COMPLETED';
  enrolledAt: string;
  completedAt: string | null;
  progress: {
    totalLessons: number;
    completedLessons: number;
    inProgressLessons: number;
    notStartedLessons: number;
    percentage: number;
  };
}

/**
 * My Learning Page
 * Phase 3-A: Enrollment & Learning Player
 * Features:
 * - Grid of enrolled courses with progress bars
 * - Continue learning or start course
 * - Completion status badges
 */
export default function MyLearningPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get<EnrolledCourse[]>('/enrollments/my-courses');
      setCourses(data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your courses',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartCourse = (courseId: string, enrollmentId: string) => {
    router.push(`/learn/${courseId}?enrollment=${enrollmentId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Learning</h1>
          <p className="text-muted-foreground mt-1">Your enrolled courses and learning progress</p>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <div className="text-muted-foreground">Loading your courses...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Learning</h1>
          <p className="text-muted-foreground mt-1">Your enrolled courses and learning progress</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard/courses')}>
          <BookOpen className="mr-2 h-4 w-4" />
          Browse Catalog
        </Button>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <p className="font-medium text-lg">No enrolled courses yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Browse the course catalog to find courses and start learning
              </p>
              <Button className="mt-4" onClick={() => router.push('/dashboard/courses')}>
                Browse Courses
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.enrollmentId} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Badge variant="outline" className="mb-2">
                      {course.courseCode}
                    </Badge>
                    <CardTitle className="line-clamp-2">{course.courseTitle}</CardTitle>
                  </div>
                  {course.status === 'COMPLETED' && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </div>
                <CardDescription className="line-clamp-2">
                  {course.courseDescription || 'No description available'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{course.progress.percentage}%</span>
                  </div>
                  <Progress value={course.progress.percentage} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {course.progress.completedLessons} of {course.progress.totalLessons} lessons
                    </span>
                    {course.status === 'COMPLETED' && course.completedAt && (
                      <span>Completed {formatDate(course.completedAt)}</span>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{course.courseDurationHours}h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    <span>{course.progress.totalLessons} lessons</span>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  className="w-full"
                  onClick={() => handleStartCourse(course.courseId, course.enrollmentId)}
                  variant={course.status === 'COMPLETED' ? 'outline' : 'default'}
                >
                  {course.status === 'COMPLETED' ? (
                    <>
                      <BookOpen className="mr-2 h-4 w-4" />
                      Review Course
                    </>
                  ) : course.progress.completedLessons > 0 ? (
                    <>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Continue Learning
                    </>
                  ) : (
                    <>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Start Course
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
