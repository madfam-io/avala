'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  BookOpen,
  Clock,
  Play,
  CheckCircle2,
  Circle,
  Lock,
  Video,
  ChevronRight,
} from 'lucide-react';
import type { ECModule, ECLesson, ModuleProgress, LessonProgress } from '@/lib/api/ec-api';

interface ModuleListProps {
  modules: ECModule[];
  moduleProgress?: ModuleProgress[];
  lessonProgress?: LessonProgress[];
  onLessonClick?: (lesson: ECLesson, moduleId: string) => void;
  onModuleStart?: (moduleId: string) => void;
  currentLessonId?: string;
}

export function ModuleList({
  modules,
  moduleProgress = [],
  lessonProgress = [],
  onLessonClick,
  onModuleStart,
  currentLessonId,
}: ModuleListProps) {
  const progressMap = new Map(moduleProgress.map((p) => [p.moduleId, p]));
  const lessonProgressMap = new Map(lessonProgress.map((p) => [p.lessonId, p]));

  // Find first incomplete module for default expansion
  const firstIncompleteModule = modules.find((m) => {
    const progress = progressMap.get(m.id);
    return !progress || progress.status !== 'COMPLETED';
  });

  const [expandedModule, setExpandedModule] = useState<string | undefined>(
    firstIncompleteModule?.id || modules[0]?.id
  );

  return (
    <div className="space-y-4">
      <Accordion
        type="single"
        collapsible
        value={expandedModule}
        onValueChange={setExpandedModule}
        className="space-y-3"
      >
        {modules.map((module, moduleIndex) => {
          const progress = progressMap.get(module.id);
          const isCompleted = progress?.status === 'COMPLETED';
          const isInProgress = progress?.status === 'IN_PROGRESS';
          const isLocked = moduleIndex > 0 && !isInProgress && !isCompleted;

          // Get lessons for this module
          const moduleLessons = module.lessons || [];
          const completedLessons = moduleLessons.filter((l) => {
            const lp = lessonProgressMap.get(l.id);
            return lp?.status === 'COMPLETED';
          }).length;

          return (
            <AccordionItem
              key={module.id}
              value={module.id}
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="hover:no-underline px-4 py-3">
                <div className="flex items-center gap-4 flex-1">
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : isInProgress ? (
                      <div className="relative">
                        <Circle className="h-6 w-6 text-blue-500" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play className="h-3 w-3 text-blue-500 fill-current" />
                        </div>
                      </div>
                    ) : isLocked ? (
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>

                  {/* Module Info */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      {module.icon && (
                        <span className="text-lg">{module.icon}</span>
                      )}
                      <h3 className="font-semibold">{module.title}</h3>
                      {isCompleted && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          Completado
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {moduleLessons.length} lecciones
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {module.estimatedMinutes} min
                      </span>
                      {completedLessons > 0 && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          {completedLessons}/{moduleLessons.length}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="hidden sm:flex items-center gap-3 pr-4">
                    {progress && (
                      <>
                        <Progress
                          value={progress.progress}
                          className="w-24 h-2"
                        />
                        <span className="text-sm font-medium w-12 text-right">
                          {progress.progress}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-4 pb-4">
                {module.description && (
                  <p className="text-sm text-muted-foreground mb-4 pl-10">
                    {module.description}
                  </p>
                )}

                {/* Lessons List */}
                <div className="space-y-2 pl-10">
                  {moduleLessons.map((lesson) => {
                    const lessonProg = lessonProgressMap.get(lesson.id);
                    const isLessonCompleted = lessonProg?.status === 'COMPLETED';
                    const isLessonInProgress = lessonProg?.status === 'IN_PROGRESS';
                    const isCurrent = lesson.id === currentLessonId;

                    return (
                      <div
                        key={lesson.id}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer
                          ${isCurrent ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'}
                          ${isLessonCompleted ? 'opacity-75' : ''}
                        `}
                        onClick={() => !isLocked && onLessonClick?.(lesson, module.id)}
                      >
                        {/* Lesson Status */}
                        <div className="flex-shrink-0">
                          {isLessonCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : isLessonInProgress ? (
                            <div className="h-5 w-5 rounded-full border-2 border-blue-500 flex items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-blue-500" />
                            </div>
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>

                        {/* Lesson Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{lesson.title}</span>
                            {lesson.videoId && (
                              <Video className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                            <span>{lesson.estimatedMinutes} min</span>
                            {lessonProg?.videoProgress !== undefined && lessonProg.videoProgress > 0 && (
                              <span className="text-blue-600">
                                Video: {Math.round(lessonProg.videoProgress)}%
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action */}
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>

                {/* Start Module Button */}
                {!isInProgress && !isCompleted && !isLocked && (
                  <div className="mt-4 pl-10">
                    <Button
                      onClick={() => onModuleStart?.(module.id)}
                      className="w-full sm:w-auto"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Comenzar módulo
                    </Button>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
