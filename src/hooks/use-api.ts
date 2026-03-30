'use client';

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { useNotification } from '@/store/ui-store';
import type { SessionPayload } from '@/lib/auth';

/**
 * Query key factory for type-safe query key management
 */
export const queryKeys = {
  all: ['api'] as const,
  auth: () => [...queryKeys.all, 'auth'] as const,
  authUser: () => [...queryKeys.auth(), 'user'] as const,
  authOrgs: () => [...queryKeys.auth(), 'orgs'] as const,
  projects: () => [...queryKeys.all, 'projects'] as const,
  projectById: (id: string) => [...queryKeys.projects(), id] as const,
  projectSpecs: (projectId: string) => [...queryKeys.projectById(projectId), 'specs'] as const,
  features: () => [...queryKeys.all, 'features'] as const,
  featureById: (id: string) => [...queryKeys.features(), id] as const,
  featureSpecs: (featureId: string) => [...queryKeys.featureById(featureId), 'specs'] as const,
  specs: () => [...queryKeys.all, 'specs'] as const,
  specById: (id: string) => [...queryKeys.specs(), id] as const,
  specRevisions: (specId: string) => [...queryKeys.specById(specId), 'revisions'] as const,
  specApprovals: (specId: string) => [...queryKeys.specById(specId), 'approvals'] as const,
  templates: () => [...queryKeys.all, 'templates'] as const,
  settings: () => [...queryKeys.all, 'settings'] as const,
  settingsApproval: () => [...queryKeys.settings(), 'approval'] as const,
  settingsLLM: () => [...queryKeys.settings(), 'llm'] as const,
} as const;

/**
 * Hook to fetch current user
 */
