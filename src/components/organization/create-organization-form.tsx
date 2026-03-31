/**
 * Organization Creation Form Component
 * Allows users to create new organizations
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { z } from 'zod';

const createOrgSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  approvalThreshold: z.enum(['SINGLE', 'UNANIMOUS', 'MAJORITY']).default('SINGLE'),
});

interface CreateOrganizationFormProps {
  onSuccess?: (orgId: string) => void;
  onCancel?: () => void;
}

export function CreateOrganizationForm({ onSuccess, onCancel }: CreateOrganizationFormProps) {
  const [name, setName] = React.useState('');
  const [approvalThreshold, setApprovalThreshold] = React.useState<'SINGLE' | 'UNANIMOUS' | 'MAJORITY'>('SINGLE');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    const validation = createOrgSchema.safeParse({ name, approvalThreshold });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, approvalThreshold }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to create organization');
      }

      const result = await response.json();
      const orgId = result.data?.organization?.id || result.organization?.id;
      
      // Success
      setName('');
      setApprovalThreshold('SINGLE');
      onSuccess?.(orgId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Organization</h2>
        <p className="text-sm text-gray-600">
          Create a new organization to collaborate with your team on spec generation and project management.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="org-name" className="block text-sm font-medium text-gray-900 mb-2">
          Organization Name *
        </label>
        <input
          id="org-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Acme Inc"
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Choose a name that represents your team or company.
        </p>
      </div>

      <div>
        <label htmlFor="approval-threshold" className="block text-sm font-medium text-gray-900 mb-2">
          Approval Threshold
        </label>
        <select
          id="approval-threshold"
          value={approvalThreshold}
          onChange={(e) => setApprovalThreshold(e.target.value as 'SINGLE' | 'UNANIMOUS' | 'MAJORITY')}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="SINGLE">Single Approver (any one approver can approve)</option>
          <option value="MAJORITY">Majority (more than 50% must approve)</option>
          <option value="UNANIMOUS">Unanimous (all assigned approvers must approve)</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          This can be changed later in organization settings.
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={loading || !name.trim()}
          className="flex-1"
        >
          {loading ? 'Creating Organization...' : 'Create Organization'}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
