'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BookOpen, Link2 } from 'lucide-react';

interface Criterion {
  id: string;
  type: string;
  code: string;
  text: string;
}

interface Element {
  id: string;
  index: number;
  title: string;
  criteria: Criterion[];
}

interface Standard {
  id: string;
  code: string;
  title: string;
  elements: Element[];
}

interface AvailableCriteria {
  courseId: string;
  courseTitle: string;
  standards: Standard[];
}

interface LessonMapping {
  lessonId: string;
  lessonTitle: string;
  criteriaIds: string[];
}

interface LessonEditorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: string | null;
  courseId: string;
  onUpdate?: () => void;
}

interface LessonFormData {
  title: string;
  content: string;
  videoUrl: string;
}

/**
 * LessonEditorSheet Component
 * Phase 2-C: Content & Competency Mapping
 * Features:
 * - Content Tab: Edit title, content, video URL
 * - Alignment Tab: Map lesson to EC criteria
 * - Real-time criteria count updates
 */
export function LessonEditorSheet({
  open,
  onOpenChange,
  lessonId,
  courseId,
  onUpdate,
}: LessonEditorSheetProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('content');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [availableCriteria, setAvailableCriteria] = useState<AvailableCriteria | null>(null);
  const [selectedCriteriaIds, setSelectedCriteriaIds] = useState<Set<string>>(new Set());

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<LessonFormData>();

  useEffect(() => {
    if (open && lessonId) {
      fetchLessonData();
      fetchAvailableCriteria();
      fetchLessonMapping();
    } else {
      reset();
      setSelectedCriteriaIds(new Set());
    }
  }, [open, lessonId]);

  const fetchLessonData = async () => {
    if (!lessonId) return;

    try {
      setIsLoading(true);
      const lesson = await apiClient.get<any>(`/lessons/${lessonId}`);
      setValue('title', lesson.title || '');
      setValue('content', lesson.content || '');
      setValue('videoUrl', lesson.videoUrl || '');
    } catch (error) {
      console.error('Failed to fetch lesson:', error);
      toast({
        title: 'Error',
        description: 'Failed to load lesson data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableCriteria = async () => {
    try {
      const data = await apiClient.get<AvailableCriteria>(`/courses/${courseId}/criteria`);
      setAvailableCriteria(data);
    } catch (error) {
      console.error('Failed to fetch criteria:', error);
    }
  };

  const fetchLessonMapping = async () => {
    if (!lessonId) return;

    try {
      const mapping = await apiClient.get<LessonMapping>(`/lessons/${lessonId}/mapping`);
      setSelectedCriteriaIds(new Set(mapping.criteriaIds));
    } catch (error) {
      console.error('Failed to fetch lesson mapping:', error);
    }
  };

  const onSubmit = async (data: LessonFormData) => {
    if (!lessonId) return;

    try {
      setIsSaving(true);
      await apiClient.put(`/lessons/${lessonId}/content`, {
        title: data.title,
        content: data.content,
        videoUrl: data.videoUrl,
      });

      toast({
        title: 'Success',
        description: 'Lesson content updated successfully',
      });

      onUpdate?.();
    } catch (error: any) {
      console.error('Failed to update lesson:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update lesson',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCriterion = async (criterionId: string) => {
    if (!lessonId) return;

    try {
      const newSelected = new Set(selectedCriteriaIds);
      if (newSelected.has(criterionId)) {
        newSelected.delete(criterionId);
      } else {
        newSelected.add(criterionId);
      }
      setSelectedCriteriaIds(newSelected);

      // Optimistic update
      await apiClient.post(`/lessons/${lessonId}/mapping/${criterionId}`, {});

      onUpdate?.();
    } catch (error: any) {
      console.error('Failed to toggle mapping:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update mapping',
        variant: 'destructive',
      });
      // Revert on error
      fetchLessonMapping();
    }
  };

  if (!lessonId) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Lesson</SheetTitle>
          <SheetDescription>
            Update lesson content and map it to competency criteria
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="content">
                <BookOpen className="h-4 w-4 mr-2" />
                Content
              </TabsTrigger>
              <TabsTrigger value="alignment">
                <Link2 className="h-4 w-4 mr-2" />
                Alignment ({selectedCriteriaIds.size})
              </TabsTrigger>
            </TabsList>

            {/* CONTENT TAB */}
            <TabsContent value="content" className="space-y-4 mt-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Lesson Title *</Label>
                  <Input
                    id="title"
                    {...register('title', { required: 'Title is required' })}
                    placeholder="Introduction to Adult Learning"
                  />
                  {errors.title && (
                    <p className="text-xs text-destructive">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Lesson Content</Label>
                  <Textarea
                    id="content"
                    {...register('content')}
                    placeholder="Describe the lesson objectives, instructions, and key points..."
                    rows={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    Add lesson description, objectives, and instructions for trainees
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="videoUrl">Video URL</Label>
                  <Input
                    id="videoUrl"
                    {...register('videoUrl')}
                    placeholder="https://www.youtube.com/watch?v=..."
                    type="url"
                  />
                  <p className="text-xs text-muted-foreground">
                    YouTube, Vimeo, or other video platform URL
                  </p>
                </div>

                <SheetFooter className="pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Content'
                    )}
                  </Button>
                </SheetFooter>
              </form>
            </TabsContent>

            {/* ALIGNMENT TAB */}
            <TabsContent value="alignment" className="space-y-4 mt-4">
              {!availableCriteria || availableCriteria.standards.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="font-medium">No standards linked to this course</p>
                  <p className="text-sm mt-2">
                    Link EC standards to the course to enable competency mapping
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border p-4 bg-muted/50">
                    <p className="text-sm font-medium">
                      Selected: {selectedCriteriaIds.size} criteria
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Map this lesson to specific competency criteria from the linked standards
                    </p>
                  </div>

                  <Accordion type="multiple" className="w-full">
                    {availableCriteria.standards.map((standard) => (
                      <AccordionItem key={standard.id} value={standard.id}>
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{standard.code}</Badge>
                            <span className="text-sm">{standard.title}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pl-4">
                            {standard.elements.map((element) => (
                              <div key={element.id} className="space-y-2">
                                <h4 className="text-sm font-medium">
                                  Element {element.index + 1}: {element.title}
                                </h4>
                                <div className="space-y-2 pl-4">
                                  {element.criteria.map((criterion) => (
                                    <div
                                      key={criterion.id}
                                      className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                                    >
                                      <Checkbox
                                        id={`criterion-${criterion.id}`}
                                        checked={selectedCriteriaIds.has(criterion.id)}
                                        onCheckedChange={() => toggleCriterion(criterion.id)}
                                      />
                                      <div className="flex-1 space-y-1">
                                        <label
                                          htmlFor={`criterion-${criterion.id}`}
                                          className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                                        >
                                          <Badge variant="secondary" className="text-xs">
                                            {criterion.type}
                                          </Badge>
                                          <code className="text-xs">{criterion.code}</code>
                                        </label>
                                        <p className="text-xs text-muted-foreground">
                                          {criterion.text}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}
