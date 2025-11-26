/**
 * @avala/client/react - React Hooks for Learning & Competency
 *
 * React bindings for AVALA SDK with caching, loading states,
 * and real-time updates for team certification dashboards.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import {
  AvalaClient,
  createAvalaClient,
  type AvalaConfig,
  type Employee,
  type Competency,
  type CompetencyRecord,
  type Badge,
  type DC3Form,
  type TeamCompetencyReport,
  type ExpirationAlert,
  type PaginatedResponse,
  type CompetencyStatus,
  type CompetencyLevel,
  getCompetencyLevelLabel,
  getCompetencyStatusColor,
  getDC3StatusLabel,
  daysUntilExpiration,
  isExpiringSoon,
} from './index';

// ============================================================================
// Context
// ============================================================================

interface AvalaContextValue {
  client: AvalaClient;
  isConfigured: boolean;
}

const AvalaContext = createContext<AvalaContextValue | null>(null);

export interface AvalaProviderProps {
  config: AvalaConfig;
  children: ReactNode;
}

/**
 * Provider component for AVALA SDK
 */
export function AvalaProvider({ config, children }: AvalaProviderProps) {
  const client = useMemo(() => createAvalaClient(config), [config]);

  const value = useMemo(
    () => ({
      client,
      isConfigured: Boolean(config.baseURL),
    }),
    [client, config.baseURL]
  );

  return (
    <AvalaContext.Provider value={value}>{children}</AvalaContext.Provider>
  );
}

/**
 * Hook to access the AVALA client
 */
export function useAvala(): AvalaClient {
  const context = useContext(AvalaContext);
  if (!context) {
    throw new Error('useAvala must be used within an AvalaProvider');
  }
  return context.client;
}

// ============================================================================
// Query Hooks
// ============================================================================

interface UseQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch employees
 */
export function useEmployees(options?: {
  department?: string;
  status?: 'active' | 'inactive';
}): UseQueryResult<PaginatedResponse<Employee>> {
  const client = useAvala();
  const [data, setData] = useState<PaginatedResponse<Employee> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await client.getEmployees(options);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch employees'));
    } finally {
      setIsLoading(false);
    }
  }, [client, JSON.stringify(options)]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

/**
 * Hook to fetch a single employee with their records
 */
export function useEmployee(id: string): UseQueryResult<Employee> {
  const client = useAvala();
  const [data, setData] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await client.getEmployee(id);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch employee'));
    } finally {
      setIsLoading(false);
    }
  }, [client, id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

/**
 * Hook to fetch competencies catalog
 */
export function useCompetencies(options?: {
  category?: string;
  level?: CompetencyLevel;
}): UseQueryResult<PaginatedResponse<Competency>> {
  const client = useAvala();
  const [data, setData] = useState<PaginatedResponse<Competency> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await client.getCompetencies(options);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch competencies'));
    } finally {
      setIsLoading(false);
    }
  }, [client, JSON.stringify(options)]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

/**
 * Hook to fetch team competency report
 */
