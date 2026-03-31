/**
 * Reviewer Selector Component (T158)
 * Allows feature owner to select reviewers and request approval
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  orgRole: 'owner' | 'admin' | 'member' | 'approver' | 'reviewer';
}

interface ReviewerSelectorProps {
  featureId: string;
  onReviewRequested?: () => void;
}

export function ReviewerSelector({ featureId, onReviewRequested }: ReviewerSelectorProps) {
  const [orgId, setOrgId] = React.useState<string | null>(null);
  const [orgMembers, setOrgMembers] = React.useState<User[]>([]);
  const [selectedReviewers, setSelectedReviewers] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load session and org members
  React.useEffect(() => {
    const loadData = async () => {
      try {
        // Get current session
        const sessionResponse = await fetch('/api/auth/user');
        if (!sessionResponse.ok) return;
        
        const sessionData = await sessionResponse.json();
        const currentOrgId = sessionData.orgId || sessionData.data?.orgId;
        setOrgId(currentOrgId);

        if (!currentOrgId) return;

        // Load org members
        const response = await fetch(`/api/auth/organizations/${currentOrgId}/members`);
        if (!response.ok) throw new Error('Failed to load org members');
        
        const result = await response.json();
        const data = result.data || result;
        // Filter to only approver/reviewer roles
        const reviewerUsers = (data.members || []).filter(
          (m: User) => m.orgRole === 'approver' || m.orgRole === 'reviewer'
        );
        setOrgMembers(reviewerUsers);
      } catch (err) {
        console.error('Failed to load members:', err);
        setError('Could not load reviewers');
      }
    };

    loadData();
  }, []);

  const handleToggleReviewer = (userId: string) => {
    setSelectedReviewers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleRequestReview = async () => {
    if (selectedReviewers.length === 0) {
      setError('Please select at least one reviewer');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/features/${featureId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request-review',
          reviewers: selectedReviewers,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to request review');
      }

      // Success
      setSelectedReviewers([]);
      onReviewRequested?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request review');
    } finally {
      setLoading(false);
    }
  };

  if (orgMembers.length === 0 && !error) {
    return (
      <div className="rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Review</h3>
        <p className="text-sm text-gray-600">
          No reviewers available in your organization. Assign APPROVER or REVIEWER roles to team members.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Review</h3>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-2 mb-4">
        {orgMembers.map((member) => (
          <label
            key={member.id}
            className="flex items-center gap-3 p-3 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedReviewers.includes(member.id)}
              onChange={() => handleToggleReviewer(member.id)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900">{member.name || 'Unnamed User'}</p>
              <p className="text-xs text-gray-600">{member.email}</p>
            </div>
            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
              {member.orgRole.toUpperCase()}
            </span>
          </label>
        ))}
      </div>

      <Button
        onClick={handleRequestReview}
        disabled={loading || selectedReviewers.length === 0}
        className="w-full"
      >
        {loading ? 'Requesting Review...' : `Request Review (${selectedReviewers.length} selected)`}
      </Button>
    </div>
  );
}
