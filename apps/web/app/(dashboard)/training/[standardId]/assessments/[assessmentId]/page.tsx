"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { QuizPlayer, QuizResults } from "@/components/ec-assessment";
import {
  assessmentApi,
  trainingApi,
  type ECAssessment,
  type ECEnrollment,
} from "@/lib/api/ec-api";

type QuizResult = {
  score: number;
  passed: boolean;
  totalPoints: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent?: number;
  feedback?: string;
  detailedResults?: {
    questionId: string;
    questionText: string;
    correct: boolean;
    userAnswer: string | string[];
    correctAnswer: string | string[];
    explanation?: string;
  }[];
};

export default function AssessmentPlayerPage() {
  const params = useParams();
  const router = useRouter();

  const standardId = params.standardId as string;
  const assessmentId = params.assessmentId as string;

  const [assessment, setAssessment] = useState<ECAssessment | null>(null);
  const [enrollment, setEnrollment] = useState<ECEnrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [attemptsUsed, setAttemptsUsed] = useState(0);

  useEffect(() => {
    loadData();
  }, [assessmentId, standardId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assessmentData, enrollmentsResult] = await Promise.all([
        assessmentApi.getAssessment(assessmentId),
        trainingApi.getEnrollments({ ecStandardId: standardId }),
      ]);

      setAssessment(assessmentData);

      if (enrollmentsResult.data.length > 0) {
        setEnrollment(enrollmentsResult.data[0]);

        // Get attempts count
        const enrollmentWithMeta = enrollmentsResult.data[0] as unknown as {
          assessmentProgress?: Record<string, { attempts?: number }>;
        };
        const assessmentProgress = enrollmentWithMeta.assessmentProgress || {};
        setAttemptsUsed(assessmentProgress[assessmentId]?.attempts || 0);
      } else {
        router.push(`/training/${standardId}`);
      }
    } catch (error) {
      console.error("Error loading assessment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = (quizResult: QuizResult) => {
    setResult(quizResult);
    setAttemptsUsed((prev) => prev + 1);
  };

  const handleRetry = () => {
    setResult(null);
  };

  const handleContinue = () => {
    router.push(`/training/${standardId}/learn?tab=assessments`);
  };

  const handleExit = () => {
    router.push(`/training/${standardId}/assessments`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!assessment || !enrollment) {
    return (
      <div className="container py-8 text-center">
        <h2 className="text-xl font-semibold">Evaluación no encontrada</h2>
        <Button
          variant="link"
          onClick={() => router.push(`/training/${standardId}/assessments`)}
          className="mt-4"
        >
          Volver a evaluaciones
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container py-4">
          <Button variant="ghost" size="sm" onClick={handleExit}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Salir de la evaluación
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="container py-8">
        {result ? (
          <QuizResults
            result={result}
            passingScore={assessment.passingScore || 70}
            maxAttempts={assessment.maxAttempts}
            attemptsUsed={attemptsUsed}
            onRetry={handleRetry}
            onContinue={handleContinue}
          />
        ) : (
          <QuizPlayer
            assessment={assessment}
            enrollmentId={enrollment.id}
            onComplete={handleComplete}
            onExit={handleExit}
          />
        )}
      </div>
    </div>
  );
}
