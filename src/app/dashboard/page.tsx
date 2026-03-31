'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useAuth, useOrganizations } from '@/hooks/use-api';
import { Loader2, Plus, AlertCircle, ArrowRight, GitBranch, Workflow, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useModal } from '@/store/ui-store';
import Link from 'next/link';

/**
 * Dashboard Home Page - Retro Computing Workflow Style
 * Inspired by GitHub workflows and Expo UI
 */
export default function DashboardPage() {
  const { data: user, isLoading: userLoading, error: userError } = useAuth();
  const { data: orgs, isLoading: orgsLoading, error: orgsError} = useOrganizations();
  const createProjectModal = useModal('create-project');
  const queryClient = useQueryClient();

  if (userLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="terminal inline-block px-6 py-3">
          <span className="animate-pulse">Initializing portal...</span>
        </div>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="border border-red-200 bg-red-50 p-8 rounded-xl shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertCircle className="h-6 w-6 text-[#D64545] flex-shrink-0" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[#D64545] mb-2" style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}>ERROR</h3>
            <p className="text-sm text-red-900 mb-4">
              {userError instanceof Error ? userError.message : 'System failure'}
            </p>
            <Button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['api', 'auth', 'user'] })}
              className="bg-[#D64545] hover:bg-[#B03737] text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}
            >
              RETRY
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const hasOrganizations = orgs && orgs.length > 0;
  const isLoadingOrgs = orgsLoading;

  return (
    <div className="space-y-12 max-w-6xl">
      {/* Workflow Header */}
      <div className="space-y-6 stagger-item">
        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold text-[#2A2A2A] tracking-tight" style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}>
            Welcome, {user?.username}
          </h1>
          <p className="text-base text-[#6B6B6B] max-w-2xl leading-relaxed">
            Manage specifications, coordinate projects, and ship production-grade software with structured workflows.
          </p>
        </div>
        {hasOrganizations && (
          <Button 
            onClick={() => createProjectModal.open()} 
            className="bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] hover:from-[#E55A2B] hover:to-[#E77A34] text-white px-8 py-6 text-sm font-semibold group transition-all duration-300 shadow-lg hover:shadow-xl rounded-xl border-none"
            style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}
          >
            <Plus className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
            NEW PROJECT
          </Button>
        )}
      </div>

      {/* Loading State */}
      {isLoadingOrgs && (
        <div className="flex items-center gap-3 border border-[#E0DCD4] bg-white p-5 rounded-xl shadow-sm stagger-item">
          <Loader2 className="h-5 w-5 animate-spin text-[#FF6B35] flex-shrink-0" />
          <p className="text-sm text-[#2A2A2A]" style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}>
            Loading organization data...
          </p>
        </div>
      )}

      {/* Error State */}
      {orgsError && !isLoadingOrgs && (
        <div className="border border-orange-200 bg-orange-50 p-5 rounded-xl shadow-sm stagger-item">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
            <p className="text-sm text-[#2A2A2A]">
              Unable to load organizations. Please refresh the page.
            </p>
          </div>
        </div>
      )}

      {/* Workflow Stats Grid */}
      {!isLoadingOrgs && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {/* Card 1: Organizations */}
          <div className="stagger-item card-hover bg-white p-6 relative overflow-hidden rounded-xl">
            <div className="absolute top-4 right-4">
              <div className="step-indicator">{orgs?.length || 0}</div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <GitBranch className="h-5 w-5 text-[#FF6B35]" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]" style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}>
                  Organizations
                </span>
              </div>
              <div className="text-sm text-[#2A2A2A]">
                Total connected
              </div>
            </div>
          </div>

          {/* Card 2: Active Projects */}
          <div className="stagger-item card-hover bg-white p-6 relative overflow-hidden rounded-xl">
            <div className="absolute top-4 right-4 opacity-30">
              <div className="step-indicator">--</div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Workflow className="h-5 w-5 text-[#FF8C42]" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]" style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}>
                  Active Projects
                </span>
              </div>
              <div className="text-sm text-[#6B6B6B]">
                Coming soon
              </div>
            </div>
          </div>

          {/* Card 3: Pending Reviews */}
          <div className="stagger-item card-hover bg-white p-6 relative overflow-hidden rounded-xl">
            <div className="absolute top-4 right-4 opacity-30">
              <div className="step-indicator">--</div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-[#FFA566]" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]" style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}>
                  Pending Reviews
                </span>
              </div>
              <div className="text-sm text-[#6B6B6B]">
                Awaiting approval
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Organizations Workflow */}
      {hasOrganizations && !isLoadingOrgs && (
        <div className="stagger-item space-y-5">
          <div className="flex items-center gap-4">
            <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent to-[#E0DCD4]"></div>
            <h2 className="text-xl font-bold text-[#2A2A2A] tracking-tight px-4" style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}>
              YOUR ORGANIZATIONS
            </h2>
            <div className="h-0.5 flex-1 bg-gradient-to-l from-transparent to-[#E0DCD4]"></div>
          </div>

          <div className="grid gap-4">
            {orgs.map((org, index) => (
              <Link
                key={org.id}
                href={`/dashboard/projects?org=${org.id}`}
                className="stagger-item block border border-[#E0DCD4] bg-white hover:bg-gradient-to-br hover:from-white hover:to-[#FFF8F0] transition-all duration-300 group rounded-xl shadow-sm hover:shadow-lg"
                style={{ animationDelay: `${0.35 + index * 0.05}s` }}
              >
                <div className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#FFF8F0] to-[#F4F1EA] border border-[#E0DCD4] flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                        <span className="text-[#FF6B35] font-bold text-xl" style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}>
                          {org.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-gradient-to-br from-[#FF6B35] to-[#FF8C42] border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-[#2A2A2A] mb-1.5 group-hover:text-[#FF6B35] transition-colors" style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}>
                        {org.name}
                      </div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#F4F1EA] to-[#FFF8F0] border border-[#E0DCD4] rounded-full">
                        <div className="h-1.5 w-1.5 bg-[#FF6B35] rounded-full"></div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#2A2A2A]" style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}>
                          {org.role}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[#6B6B6B] group-hover:text-[#FF6B35] transition-all">
                    <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}>
                      VIEW
                    </span>
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty State - Workflow Style */}
      {!hasOrganizations && !isLoadingOrgs && (
        <div className="stagger-item border-2 border-dashed border-[#E0DCD4] bg-gradient-to-br from-white to-[#FFF8F0] p-16 text-center relative overflow-hidden rounded-2xl">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 border-2 border-dashed border-orange-100 rounded-full opacity-40"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-orange-50 rounded-full opacity-30"></div>
          <div className="relative space-y-6 max-w-md mx-auto">
            <div className="inline-flex h-20 w-20 items-center justify-center bg-gradient-to-br from-[#FF6B35] to-[#FF8C42] rounded-2xl shadow-lg">
              <Plus className="h-10 w-10 text-white" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-[#2A2A2A]" style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}>
                NO ORGANIZATIONS YET
              </h3>
              <p className="text-[#6B6B6B] leading-relaxed">
                Contact your administrator to be added to an organization, or create a new one to get started.
              </p>
            </div>
            <Button 
              onClick={() => alert('Organization creation coming soon! For now, an organization is automatically created when you sign in.')}
              className="bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] hover:from-[#E55A2B] hover:to-[#E77A34] text-white px-8 py-6 text-sm font-semibold group transition-all duration-300 shadow-lg hover:shadow-xl rounded-xl border-none"
              style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}
            >
              <Plus className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
              CREATE ORGANIZATION
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
