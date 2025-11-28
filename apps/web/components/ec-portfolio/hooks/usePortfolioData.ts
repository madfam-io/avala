'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  portfolioApi,
  type ECDocument,
  type DocumentTemplate,
} from '@/lib/api/ec-api';

export interface PortfolioStats {
  total: number;
  draft: number;
  pending: number;
  approved: number;
  rejected: number;
  completionPercentage: number;
}

interface UsePortfolioDataOptions {
  enrollmentId: string;
  ecStandardId: string;
}

interface UsePortfolioDataReturn {
  templates: DocumentTemplate[];
  documents: ECDocument[];
  stats: PortfolioStats;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  getDocumentForTemplate: (templateId: string) => ECDocument | undefined;
}

const initialStats: PortfolioStats = {
  total: 0,
  draft: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
  completionPercentage: 0,
};

export function usePortfolioData({
  enrollmentId,
  ecStandardId,
}: UsePortfolioDataOptions): UsePortfolioDataReturn {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [documents, setDocuments] = useState<ECDocument[]>([]);
  const [stats, setStats] = useState<PortfolioStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const calculateStats = useCallback((docs: ECDocument[]): PortfolioStats => {
    return {
      total: docs.length,
      draft: docs.filter(
        (d) => d.status === 'DRAFT' || d.status === 'IN_PROGRESS',
      ).length,
      pending: docs.filter((d) => d.status === 'SUBMITTED').length,
      approved: docs.filter((d) => d.status === 'APPROVED').length,
      rejected: docs.filter((d) => d.status === 'REJECTED').length,
      completionPercentage: 0, // Will be set from API response
    };
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [templatesData, portfolioSummary] = await Promise.all([
        portfolioApi.getTemplates(ecStandardId),
        portfolioApi.getPortfolioSummary(enrollmentId),
      ]);

      setTemplates(templatesData);

      const docs = portfolioSummary.documents || [];
      setDocuments(docs);

      const calculatedStats = calculateStats(docs);
      setStats({
        ...calculatedStats,
        completionPercentage:
          portfolioSummary.completionPercentage ||
          portfolioSummary.overallProgress ||
          0,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load portfolio'));
      console.error('Error loading portfolio:', err);
    } finally {
      setLoading(false);
    }
  }, [enrollmentId, ecStandardId, calculateStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getDocumentForTemplate = useCallback(
    (templateId: string): ECDocument | undefined => {
      return documents.find((doc) => doc.templateId === templateId);
    },
    [documents],
  );

  return {
    templates,
    documents,
    stats,
    loading,
    error,
    refresh: loadData,
    getDocumentForTemplate,
  };
}
