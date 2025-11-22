'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Role } from '@avala/db';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  status: string;
  curp: string | null;
  rfc: string | null;
  createdAt: string;
}

interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UseUsersOptions {
  page?: number;
  limit?: number;
  role?: Role;
  status?: string;
  search?: string;
}

export function useUsers(options: UseUsersOptions = {}) {
  const { page = 1, limit = 10, role, status, search } = options;

  const queryKey = ['users', { page, limit, role, status, search }];

  return useQuery<PaginatedUsers>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (role) params.append('role', role);
      if (status) params.append('status', status);
      if (search) params.append('search', search);

      const data = await apiClient.get<PaginatedUsers>(
        `/users?${params.toString()}`
      );
      return data;
    },
  });
}

interface CreateUserData {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role: Role;
  curp?: string;
  rfc?: string;
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserData) => {
      return await apiClient.post<User>('/users', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
