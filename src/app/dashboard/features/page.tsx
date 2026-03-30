/**
 * Features List Page
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useFeatureList, useProjectList } from '@/hooks/use-projects-features';

export default function FeaturesPage() {
  const [projectId, setProjectId] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  const { data: projects = [] } = useProjectList();
  const { data: features = [], isLoading, error } = useFeatureList({
    ...(projectId ? { projectId } : {}),
    ...(status ? { status } : {}),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
        <div className="h-60 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm font-medium text-red-800">Failed to load features</p>
      </div>
    );
  }

  const statuses = ['DRAFT', 'APPROVED', 'HANDED_OFF', 'IN_PROGRESS', 'IN_MERGE', 'COMPLETE'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Features</h1>
          <p className="mt-1 text-gray-600">Create and manage feature specifications</p>
        </div>
        <Link href="/features/new">
          <Button>New Feature</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 max-w-sm">
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Project</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Projects</option>
            {projects.map((p: { id: string; name: string; projectKey: string }) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.projectKey})
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 max-w-sm">
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {features.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No features found</h3>
          <p className="text-gray-600 mb-6">Create your first feature to get started</p>
          <Link href="/features/new">
            <Button>Create Feature</Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Title</th>
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Project</th>
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Status</th>
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Created</th>
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature: { id: string; title: string; description: string; projectName: string; projectKey: string; status: string; createdAt: string | Date }) => (
                <tr key={feature.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3">
                    <p className="font-medium text-gray-900">{feature.title}</p>
                    <p className="text-sm text-gray-600 truncate">{feature.description}</p>
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <p className="text-sm">{feature.projectName}</p>
                    <p className="text-xs text-gray-600">{feature.projectKey}</p>
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-900">
                      {feature.status}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-sm text-gray-600">
                    {new Date(feature.createdAt).toLocaleDateString()}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <Link href={`/features/${feature.id}`}>
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
      )}
    </div>
  );
}
