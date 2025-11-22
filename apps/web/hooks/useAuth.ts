'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useUserStore, User, Tenant } from '@/store/user-store';

interface AuthResponse {
  user: User;
  tenant: Tenant;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse extends AuthResponse {
  accessToken: string;
}

/**
 * useAuth Hook
 * The "brain" of the application - syncs server session to client state
 *
 * Features:
 * - Fetches current user from /v1/auth/me
 * - Syncs with Zustand store
 * - Provides login/logout mutations
 * - Auto-redirects on auth state changes
 */
export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, tenant, setUser, clearUser } = useUserStore();

  /**
   * Query: Get current authenticated user
   * Runs on mount and syncs with Zustand
   */
  const {
    data: authData,
    isLoading,
    error,
    refetch,
  } = useQuery<AuthResponse>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const data = await apiClient.get<AuthResponse>('/auth/me');
        return data;
      } catch (err: any) {
        // If 401, clear user state
        if (err.statusCode === 401) {
          clearUser();
        }
        throw err;
      }
    },
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /**
   * Mutation: Login
   */
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const data = await apiClient.post<LoginResponse>('/auth/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      // Update Zustand store
      setUser(data.user, data.tenant);

      // Set tenant ID in API client for subsequent requests
      apiClient.setTenantId(data.user.tenantId);

      // Invalidate auth query to refetch
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });

      // Redirect to dashboard
      router.push('/dashboard');
    },
  });

  /**
   * Mutation: Logout
   */
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout');
    },
    onSuccess: () => {
      // Clear Zustand store
      clearUser();

      // Clear API client tenant
      apiClient.clearTenantId();

      // Clear all queries
      queryClient.clear();

      // Redirect to login
      router.push('/login');
    },
  });

  /**
   * Sync Zustand store with query data
   */
  if (authData && authData.user && !user) {
    setUser(authData.user, authData.tenant);
    apiClient.setTenantId(authData.user.tenantId);
  }

  return {
    // State
    user: user || authData?.user || null,
    tenant: tenant || authData?.tenant || null,
    isAuthenticated: !!user || !!authData?.user,
    isLoading,
    error,

    // Actions
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    refetch,

    // Mutation states
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
  };
}
