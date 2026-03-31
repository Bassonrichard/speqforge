/**
 * Project Detail Page
 * Shows project info, linked repositories, and features
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RepoSelector } from '@/components/feature-form/repo-selector';
import { useProject, useDetachRepository } from '@/hooks/use-projects-features';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const [showRepoForm, setShowRepoForm] = useState(false);

  // Handle async params properly
  const [projectId, setProjectId] = useState<string>('');

  useEffect(() => {
    if (params instanceof Promise) {
      params.then((p) => {
        setProjectId(p.id);
      });
    } else {
      setProjectId((params as any).id);
    }
  }, [params]);

  const { data: project = null, isLoading } = useProject(projectId);
  const detachRepo = useDetachRepository(projectId, {
    onSuccess: () => setShowRepoForm(false),
  });

  if (!projectId || isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
        <div className="h-60 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm font-medium text-red-800">Project not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Project Info */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            {project.description && <p className="mt-1 text-gray-600">{project.description}</p>}
          </div>
          <Link href="/dashboard/projects">
            <Button variant="outline">Back to Projects</Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Project Key</p>
            <p className="text-lg font-mono font-bold">{project.projectKey}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Branch Pattern</p>
            <p className="text-sm font-mono">{project.branchPattern}</p>
          </div>
        </div>
      </div>

      {/* Repositories */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Repositories</h2>
          <Button variant="outline" onClick={() => setShowRepoForm(!showRepoForm)}>
            {showRepoForm ? 'Cancel' : 'Attach Repository'}
          </Button>
        </div>

        {showRepoForm && (
          <div className="rounded-lg border border-gray-200 p-6 mb-6">
            <RepoSelector projectId={projectId} onSuccess={() => setShowRepoForm(false)} />
          </div>
        )}

        {project.repos && project.repos.length > 0 ? (
          <div className="space-y-2">
            {project.repos.map((repo: { id: string; fullName: string; defaultBranch: string }) => (
              <div key={repo.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                <div>
                  <p className="font-medium text-gray-900">{repo.fullName}</p>
                  <p className="text-sm text-gray-600">Default: {repo.defaultBranch}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={detachRepo.isPending}
                  onClick={() => detachRepo.mutate(repo.id)}
                >
                  Detach
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No repositories attached yet</p>
        )}
      </div>

      {/* Features */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Features</h2>
          <Link href={`/dashboard/features/new?projectId=${projectId}`}>
            <Button>New Feature</Button>
          </Link>
        </div>

        {project.features && project.features.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Title</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Status</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Created</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {project.features.map((feature: { id: string; title: string; status: string; createdAt: string | Date }) => (
                  <tr key={feature.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-medium">{feature.title}</td>
                    <td className="border border-gray-300 px-4 py-3">
                      <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-900">
                        {feature.status}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-600">
                      {new Date(feature.createdAt).toLocaleDateString()}
                    </td>
                    <td className="border border-gray-300 px-4 py-3">
                      <Link href={`/dashboard/features/${feature.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">No features yet</p>
        )}
      </div>
    </div>
  );
}
