'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CourseCatalog } from '@/components/courses/course-catalog';
import { CreateCourseDialog } from '@/components/courses/create-course-dialog';
import { BookOpen } from 'lucide-react';

/**
 * Course Catalog Page
 * Phase 2-A: Course Management & EC Alignment
 * Features:
 * - Grid view of courses with EC alignment badges
 * - Search and filter courses
 * - Create courses with EC mapping
 * - DC-3 compliance (duration tracking)
 */
export default function CoursesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Course Catalog</h1>
          <p className="text-muted-foreground mt-1">
            Manage training courses and align them with CONOCER standards
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <BookOpen className="mr-2 h-4 w-4" />
          Create Course
        </Button>
      </div>

      {/* Course Catalog Card */}
      <Card>
        <CardHeader>
          <CardTitle>Available Courses</CardTitle>
          <CardDescription>
            Browse all training courses. Courses aligned with EC standards are marked with badges.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CourseCatalog />
        </CardContent>
      </Card>

      {/* Create Course Dialog */}
      <CreateCourseDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
