import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

/**
 * User session information from GitHub OAuth
 */
export interface AuthUser {
  id: string;
  githubId: number;
  username: string;
  email: string | null;
  avatarUrl: string | null;
  currentOrgId: string | null;
}

/**
 * Organization context
 */
export interface AuthOrganization {
  id: string;
  name: string;
  slug: string;
  avatarUrl: string | null;
  role: 'owner' | 'admin' | 'member';
}

/**
 * Auth store state and actions
 */
interface AuthStoreState {
  // Auth state
  user: AuthUser | null;
  organizations: AuthOrganization[];
  currentOrg: AuthOrganization | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: AuthUser | null) => void;
  setOrganizations: (orgs: AuthOrganization[]) => void;
  setCurrentOrg: (org: AuthOrganization | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  switchOrganization: (orgId: string) => void;
  logout: () => void;
}

/**
 * Auth store - manages authentication state across app
 * Persisted to localStorage
 */
export const useAuthStore = create<AuthStoreState>()(
  persist(
    immer((set) => ({
      user: null,
      organizations: [],
      currentOrg: null,
      isLoading: false,
      error: null,

      setUser: (user) => {
        set((state) => {
          state.user = user;
        });
      },

      setOrganizations: (organizations) => {
        set((state) => {
          state.organizations = organizations;
          // Auto-select first org if none selected
          if (organizations.length > 0 && !state.currentOrg) {
            state.currentOrg = organizations[0];
          }
        });
      },

      setCurrentOrg: (org) => {
        set((state) => {
          state.currentOrg = org;
        });
      },

      setIsLoading: (loading) => {
        set((state) => {
          state.isLoading = loading;
        });
      },

      setError: (error) => {
        set((state) => {
          state.error = error;
        });
      },

      switchOrganization: (orgId) => {
        set((state) => {
          const org = state.organizations.find((o) => o.id === orgId);
          if (org) {
            state.currentOrg = org;
            state.error = null;
          } else {
            state.error = 'Organization not found';
          }
        });
      },

      logout: () => {
        set((state) => {
          state.user = null;
          state.organizations = [];
          state.currentOrg = null;
          state.error = null;
        });
      },
    })),
    {
      name: 'auth-store',
      version: 1,
    }
  )
);

/**
 * Check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const user = useAuthStore((state) => state.user);
  return user !== null;
}

/**
 * Check if user has admin role in current organization
 */
export function useIsOrgAdmin(): boolean {
  const currentOrg = useAuthStore((state) => state.currentOrg);
  return currentOrg?.role === 'owner' || currentOrg?.role === 'admin';
}

/**
 * Get current user ID
 */
export function useCurrentUserId(): string | null {
  return useAuthStore((state) => state.user?.id || null);
}

/**
 * Get current organization ID
 */
export function useCurrentOrgId(): string | null {
  return useAuthStore((state) => state.currentOrg?.id || null);
}
