/**
 * TanStack Query hooks for Project and Feature queries
 * Provides data fetching, caching, and mutation management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiResponse } from '@/lib/utils';

// ============================================================================
// Query Key Factory
// ============================================================================

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

export const featureKeys = {
  all: ['features'] as const,
  lists: () => [...featureKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...featureKeys.lists(), filters] as const,
  details: () => [...featureKeys.all, 'detail'] as const,
  detail: (id: string) => [...featureKeys.details(), id] as const,
};

// ============================================================================
// PROJECT QUERIES & MUTATIONS
// ============================================================================

/**
 * Hook to fetch all projects for current org
 */
export function useProjectList() {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: async () => {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to fetch projects');
      return data.data.projects;
    },
  });
}

/**
 * Hook to fetch a specific project by ID
 */
export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/projects/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to fetch project');
      return data.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook to create a new project
 */
export function useCreateProject(options?: { onSuccess?: (data: unknown) => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name: string; description?: string; projectKey: string; branchPattern?: string }) => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to create project');
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      options?.onSuccess?.(data);
    },
  });
}

/**
 * Hook to attach a repository to a project
 */
export function useAttachRepository(projectId: string, options?: { onSuccess?: (data: unknown) => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { fullName: string; defaultBranch?: string }) => {
      const res = await fetch(`/api/projects/${projectId}/repos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to attach repository');
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      options?.onSuccess?.(data);
    },
  });
}

/**
 * Hook to detach a repository from a project
 */
export function useDetachRepository(projectId: string, options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (repoId: string) => {
      const res = await fetch(`/api/projects/${projectId}/repos/${repoId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to detach repository');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      options?.onSuccess?.();
    },
  });
}

// ============================================================================
// FEATURE QUERIES & MUTATIONS
// ============================================================================

/**
 * Hook to fetch all features for current org, with optional filters
 */
export function useFeatureList(filters?: { 
  projectId?: string; 
  status?: string;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: featureKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.projectId) params.set('projectId', filters.projectId);
      if (filters?.status) params.set('status', filters.status);
      if (filters?.sortBy) params.set('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.set('sortOrder', filters.sortOrder);

      const res = await fetch(`/api/features?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to fetch features');
      return data.data.features;
    },
  });
}

/**
 * Hook to fetch a specific feature by ID
 */
export function useFeature(id: string) {
  return useQuery({
    queryKey: featureKeys.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/features/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to fetch feature');
      return data.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook to create a new feature
 */
export function useCreateFeature(options?: { onSuccess?: (data: unknown) => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { projectId: string; title: string; description: string; templateId?: string }) => {
      const res = await fetch('/api/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to create feature');
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: featureKeys.lists() });
      options?.onSuccess?.(data);
    },
  });
}
