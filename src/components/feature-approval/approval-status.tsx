/**
 * Approval Status Component (T161)
 * Shows approval progress, assigned reviewers, and approval actions
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { format } from 'date-fns';

interface Reviewer {
  id: string;
  name: string | null;
  email: string | null;
}

interface ApprovalData {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedBy: string;
  requestedAt: string;
  reviewers: string[]; // JSON array of user IDs
  approvedBy: string[]; // JSON array of user IDs
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  comments?: string | null;
}

interface Organization {
  approvalThreshold: 'SINGLE' | 'UNANIMOUS' | 'MAJORITY';
}

interface ApprovalStatusProps {
  featureId: string;
  approval: ApprovalData | null;
  organization: Organization;
  onApprovalChange?: () => void;
}

export function ApprovalStatus({ 
  featureId, 
  approval, 
  organization,
  onApprovalChange 
}: ApprovalStatusProps) {
  const { session } = useAuthStore();
  const [reviewerDetails, setReviewerDetails] = React.useState<Record<string, Reviewer>>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [comment, setComment] = React.useState('');
  const [rejectionReason, setRejectionReason] = React.useState('');

  // Load reviewer details
  React.useEffect(() => {
    if (!approval || !session?.organizationId) return;

    const reviewers = JSON.parse(approval.reviewers) as string[];
    const approvedBy = JSON.parse(approval.approvedBy) as string[];
    const allUserIds = Array.from(new Set([...reviewers, ...approvedBy]));

    const loadReviewers = async () => {
      try {
        const response = await fetch(`/api/auth/organizations/${session.organizationId}/members`);
        if (!response.ok) throw new Error('Failed to load members');
        
        const data = await response.json();
        const details: Record<string, Reviewer> = {};
        
        allUserIds.forEach((userId) => {
          const member = data.members.find((m: Reviewer) => m.id === userId);
          if (member) {
            details[userId] = member;
          }
        });
        
        setReviewerDetails(details);
      } catch (err) {
        console.error('Failed to load reviewer details:', err);
      }
    };

    loadReviewers();
  }, [approval, session?.organizationId]);

  const handleApprove = async () => {
    if (!approval) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/features/${featureId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          comment: comment.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to approve');
      }

      setComment('');
      onApprovalChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve spec');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!approval || !rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/features/${featureId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          reason: rejectionReason.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reject');
      }

      setRejectionReason('');
      onApprovalChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject spec');
    } finally {
      setLoading(false);
    }
  };

  if (!approval) {
    return (
      <div className="rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Approval Status</h3>
        <p className="text-sm text-gray-600">No approval process initiated yet.</p>
      </div>
    );
  }

  const reviewers = JSON.parse(approval.reviewers) as string[];
  const approvedBy = JSON.parse(approval.approvedBy) as string[];
  const isAssignedReviewer = reviewers.includes(session?.userId || '');
  const hasApproved = approvedBy.includes(session?.userId || '');

  // Calculate approval progress
  const progressPercent = reviewers.length > 0
    ? Math.round((approvedBy.length / reviewers.length) * 100)
    : 0;

  const thresholdLabel = {
    SINGLE: 'Single Approver Required',
    UNANIMOUS: 'Unanimous Approval Required',
    MAJORITY: 'Majority Approval Required',
  }[organization.approvalThreshold];

  const requiredApprovals = {
    SINGLE: 1,
    UNANIMOUS: reviewers.length,
    MAJORITY: Math.ceil(reviewers.length / 2),
  }[organization.approvalThreshold];

  return (
    <div className="rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Approval Status</h3>
          <p className="text-sm text-gray-600 mt-1">{thresholdLabel}</p>
        </div>
        {approval.status === 'APPROVED' && (
          <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
            ✓ APPROVED
          </span>
        )}
        {approval.status === 'REJECTED' && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
            ✗ REJECTED
          </span>
        )}
        {approval.status === 'PENDING' && (
          <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
            ⏳ PENDING
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{approvedBy.length} / {requiredApprovals} required</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Reviewers List */}
      <div className="space-y-3 mb-4">
        <h4 className="text-sm font-medium text-gray-900">Reviewers</h4>
        {reviewers.map((reviewerId) => {
          const reviewer = reviewerDetails[reviewerId];
          const hasUserApproved = approvedBy.includes(reviewerId);
          
          return (
            <div
              key={reviewerId}
              className="flex items-center justify-between p-3 rounded border border-gray-200"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {reviewer?.name || 'Unknown User'}
                </p>
                <p className="text-xs text-gray-600">{reviewer?.email || ''}</p>
              </div>
              {hasUserApproved ? (
                <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Approved
                </span>
              ) : (
                <span className="text-gray-400 text-sm">Pending</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Comments */}
      {approval.comments && (
        <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
          <p className="text-sm font-medium text-gray-900 mb-1">Comments</p>
          <p className="text-sm text-gray-700">{approval.comments}</p>
        </div>
      )}

      {/* Rejection Details */}
      {approval.status === 'REJECTED' && approval.rejectionReason && (
        <div className="mb-4 p-3 bg-red-50 rounded border border-red-200">
          <p className="text-sm font-medium text-red-900 mb-1">Rejection Reason</p>
          <p className="text-sm text-red-700">{approval.rejectionReason}</p>
          {approval.rejectedAt && (
            <p className="text-xs text-red-600 mt-2">
              Rejected on {format(new Date(approval.rejectedAt), 'PPP')}
            </p>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Action Buttons (only for assigned reviewers who haven't approved) */}
      {isAssignedReviewer && !hasApproved && approval.status === 'PENDING' && (
        <div className="space-y-3 border-t border-gray-200 pt-4">
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-900 mb-1">
              Comment (optional)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add your review comments..."
              rows={3}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleApprove}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Approving...' : 'Approve'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Toggle rejection form
                if (!rejectionReason) {
                  setRejectionReason('');
                }
              }}
              disabled={loading}
              className="flex-1"
            >
              Reject
            </Button>
          </div>

          {/* Rejection Reason Form */}
          {rejectionReason !== null && rejectionReason !== undefined && !loading && (
            <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
              <label htmlFor="rejection-reason" className="block text-sm font-medium text-red-900 mb-1">
                Rejection Reason *
              </label>
              <textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please explain why you're rejecting this spec..."
                rows={3}
                className="w-full rounded border border-red-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  Confirm Rejection
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setRejectionReason('')}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Already Approved Message */}
      {isAssignedReviewer && hasApproved && (
        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600">
            ✓ You have approved this specification.
          </p>
        </div>
      )}

      {/* Not a Reviewer Message */}
      {!isAssignedReviewer && approval.status === 'PENDING' && (
        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600">
            You are not assigned as a reviewer for this specification.
          </p>
        </div>
      )}
    </div>
  );
}
