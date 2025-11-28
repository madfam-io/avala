"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Clock,
  BookOpen,
  Video,
  FileText,
} from "lucide-react";
import type { ECLesson, ECModule, LessonProgress } from "@/lib/api/ec-api";

interface LessonViewerProps {
  lesson: ECLesson;
  module: ECModule;
  progress?: LessonProgress;
  onBack?: () => void;
  onNext?: () => void;
  onComplete?: () => void;
  onVideoProgress?: (progress: number) => void;
  hasNextLesson?: boolean;
  hasPrevLesson?: boolean;
}

export function LessonViewer({
  lesson,
  module,
  progress,
  onBack,
  onNext,
  onComplete,
  onVideoProgress,
  hasNextLesson = false,
  hasPrevLesson = false,
}: LessonViewerProps) {
  const [videoProgress, setVideoProgress] = useState(
    progress?.videoProgress || 0,
  );
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLIFrameElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isCompleted = progress?.status === "COMPLETED";

  // Track video progress
  useEffect(() => {
    if (isVideoPlaying && lesson.videoId && lesson.videoDuration) {
      progressIntervalRef.current = setInterval(() => {
        setVideoProgress((prev) => {
          const newProgress = Math.min(prev + 100 / lesson.videoDuration!, 100);
          return newProgress;
        });
      }, 1000);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isVideoPlaying, lesson.videoId, lesson.videoDuration]);

  // Report video progress periodically
  useEffect(() => {
    if (videoProgress > 0 && videoProgress !== progress?.videoProgress) {
      const debounce = setTimeout(() => {
        onVideoProgress?.(videoProgress);
      }, 2000);
      return () => clearTimeout(debounce);
    }
    return undefined;
  }, [videoProgress, progress?.videoProgress, onVideoProgress]);

  const handleComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  // Auto-mark complete when video reaches 90%
  useEffect(() => {
    if (videoProgress >= 90 && !isCompleted) {
      handleComplete();
    }
  }, [videoProgress, isCompleted, handleComplete]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            disabled={!hasPrevLesson}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {module.icon} {module.title}
              </Badge>
              {isCompleted && (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-700"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completado
                </Badge>
              )}
            </div>
            <h1 className="text-lg font-semibold mt-1">{lesson.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {lesson.estimatedMinutes} min
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNext}
            disabled={!hasNextLesson}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Video Player */}
          {lesson.videoId && (
            <Card>
              <CardContent className="p-0">
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe
                    ref={videoRef}
                    src={`https://www.youtube.com/embed/${lesson.videoId}?enablejsapi=1&rel=0`}
                    title={lesson.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                {/* Video Progress */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Progreso del video
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(videoProgress)}%
                    </span>
                  </div>
                  <Progress value={videoProgress} className="h-2" />

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                    >
                      {isVideoPlaying ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pausar seguimiento
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Iniciar seguimiento
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setVideoProgress(0)}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reiniciar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lesson Sections */}
          {lesson.sections.map((section) => (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {section.type === "video" && <Video className="h-5 w-5" />}
                  {section.type === "text" && <FileText className="h-5 w-5" />}
                  {section.type === "interactive" && (
                    <BookOpen className="h-5 w-5" />
                  )}
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {section.content && (
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                )}
              </CardContent>
            </Card>
          ))}

          {/* Empty State */}
          {lesson.sections.length === 0 && !lesson.videoId && (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  Contenido en desarrollo
                </h3>
                <p className="text-muted-foreground">
                  El contenido de esta lección estará disponible pronto.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* Footer Navigation */}
      <div className="border-t px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button variant="outline" onClick={onBack} disabled={!hasPrevLesson}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          <div className="flex items-center gap-3">
            {!isCompleted && (
              <Button variant="outline" onClick={handleComplete}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Marcar como completado
              </Button>
            )}

            <Button onClick={onNext} disabled={!hasNextLesson}>
              Siguiente
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
