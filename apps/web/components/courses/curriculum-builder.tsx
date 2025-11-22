'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LessonEditorSheet } from './lesson-editor-sheet';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, GripVertical, BookOpen, Edit } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  order: number;
  contentRef: string | null;
  durationMin: number | null;
  _count?: {
    criteria: number;
  };
}

interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
  _count?: {
    lessons: number;
  };
}

interface CurriculumData {
  courseId: string;
  courseTitle: string;
  moduleCount: number;
  lessonCount: number;
  modules: Module[];
}

interface CurriculumBuilderProps {
  courseId: string;
}

/**
 * CurriculumBuilder Component
 * Phase 2-B: Hierarchical module and lesson management
 * Features:
 * - Accordion layout for modules
 * - Nested lesson lists
 * - Add/Delete modules and lessons
 * - Auto-ordering
 */
export function CurriculumBuilder({ courseId }: CurriculumBuilderProps) {
  const { toast } = useToast();
  const [curriculum, setCurriculum] = useState<CurriculumData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState<{ [moduleId: string]: string }>({});
  const [addingLessonToModule, setAddingLessonToModule] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  useEffect(() => {
    fetchCurriculum();
  }, [courseId]);

  const fetchCurriculum = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get<CurriculumData>(`/courses/${courseId}/curriculum`);
      setCurriculum(data);
    } catch (error) {
      console.error('Failed to fetch curriculum:', error);
      toast({
        title: 'Error',
        description: 'Failed to load curriculum',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Module title is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsAddingModule(true);
      await apiClient.post(`/courses/${courseId}/modules`, {
        title: newModuleTitle,
      });

      toast({
        title: 'Success',
        description: 'Module created successfully',
      });

      setNewModuleTitle('');
      fetchCurriculum();
    } catch (error: any) {
      console.error('Failed to create module:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create module',
        variant: 'destructive',
      });
    } finally {
      setIsAddingModule(false);
    }
  };

  const handleDeleteModule = async (moduleId: string, moduleTitle: string) => {
    if (!confirm(`Delete module "${moduleTitle}" and all its lessons?`)) {
      return;
    }

    try {
      await apiClient.delete(`/modules/${moduleId}`);

      toast({
        title: 'Success',
        description: 'Module deleted successfully',
      });

      fetchCurriculum();
    } catch (error: any) {
      console.error('Failed to delete module:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete module',
        variant: 'destructive',
      });
    }
  };

  const handleAddLesson = async (moduleId: string) => {
    const title = newLessonTitle[moduleId]?.trim();
    if (!title) {
      toast({
        title: 'Error',
        description: 'Lesson title is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setAddingLessonToModule(moduleId);
      await apiClient.post(`/modules/${moduleId}/lessons`, {
        title,
      });

      toast({
        title: 'Success',
        description: 'Lesson created successfully',
      });

      setNewLessonTitle({ ...newLessonTitle, [moduleId]: '' });
      fetchCurriculum();
    } catch (error: any) {
      console.error('Failed to create lesson:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create lesson',
        variant: 'destructive',
      });
    } finally {
      setAddingLessonToModule(null);
    }
  };

  const handleDeleteLesson = async (lessonId: string, lessonTitle: string) => {
    if (!confirm(`Delete lesson "${lessonTitle}"?`)) {
      return;
    }

    try {
      await apiClient.delete(`/lessons/${lessonId}`);

      toast({
        title: 'Success',
        description: 'Lesson deleted successfully',
      });

      fetchCurriculum();
    } catch (error: any) {
      console.error('Failed to delete lesson:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete lesson',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Loading curriculum...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Curriculum</CardTitle>
        <CardDescription>
          Build your course structure with modules and lessons. Modules are like chapters, and lessons are individual topics.
        </CardDescription>
        {curriculum && (
          <div className="flex gap-4 mt-2">
            <Badge variant="secondary">
              {curriculum.moduleCount} Module{curriculum.moduleCount !== 1 ? 's' : ''}
            </Badge>
            <Badge variant="secondary">
              {curriculum.lessonCount} Lesson{curriculum.lessonCount !== 1 ? 's' : ''}
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {curriculum && curriculum.modules.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No modules yet</p>
            <p className="text-sm mt-1">Add your first module to start building the curriculum</p>
          </div>
        ) : (
          <Accordion type="multiple" className="w-full">
            {curriculum?.modules.map((module) => (
              <AccordionItem key={module.id} value={module.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{module.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteModule(module.id, module.title);
                      }}
                      className="hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pl-7">
                    {/* Lesson List */}
                    {module.lessons.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-4 text-center">
                        No lessons yet. Add your first lesson below.
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {module.lessons.map((lesson, index) => (
                          <div
                            key={lesson.id}
                            className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors group"
                          >
                            <div
                              className="flex items-center gap-2 flex-1 cursor-pointer"
                              onClick={() => {
                                setSelectedLessonId(lesson.id);
                                setIsEditorOpen(true);
                              }}
                            >
                              <span className="text-xs text-muted-foreground w-6">
                                {index + 1}.
                              </span>
                              <span className="text-sm">{lesson.title}</span>
                              {lesson._count && lesson._count.criteria > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {lesson._count.criteria} criteria
                                </Badge>
                              )}
                              <Edit className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteLesson(lesson.id, lesson.title);
                              }}
                              className="hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Lesson Input */}
                    <div className="flex gap-2 pt-2">
                      <Input
                        placeholder="New lesson title..."
                        value={newLessonTitle[module.id] || ''}
                        onChange={(e) =>
                          setNewLessonTitle({
                            ...newLessonTitle,
                            [module.id]: e.target.value,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddLesson(module.id);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAddLesson(module.id)}
                        disabled={addingLessonToModule === module.id}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Lesson
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        {/* Add Module Input */}
        <div className="flex gap-2 pt-4 border-t">
          <Input
            placeholder="New module title..."
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddModule();
              }
            }}
          />
          <Button onClick={handleAddModule} disabled={isAddingModule}>
            <Plus className="h-4 w-4 mr-1" />
            Add Module
          </Button>
        </div>
      </CardContent>

      {/* Lesson Editor Sheet */}
      <LessonEditorSheet
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        lessonId={selectedLessonId}
        courseId={courseId}
        onUpdate={fetchCurriculum}
      />
    </Card>
  );
}
