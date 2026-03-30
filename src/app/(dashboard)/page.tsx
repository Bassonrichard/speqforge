'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth, useOrganizations } from '@/hooks/use-api';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useModal } from '@/store/ui-store';

/**
 * Dashboard Home Page
 * Shows overview of user's projects and recent activity
 */
export default function DashboardPage() {
  const { data: user, isLoading: userLoading } = useAuth();
  const { data: orgs, isLoading: orgsLoading } = useOrganizations();
  const createProjectModal = useModal('create-project');

  if (userLoading || orgsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user?.username}!
          </h1>
          <p className="mt-1 text-gray-600">
            Manage your specifications and projects
          </p>
        </div>
        <Button onClick={() => createProjectModal.open()} className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-6">
          <div className="text-sm font-medium text-gray-600">Total Organizations</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {orgs?.length || 0}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <div className="text-sm font-medium text-gray-600">Active Projects</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">--</div>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <div className="text-sm font-medium text-gray-600">Pending Reviews</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">--</div>
        </div>
      </div>

      {/* Organizations List */}
      {orgs && orgs.length > 0 && (
        <div className="rounded-lg border bg-white">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Organizations</h2>
          </div>
          <div className="divide-y">
            {orgs.map((org) => (
              <div key={org.id} className="px-6 py-4">
                <div className="flex items-center gap-3">
                  {org.avatarUrl && (
                    <img src={org.avatarUrl} alt={org.name} className="h-10 w-10 rounded-full" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{org.name}</div>
                    <div className="text-sm text-gray-600">{org.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!orgs || orgs.length === 0 && (
        <div className="rounded-lg border-2 border-dashed bg-gray-50 py-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900">No organizations yet</h3>
          <p className="mt-1 text-sm text-gray-600">Create or join an organization to get started</p>
        </div>
      )}
    </div>
  );
}
