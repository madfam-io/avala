'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Clock, Award, User, PlayCircle, Edit } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

interface CompetencyStandard {
  id: string;
  code: string;
  title: string;
}

interface CourseOwner {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface Course {
  id: string;
  code: string;
  title: string;
  description: string | null;
  durationHours: number;
  status: string;
  standards: CompetencyStandard[];
  owner: CourseOwner;
  _count?: {
    modules: number;
    assessments: number;
  };
}

/**
 * CourseCatalog Component
 * Phase 2-A: Displays courses in a grid layout with EC alignment
 * Phase 3-A: Added enrollment functionality
 * Features:
 * - Grid card layout for courses
 * - Search by title or code
 * - Display EC alignment badges
 * - Show duration for DC-3 compliance
 * - Enroll in courses
 */
export function CourseCatalog() {
  const router = useRouter();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCourses(courses);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = courses.filter(
        (course) =>
          course.title.toLowerCase().includes(query) ||
          course.code.toLowerCase().includes(query) ||
          course.description?.toLowerCase().includes(query)
      );
      setFilteredCourses(filtered);
    }
  }, [searchQuery, courses]);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get<Course[]>('/courses');
      setCourses(data);
      setFilteredCourses(data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getOwnerName = (owner: CourseOwner) => {
    if (owner.firstName && owner.lastName) {
      return `${owner.firstName} ${owner.lastName}`;
    }
    return owner.email;
  };

  const handleEnroll = async (courseId: string) => {
    try {
      setEnrollingCourseId(courseId);
      const result = await apiClient.post<{ enrollment: { id: string }; isNew: boolean }>(
        '/enrollments',
        { courseId }
      );

      if (result.isNew) {
        toast({
          title: 'Success',
          description: 'You have been enrolled in this course!',
        });
      }

      // Navigate to learning player
      router.push(`/learn/${courseId}?enrollment=${result.enrollment.id}`);
    } catch (error: any) {
      console.error('Failed to enroll:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to enroll in course',
        variant: 'destructive',
      });
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const handleManageCourse = (courseId: string) => {
    router.push(`/dashboard/courses/${courseId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading courses...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search courses by title, code, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">
            {searchQuery ? 'No courses found matching your search.' : 'No courses available yet.'}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {!searchQuery && 'Create your first course to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <CardDescription className="mt-1">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {course.code}
                      </code>
                    </CardDescription>
                  </div>
                  <Badge variant={course.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                    {course.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {course.description || 'No description available'}
                </p>

                {/* EC Alignment Badges */}
                {course.standards && course.standards.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {course.standards.map((standard) => (
                      <Badge key={standard.id} variant="outline" className="gap-1">
                        <Award className="h-3 w-3" />
                        {standard.code}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col gap-3 border-t pt-4">
                <div className="flex flex-col gap-2 text-xs text-muted-foreground w-full">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{course.durationHours} hours</span>
                    {course._count && course._count.modules > 0 && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{course._count.modules} modules</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    <span>{getOwnerName(course.owner)}</span>
                  </div>
                </div>
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManageCourse(course.id)}
                    className="flex-1"
                  >
                    <Edit className="mr-2 h-3.5 w-3.5" />
                    Manage
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleEnroll(course.id)}
                    disabled={enrollingCourseId === course.id || course.status !== 'PUBLISHED'}
                    className="flex-1"
                  >
                    {enrollingCourseId === course.id ? (
                      'Enrolling...'
                    ) : (
                      <>
                        <PlayCircle className="mr-2 h-3.5 w-3.5" />
                        Enroll
                      </>
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
