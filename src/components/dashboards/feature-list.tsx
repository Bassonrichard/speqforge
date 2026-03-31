'use client';

import Link from 'next/link';
import React from 'react';
import { Button } from '@/components/ui/button';
import { StatusBadge, type FeatureStatus } from '@/components/ui/status-badge';
import { useFeatureList, useProjectList } from '@/hooks/use-projects-features';
import { format } from 'date-fns';

export function FeatureList() {
  const [filters, setFilters] = React.useState<{
    projectId?: string;
    status?: string;
    sortBy?: 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
  }>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const { data: projects } = useProjectList();
  const { data: features, isLoading, error } = useFeatureList(filters);

  const handleFilterChange = (
    key: 'projectId' | 'status' | 'sortBy' | 'sortOrder',
    value: string
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 animate-pulse rounded bg-gray-200" />
        <div className="h-64 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm font-medium text-red-800">
          Failed to load features
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 rounded-lg border border-gray-200 bg-white p-4">
        {/* Project Filter */}
        <div className="flex-1 min-w-[200px]">
          <label
            htmlFor="project-filter"
            className="block text-sm font-medium text-gray-700"
          >
            Project
          </label>
          <select
            id="project-filter"
            value={filters.projectId || ''}
            onChange={(e) => handleFilterChange('projectId', e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Projects</option>
            {projects?.map((project: { id: string; name: string }) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex-1 min-w-[200px]">
          <label
            htmlFor="status-filter"
            className="block text-sm font-medium text-gray-700"
          >
            Status
          </label>
          <select
            id="status-filter"
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="HANDED_OFF">Handed Off</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETE">Complete</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="flex-1 min-w-[200px]">
          <label
            htmlFor="sort-filter"
            className="block text-sm font-medium text-gray-700"
          >
            Sort By
          </label>
          <select
            id="sort-filter"
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              setFilters((prev) => ({
                ...prev,
                sortBy: sortBy as 'createdAt' | 'updatedAt',
                sortOrder: sortOrder as 'asc' | 'desc',
              }));
            }}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="updatedAt-desc">Recently Updated</option>
            <option value="updatedAt-asc">Least Recently Updated</option>
          </select>
        </div>
      </div>

      {/* Feature Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Feature
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Project
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Last Updated
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {features && features.length > 0 ? (
              features.map((feature: any) => (
                <tr key={feature.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">
                        {feature.title}
                      </div>
                      {feature.description && (
                        <div className="text-sm text-gray-500 line-clamp-1">
                          {feature.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={feature.status as FeatureStatus} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {feature.projectName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(feature.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(feature.updatedAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <Link href={`/dashboard/features/${feature.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-sm text-gray-500"
                >
                  No features found. Create your first feature to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
