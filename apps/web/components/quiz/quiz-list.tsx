"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { QuizCard, Quiz } from "./quiz-card";

interface UserAttempt {
  quizId: string;
  percentage: number;
  passed: boolean;
}

/**
 * QuizList Component
 * Displays available quizzes with search and user progress
 */
export function QuizList() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [startingQuizId, setStartingQuizId] = useState<string | null>(null);
  const [userAttempts, setUserAttempts] = useState<Record<string, UserAttempt[]>>({});

  useEffect(() => {
    fetchQuizzes();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredQuizzes(quizzes);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = quizzes.filter(
        (quiz) =>
          quiz.title.toLowerCase().includes(query) ||
          quiz.code.toLowerCase().includes(query) ||
          quiz.description?.toLowerCase().includes(query),
      );
      setFilteredQuizzes(filtered);
    }
  }, [searchQuery, quizzes]);

  const fetchQuizzes = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get<Quiz[]>("/quiz");
      setQuizzes(data);
      setFilteredQuizzes(data);

      // Fetch user attempts for each quiz
      const attemptsMap: Record<string, UserAttempt[]> = {};
      for (const quiz of data) {
        try {
          const attempts = await apiClient.get<UserAttempt[]>(
            `/quiz/${quiz.id}/attempts`,
          );
          attemptsMap[quiz.id] = attempts;
        } catch {
          attemptsMap[quiz.id] = [];
        }
      }
      setUserAttempts(attemptsMap);
    } catch (error) {
      console.error("Failed to fetch quizzes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartQuiz = async (quizId: string) => {
    try {
      setStartingQuizId(quizId);
      const attempt = await apiClient.post<{ id: string }>(
        `/quiz/${quizId}/start`,
      );
      router.push(`/quiz/${quizId}/take?attempt=${attempt.id}`);
    } catch (error) {
      console.error("Failed to start quiz:", error);
    } finally {
      setStartingQuizId(null);
    }
  };

  const getBestScore = (quizId: string): number | undefined => {
    const attempts = userAttempts[quizId] || [];
    if (attempts.length === 0) return undefined;
    return Math.max(...attempts.map((a) => a.percentage));
  };

  const getAttemptCount = (quizId: string): number => {
    return (userAttempts[quizId] || []).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading quizzes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search quizzes by title, code, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Quiz Grid */}
      {filteredQuizzes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">
            {searchQuery
              ? "No quizzes found matching your search."
              : "No quizzes available yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              userAttempts={getAttemptCount(quiz.id)}
              bestScore={getBestScore(quiz.id)}
              onStart={handleStartQuiz}
              isStarting={startingQuizId === quiz.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
