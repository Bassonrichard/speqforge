/**
 * Feature Detail Page
 * Shows feature information and spec editor (placeholder for US2)
 */

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useFeature } from '@/hooks/use-projects-features';

interface FeatureDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function FeatureDetailPage({ params }: FeatureDetailPageProps) {
  const [featureId, setFeatureId] = React.useState<string>('');

  React.useEffect(() => {
    if (params instanceof Promise) {
      params.then((p) => setFeatureId(p.id));
    }
  }, [params]);

  const { data: feature, isLoading, error } = useFeature(featureId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
        <div className="h-60 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (error || !feature) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm font-medium text-red-800">Feature not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Feature Info */}
      <div>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{feature.title}</h1>
            <p className="mt-2 text-gray-600">{feature.description}</p>
          </div>
          <Link href="/features">
            <Button variant="outline">Back</Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Status</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{feature.status}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Project</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{feature.project.name}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Created</p>
            <p className="mt-1 text-sm font-mono text-gray-900">
              {new Date(feature.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Repos</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{feature.project.repos.length}</p>
          </div>
        </div>
      </div>

      {/* Spec Editor Placeholder */}
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Spec Generation</h2>
        <p className="text-gray-600 mb-6">
          AI-powered specification generation coming in Phase 3.2
        </p>
        <p className="text-sm text-gray-500">
          The spec editor will appear here once we integrate with your LLM provider
        </p>
      </div>

      {/* Linked Repositories */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Linked Repositories</h2>
        {feature.project.repos.length > 0 ? (
          <div className="space-y-2">
            {feature.project.repos.map((repo: { id: string; fullName: string; defaultBranch: string }) => (
              <div key={repo.id} className="rounded-lg border border-gray-200 p-4">
                <p className="font-medium text-gray-900">{repo.fullName}</p>
                <p className="text-sm text-gray-600">Default: {repo.defaultBranch}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No repositories linked to this project</p>
        )}
      </div>

      {/* Latest Spec */}
      {feature.specs && feature.specs.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Latest Spec Revision</h2>
          <div className="rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              <div>
                <p className="text-sm text-gray-600">Revision</p>
                <p className="text-2xl font-bold text-gray-900">r{feature.specs[0].revNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-lg font-semibold text-gray-900">{feature.specs[0].status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Branch</p>
                <p className="text-sm font-mono text-gray-900">{feature.specs[0].branchName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="text-sm text-gray-900">
                  {new Date(feature.specs[0].createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approvals */}
      {feature.latestApproval && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Approval Status</h2>
          <div className="rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Status</p>
            <p className="text-xl font-semibold text-gray-900 mb-2">{feature.latestApproval.status}</p>
            {feature.latestApproval.comments && (
              <div>
                <p className="text-sm text-gray-600">Comments</p>
                <p className="text-gray-900 mt-1">{feature.latestApproval.comments}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
