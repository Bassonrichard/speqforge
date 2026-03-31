/**
 * Organization Settings Page  
 * Manage organization members, roles, and approval settings
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { getSession } from '@/lib/auth';
import { Users, Settings, Shield } from 'lucide-react';

export default function OrganizationSettingsPage() {
  const [orgId, setOrgId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [organization, setOrganization] = React.useState<any>(null);
  const [members, setMembers] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        // Get current session
        const sessionResponse = await fetch('/api/auth/user');
        if (!sessionResponse.ok) return;
        
        const sessionData = await sessionResponse.json();
        const currentOrgId = sessionData.orgId || sessionData.data?.orgId;
        setOrgId(currentOrgId);

        if (!currentOrgId) {
          setError('No organization selected');
          setLoading(false);
          return;
        }

        // Load organization details
        const orgResponse = await fetch(`/api/auth/organizations/${currentOrgId}`);
        if (orgResponse.ok) {
          const orgResult = await orgResponse.json();
          setOrganization(orgResult.data?.organization || orgResult.organization);
        }

        // Load organization members
        const membersResponse = await fetch(`/api/auth/organizations/${currentOrgId}/members`);
        if (membersResponse.ok) {
          const membersResult = await membersResponse.json();
          setMembers(membersResult.data?.members || []);
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to load organization data:', err);
        setError('Failed to load organization settings');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-600">Loading organization settings...</p>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="p-8">
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error || 'Organization not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Organization Settings</h1>
        <p className="mt-2 text-gray-600">Manage {organization.name}'s settings and team members</p>
      </div>

      {/* Organization Info */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-blue-50 p-3">
            <Settings className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">Organization Details</h2>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Name</p>
                <p className="text-base text-gray-900">{organization.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Approval Threshold</p>
                <p className="text-base text-gray-900">
                  {organization.approvalThreshold === 'SINGLE' && 'Single Approver'}
                  {organization.approvalThreshold === 'MAJORITY' && 'Majority (>50%)'}
                  {organization.approvalThreshold === 'UNANIMOUS' && 'Unanimous (all approvers)'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="rounded-lg bg-green-50 p-3">
            <Users className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage who can access this organization
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900">{member.name || 'Unnamed User'}</p>
                <p className="text-sm text-gray-600">{member.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                  {member.orgRole?.toUpperCase() || 'MEMBER'}
                </span>
              </div>
            </div>
          ))}

          {members.length === 0 && (
            <p className="text-center text-gray-500 py-8">No members found</p>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="rounded-lg bg-purple-50 p-3">
            <Shield className="h-6 w-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">Quick Links</h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure additional settings
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <a
            href="/dashboard/settings/llm"
            className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
          >
            <p className="font-medium text-gray-900">AI Configuration (BYOK)</p>
            <p className="text-sm text-gray-600 mt-1">Configure LLM providers and API keys</p>
          </a>
          <a
            href="/dashboard/settings/templates"
            className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
          >
            <p className="font-medium text-gray-900">Spec Templates</p>
            <p className="text-sm text-gray-600 mt-1">Manage custom specification templates</p>
          </a>
        </div>
      </div>
    </div>
  );
}
