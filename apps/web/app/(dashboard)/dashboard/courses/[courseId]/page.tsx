"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CurriculumBuilder } from "@/components/courses/curriculum-builder";
import { apiClient } from "@/lib/api-client";
import { BookOpen, Settings, Info, Loader2 } from "lucide-react";

interface Course {
  id: string;
  code: string;
  title: string;
  description: string | null;
  durationHours: number;
  status: string;
  standards: {
    id: string;
    code: string;
    title: string;
  }[];
}

/**
 * Course Builder Page
 * Phase 2-B: Curriculum Structure
 * Features:
 * - Course overview and metadata
 * - Curriculum builder (modules and lessons)
 * - Course settings
 * - Publish workflow
 */
export default function CourseBuilderPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("curriculum");

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get<Course>(`/courses/${courseId}`);
      setCourse(data);
    } catch (error) {
      console.error("Failed to fetch course:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      await apiClient.put(`/courses/${courseId}`, { status: "PUBLISHED" });
      fetchCourse(); // Refresh to show updated status
    } catch (error) {
      console.error("Failed to publish course:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg font-semibold">Course not found</p>
          <p className="text-sm text-muted-foreground mt-2">
            {"The course you're looking for doesn't exist or has been deleted."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {course.title}
            </h1>
            <Badge
              variant={course.status === "PUBLISHED" ? "default" : "secondary"}
            >
              {course.status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <code className="text-sm bg-muted px-2 py-1 rounded">
              {course.code}
            </code>
            <span className="text-sm text-muted-foreground">
              {course.durationHours} hours
            </span>
            {course.standards.length > 0 && (
              <span className="text-sm text-muted-foreground">
                Aligned with {course.standards.length} EC standard
                {course.standards.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {course.status !== "PUBLISHED" && (
            <Button onClick={handlePublish}>Publish Course</Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">
            <Info className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="curriculum">
            <BookOpen className="h-4 w-4 mr-2" />
            Curriculum
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
              <CardDescription>
                Basic details and metadata about this course
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Description</label>
                <p className="text-sm text-muted-foreground mt-1">
                  {course.description || "No description provided"}
                </p>
              </div>

              {course.standards.length > 0 && (
                <div>
                  <label className="text-sm font-medium">
                    Aligned Standards
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {course.standards.map((standard) => (
                      <Badge key={standard.id} variant="outline">
                        {standard.code}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Duration</label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {course.durationHours} hours
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {course.status}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Curriculum Tab */}
        <TabsContent value="curriculum">
          <CurriculumBuilder courseId={courseId} />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Settings</CardTitle>
              <CardDescription>
                Manage course configuration and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Settings coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
