import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Role } from '@avala/db';

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  tenantId: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
}

interface UserState {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User, tenant: Tenant) => void;
  clearUser: () => void;
}

/**
 * User Store
 * Persists authentication state across page reloads
 * Synced with server via useAuth hook
 */
export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      tenant: null,
      isAuthenticated: false,

      setUser: (user, tenant) =>
        set({
          user,
          tenant,
          isAuthenticated: true,
        }),

      clearUser: () =>
        set({
          user: null,
          tenant: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'avala-user-storage',
      // Only persist user and tenant, not isAuthenticated
      // isAuthenticated will be verified on mount via useAuth
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
      }),
    }
  )
);