export function useTeamCompetencyReport(
  teamId: string
): UseQueryResult<TeamCompetencyReport> {
  const client = useAvala();
  const [data, setData] = useState<TeamCompetencyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!teamId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await client.getTeamCompetencyReport(teamId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch report'));
    } finally {
      setIsLoading(false);
    }
  }, [client, teamId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

/**
 * Hook to fetch expiration alerts
 */
export function useExpirationAlerts(
  daysAhead: number = 30
): UseQueryResult<ExpirationAlert[]> {
  const client = useAvala();
  const [data, setData] = useState<ExpirationAlert[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await client.getExpirationAlerts(daysAhead);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch alerts'));
    } finally {
      setIsLoading(false);
    }
  }, [client, daysAhead]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

/**
 * Hook to fetch employee badges
 */
export function useEmployeeBadges(employeeId: string): UseQueryResult<Badge[]> {
  const client = useAvala();
  const [data, setData] = useState<Badge[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!employeeId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await client.getEmployeeBadges(employeeId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch badges'));
    } finally {
      setIsLoading(false);
    }
  }, [client, employeeId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

/**
 * Hook to fetch employee DC-3 forms
 */
export function useEmployeeDC3Forms(employeeId: string): UseQueryResult<DC3Form[]> {
  const client = useAvala();
  const [data, setData] = useState<DC3Form[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!employeeId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await client.getEmployeeDC3Forms(employeeId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch DC-3 forms'));
    } finally {
      setIsLoading(false);
    }
  }, [client, employeeId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook for badge verification
 */
export function useBadgeVerification() {
  const client = useAvala();
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<{
    valid: boolean;
    badge?: Badge;
    employee?: { id: string; name: string };
    message: string;
  } | null>(null);

  const verify = useCallback(
    async (badgeId: string) => {
      setIsVerifying(true);
      try {
        const verification = await client.verifyBadge(badgeId);
        setResult(verification);
        return verification;
      } finally {
        setIsVerifying(false);
      }
    },
    [client]
  );

  const reset = useCallback(() => {
    setResult(null);
  }, []);

  return { verify, isVerifying, result, reset };
}

/**
 * Hook for DC-3 form operations
 */
export function useDC3Operations() {
  const client = useAvala();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createForm = useCallback(
    async (data: {
      employeeId: string;
      courseId: string;
      startDate: string;
      endDate: string;
    }) => {
      setIsSubmitting(true);
      try {
        return await client.createDC3Form(data);
      } finally {
        setIsSubmitting(false);
      }
    },
    [client]
  );

  const signForm = useCallback(
    async (
      dc3Id: string,
      signature: { employeeSignature: string; supervisorSignature?: string }
    ) => {
      setIsSubmitting(true);
      try {
        return await client.signDC3Form(dc3Id, signature);
      } finally {
        setIsSubmitting(false);
      }
    },
    [client]
  );

  const submitToSirce = useCallback(
    async (dc3Id: string) => {
      setIsSubmitting(true);
      try {
        return await client.submitDC3ToSirce(dc3Id);
      } finally {
        setIsSubmitting(false);
      }
    },
    [client]
  );

  const downloadPdf = useCallback(
    async (dc3Id: string) => {
      const blob = await client.downloadDC3Pdf(dc3Id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dc3-${dc3Id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [client]
  );

  return { createForm, signForm, submitToSirce, downloadPdf, isSubmitting };
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to get competency status display info
 */
export function useCompetencyStatusDisplay(status: CompetencyStatus) {
  return useMemo(() => {
    const labels: Record<CompetencyStatus, string> = {
      not_started: 'No iniciado',
      in_progress: 'En progreso',
      assessed: 'Evaluado',
      certified: 'Certificado',
      expired: 'Expirado',
    };

    return {
      status,
      label: labels[status],
      color: getCompetencyStatusColor(status),
    };
  }, [status]);
}

/**
 * Hook to calculate compliance metrics
 */
export function useComplianceMetrics(competencyRecords: CompetencyRecord[]) {
  return useMemo(() => {
    const total = competencyRecords.length;
    const certified = competencyRecords.filter(
      (r) => r.status === 'certified'
    ).length;
    const expired = competencyRecords.filter(
      (r) => r.status === 'expired'
    ).length;
    const inProgress = competencyRecords.filter(
      (r) => r.status === 'in_progress'
    ).length;
    const expiringSoon = competencyRecords.filter(
      (r) => r.expiresAt && isExpiringSoon(r.expiresAt)
    ).length;

    return {
      total,
      certified,
      expired,
      inProgress,
      expiringSoon,
      complianceRate: total > 0 ? Math.round((certified / total) * 100) : 0,
    };
  }, [competencyRecords]);
}

// ============================================================================
// Re-exports
// ============================================================================

export {
  AvalaClient,
  createAvalaClient,
  AvalaError,
  getCompetencyLevelLabel,
  getCompetencyStatusColor,
  getDC3StatusLabel,
  daysUntilExpiration,
  isExpiringSoon,
} from './index';

export type {
  AvalaConfig,
  Employee,
  Competency,
  CompetencyRecord,
  Badge,
  DC3Form,
  TeamCompetencyReport,
  ExpirationAlert,
  PaginatedResponse,
  CompetencyStatus,
  CompetencyLevel,
  Course,
  LearningPath,
  Evidence,
} from './index';