export function useAuth(options?: Omit<UseQueryOptions<SessionPayload>, 'queryKey' | 'queryFn'>) {
  return useQuery<SessionPayload>({
    queryKey: queryKeys.authUser(),
    queryFn: async () => {
      const response = await fetch('/api/auth/user');
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch user's organizations
 */
interface Organization {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
}

export function useOrganizations(options?: Omit<UseQueryOptions<Organization[]>, 'queryKey' | 'queryFn'>) {
  return useQuery<Organization[]>({
    queryKey: queryKeys.authOrgs(),
    queryFn: async () => {
      const response = await fetch('/api/auth/organizations');
      if (!response.ok) throw new Error('Failed to fetch organizations');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch all projects in an organization
 */
export function useProjects(
  orgId: string | null,
  options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.projects(),
    queryFn: async () => {
      const response = await fetch(`/api/projects?orgId=${orgId}`);
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    },
    enabled: !!orgId, // Only run if orgId exists
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch a single project
 */
export function useProject(
  projectId: string | null,
  options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.projectById(projectId || ''),
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch project');
      return response.json();
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch all features in a project
 */
export function useFeatures(
  projectId: string | null,
  options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.projectSpecs(projectId || ''),
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/features`);
      if (!response.ok) throw new Error('Failed to fetch features');
      return response.json();
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  });
}

/**
 * Hook to fetch a single feature
 */
export function useFeature(
  featureId: string | null,
  options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.featureById(featureId || ''),
    queryFn: async () => {
      const response = await fetch(`/api/features/${featureId}`);
      if (!response.ok) throw new Error('Failed to fetch feature');
      return response.json();
    },
    enabled: !!featureId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch specs for a feature
 */
export function useSpecs(
  featureId: string | null,
  options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.featureSpecs(featureId || ''),
    queryFn: async () => {
      const response = await fetch(`/api/features/${featureId}/specs`);
      if (!response.ok) throw new Error('Failed to fetch specs');
      return response.json();
    },
    enabled: !!featureId,
    staleTime: 1000 * 60, // 1 minute
    ...options,
  });
}

/**
 * Hook to fetch a single spec
 */
export function useSpec(
  specId: string | null,
  options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.specById(specId || ''),
    queryFn: async () => {
      const response = await fetch(`/api/specs/${specId}`);
      if (!response.ok) throw new Error('Failed to fetch spec');
      return response.json();
    },
    enabled: !!specId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch spec revisions
 */
export function useSpecRevisions(
  specId: string | null,
  options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.specRevisions(specId || ''),
    queryFn: async () => {
      const response = await fetch(`/api/specs/${specId}/revisions`);
      if (!response.ok) throw new Error('Failed to fetch revisions');
      return response.json();
    },
    enabled: !!specId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  });
}

/**
 * Hook to fetch spec approval status
 */
export function useSpecApprovals(
  specId: string | null,
  options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.specApprovals(specId || ''),
    queryFn: async () => {
      const response = await fetch(`/api/specs/${specId}/approvals`);
      if (!response.ok) throw new Error('Failed to fetch approvals');
      return response.json();
    },
    enabled: !!specId,
    staleTime: 1000 * 60, // 1 minute
    ...options,
  });
}

/**
 * Hook to create a new project
 */
export function useCreateProject(
  options?: Omit<
    UseMutationOptions<unknown, Error, { name: string; description?: string; orgId: string }>,
    'mutationFn'
  >
) {
  const queryClient = useQueryClient();
  const notification = useNotification();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; orgId: string }) => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create project');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects() });
      notification.success('Project created successfully');
    },
    onError: (error) => {
      notification.error(error instanceof Error ? error.message : 'Failed to create project');
    },
    ...options,
  });
}

/**
 * Hook to create a new feature
 */
export function useCreateFeature(
  options?: Omit<
    UseMutationOptions<unknown, Error, { name: string; description?: string; projectId: string }>,
    'mutationFn'
  >
) {
  const queryClient = useQueryClient();
  const notification = useNotification();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; projectId: string }) => {
      const response = await fetch('/api/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create feature');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectSpecs(variables.projectId) });
      notification.success('Feature created successfully');
    },
    onError: (error) => {
      notification.error(error instanceof Error ? error.message : 'Failed to create feature');
    },
    ...options,
  });
}

/**
 * Hook to generate a spec
 */
export function useGenerateSpec(
  options?: Omit<
    UseMutationOptions<
      unknown,
      Error,
      { featureId: string; prompt: string; llmProvider?: string }
    >,
    'mutationFn'
  >
) {
  const queryClient = useQueryClient();
  const notification = useNotification();

  return useMutation({
    mutationFn: async (data: {
      featureId: string;
      prompt: string;
      llmProvider?: string;
    }) => {
      const response = await fetch('/api/specs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to generate spec');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.featureSpecs(variables.featureId) });
      notification.success('Spec generated successfully');
    },
    onError: (error) => {
      notification.error(error instanceof Error ? error.message : 'Failed to generate spec');
    },
    ...options,
  });
}

/**
 * Hook to approve a spec
 */
export function useApproveSpec(
  options?: Omit<
    UseMutationOptions<unknown, Error, { specId: string; comment?: string }>,
    'mutationFn'
  >
) {
  const queryClient = useQueryClient();
  const notification = useNotification();

  return useMutation({
    mutationFn: async (data: { specId: string; comment?: string }) => {
      const response = await fetch(`/api/specs/${data.specId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: data.comment }),
      });
      if (!response.ok) throw new Error('Failed to approve spec');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.specApprovals(variables.specId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.specById(variables.specId) });
      notification.success('Spec approved successfully');
    },
    onError: (error) => {
      notification.error(error instanceof Error ? error.message : 'Failed to approve spec');
    },
    ...options,
  });
}

/**
 * Hook to fetch spec templates
 */
export function useTemplates(options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.templates(),
    queryFn: async () => {
      const response = await fetch('/api/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    ...options,
  });
}

/**
 * Hook to fetch approval settings
 */
export function useApprovalSettings(options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.settingsApproval(),
    queryFn: async () => {
      const response = await fetch('/api/settings/approval');
      if (!response.ok) throw new Error('Failed to fetch approval settings');
      return response.json();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    ...options,
  });
}

/**
 * Hook to fetch LLM settings
 */
export function useLLMSettings(options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.settingsLLM(),
    queryFn: async () => {
      const response = await fetch('/api/settings/llm');
      if (!response.ok) throw new Error('Failed to fetch LLM settings');
      return response.json();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    ...options,
  });
}
