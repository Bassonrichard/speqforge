/**
 * Feature Detail Page
 * Shows feature information and spec editor (placeholder for US2)
 */

'use client';

import Link from 'next/link';
import React from 'react';
import { Button } from '@/components/ui/button';
import { useFeature } from '@/hooks/use-projects-features';
import { useFeatureHistory } from '@/hooks/use-feature-history';
import { SpecEditor } from '@/components/spec-editor/spec-editor';
import { StatusBadge, type FeatureStatus } from '@/components/ui/status-badge';
import { StatusTimeline } from '@/components/ui/status-timeline';
import { ReviewerSelector } from '@/components/feature-approval/reviewer-selector';
import { ApprovalStatus } from '@/components/feature-approval/approval-status';

interface FeatureDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function FeatureDetailPage({ params }: FeatureDetailPageProps) {
  const [featureId, setFeatureId] = React.useState<string>('');
  const [orgId, setOrgId] = React.useState<string | null>(null);
  const [organization, setOrganization] = React.useState<{
    approvalThreshold: 'SINGLE' | 'UNANIMOUS' | 'MAJORITY';
  } | null>(null);

  React.useEffect(() => {
    if (params instanceof Promise) {
      params.then((p) => setFeatureId(p.id));
    }
  }, [params]);

  const { data: feature, isLoading, error, refetch } = useFeature(featureId);
  const { data: history, isLoading: historyLoading } = useFeatureHistory(featureId);

  // Load session and organization data
  React.useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionResponse = await fetch('/api/auth/user');
        if (!sessionResponse.ok) return;
        
        const sessionData = await sessionResponse.json();
        const currentOrgId = sessionData.orgId || sessionData.data?.orgId;
        setOrgId(currentOrgId);

        if (currentOrgId) {
          const orgResponse = await fetch(`/api/auth/organizations/${currentOrgId}`);
          if (orgResponse.ok) {
            const result = await orgResponse.json();
            const data = result.data || result;
            setOrganization({
              approvalThreshold: data.organization.approvalThreshold,
            });
          }
        }
      } catch (err) {
        console.error('Failed to load session/org data:', err);
      }
    };

    loadSession();
  }, []);

  const handleStatusTransition = async (newStatus: FeatureStatus) => {
    if (!featureId) return;

    try {
      const response = await fetch(`/api/features/${featureId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Failed to update status: ${error.error}`);
        return;
      }

      // Refresh the feature data
      window.location.reload();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status. Please try again.');
    }
  };

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
            <div className="mt-2">
              <StatusBadge status={feature.status as FeatureStatus} />
            </div>
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

      {/* Status Actions */}
      <div className="rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Status Actions</h2>
        <div className="flex flex-wrap gap-3">
          {feature.status === 'DRAFT' && (
            <Button onClick={() => handleStatusTransition('IN_REVIEW')}>
              Request Review
            </Button>
          )}
          {feature.status === 'IN_REVIEW' && (
            <>
              <Button onClick={() => handleStatusTransition('APPROVED')}>
                Approve
              </Button>
              <Button
                variant="outline"
                onClick={() => handleStatusTransition('REJECTED')}
              >
                Reject
              </Button>
            </>
          )}
          {feature.status === 'REJECTED' && (
            <Button onClick={() => handleStatusTransition('DRAFT')}>
              Return to Draft
            </Button>
          )}
          {feature.status === 'APPROVED' && (
            <Button onClick={() => handleStatusTransition('HANDED_OFF')}>
              Hand Off to Engineering
            </Button>
          )}
          {['HANDED_OFF', 'IN_PROGRESS', 'COMPLETE'].includes(feature.status) && (
            <p className="text-sm text-gray-600 py-2">
              Status is automatically managed by GitHub integration
            </p>
          )}
        </div>
      </div>

      {/* Spec Editor */}
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Specification</h2>
        </div>
        <SpecEditor featureId={featureId} />
      </div>

      {/* Status History Timeline */}
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Status History</h2>
        </div>
        <div className="p-6">
          {historyLoading ? (
            <div className="h-32 animate-pulse rounded bg-gray-200" />
          ) : (
            <StatusTimeline
              entries={(history || []).map((h) => ({
                ...h,
                status: h.status as FeatureStatus,
                timestamp: new Date(h.timestamp),
              }))}
            />
          )}
        </div>
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

      {/* Approval Workflow */}
      {feature.status === 'DRAFT' && !feature.latestApproval && (
        <ReviewerSelector
          featureId={featureId}
          onReviewRequested={() => {
            refetch();
          }}
        />
      )}

      {feature.latestApproval && organization && (
        <ApprovalStatus
          featureId={featureId}
          approval={feature.latestApproval}
          organization={organization}
          onApprovalChange={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
}
