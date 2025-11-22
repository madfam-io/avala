'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Award } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

const createCourseSchema = z.object({
  code: z
    .string()
    .min(1, 'Course code is required')
    .max(50, 'Course code must be less than 50 characters')
    .regex(/^[A-Z0-9-_]+$/i, 'Course code can only contain letters, numbers, hyphens, and underscores'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
  durationHours: z
    .number({ invalid_type_error: 'Duration must be a number' })
    .int('Duration must be a whole number')
    .min(1, 'Duration must be at least 1 hour')
    .max(1000, 'Duration must be less than 1000 hours'),
});

type CreateCourseFormData = z.infer<typeof createCourseSchema>;

interface CompetencyStandard {
  id: string;
  code: string;
  title: string;
  _count?: {
    elements: number;
    courses: number;
  };
}

interface CreateCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCourseDialog({ open, onOpenChange }: CreateCourseDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [standards, setStandards] = useState<CompetencyStandard[]>([]);
  const [selectedStandardIds, setSelectedStandardIds] = useState<string[]>([]);
  const [isLoadingStandards, setIsLoadingStandards] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateCourseFormData>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      durationHours: 40, // Default to 40 hours
    },
  });

  // Fetch competency standards when dialog opens
  useEffect(() => {
    if (open) {
      fetchStandards();
    }
  }, [open]);

  const fetchStandards = async () => {
    try {
      setIsLoadingStandards(true);
      const data = await apiClient.get<CompetencyStandard[]>('/ec');
      setStandards(data);
    } catch (error) {
      console.error('Failed to fetch competency standards:', error);
      toast({
        title: 'Error',
        description: 'Failed to load competency standards',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingStandards(false);
    }
  };

  const toggleStandard = (standardId: string) => {
    setSelectedStandardIds((prev) =>
      prev.includes(standardId)
        ? prev.filter((id) => id !== standardId)
        : [...prev, standardId]
    );
  };

  const onSubmit = async (data: CreateCourseFormData) => {
    try {
      setIsSubmitting(true);

      const payload = {
        code: data.code,
        title: data.title,
        description: data.description || undefined,
        durationHours: data.durationHours,
        competencyStandardIds: selectedStandardIds.length > 0 ? selectedStandardIds : undefined,
      };

      await apiClient.post('/courses', payload);

      toast({
        title: 'Success',
        description: `Course "${data.title}" created successfully`,
      });

      // Reset form and close dialog
      reset();
      setSelectedStandardIds([]);
      onOpenChange(false);

      // Trigger a refresh of the course catalog
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to create course:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create course. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setSelectedStandardIds([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Course</DialogTitle>
          <DialogDescription>
            Create a training course and optionally align it with CONOCER competency standards (EC).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Course Code */}
          <div className="space-y-2">
            <Label htmlFor="code">
              Course Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="code"
              {...register('code')}
              placeholder="ALINEACION-001"
              className="font-mono"
            />
            {errors.code && (
              <p className="text-xs text-destructive">{errors.code.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Unique identifier for this course (e.g., ALINEACION-001)
            </p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Instructor Certification Prep"
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe the course objectives and target audience..."
              rows={3}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Duration Hours */}
          <div className="space-y-2">
            <Label htmlFor="durationHours">
              Duration (Hours) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="durationHours"
              type="number"
              {...register('durationHours', { valueAsNumber: true })}
              placeholder="40"
              min="1"
              max="1000"
            />
            {errors.durationHours && (
              <p className="text-xs text-destructive">{errors.durationHours.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Total course duration in hours (required for DC-3 compliance)
            </p>
          </div>

          {/* Competency Standards Selection */}
          <div className="space-y-2">
            <Label>Linked Competency Standards (Optional)</Label>
            <div className="rounded-md border p-3">
              {isLoadingStandards ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Loading standards...</span>
                </div>
              ) : standards.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No competency standards available. Add standards first to link them to courses.
                </p>
              ) : (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {standards.map((standard) => (
                      <div
                        key={standard.id}
                        className="flex items-start space-x-3 hover:bg-muted/50 p-2 rounded-md transition-colors"
                      >
                        <Checkbox
                          id={`standard-${standard.id}`}
                          checked={selectedStandardIds.includes(standard.id)}
                          onCheckedChange={() => toggleStandard(standard.id)}
                        />
                        <div className="flex-1 space-y-1">
                          <label
                            htmlFor={`standard-${standard.id}`}
                            className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                          >
                            <Award className="h-3.5 w-3.5 text-primary" />
                            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                              {standard.code}
                            </code>
                          </label>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {standard.title}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Select one or more CONOCER standards to align with this course
            </p>
          </div>

          {/* Selected Standards Summary */}
          {selectedStandardIds.length > 0 && (
            <div className="rounded-md bg-primary/5 p-3">
              <p className="text-sm font-medium mb-2">
                Selected Standards ({selectedStandardIds.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedStandardIds.map((id) => {
                  const standard = standards.find((s) => s.id === id);
                  return standard ? (
                    <code
                      key={id}
                      className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                    >
                      {standard.code}
                    </code>
                  ) : null;
                })}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Course'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
