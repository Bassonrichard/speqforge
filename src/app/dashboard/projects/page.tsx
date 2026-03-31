/**
 * Projects List Page
 * Display all projects for the current organization with actions
 */

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useProjectList } from '@/hooks/use-projects-features';

export default function ProjectsPage() {
  const { data: projects = [], isLoading, error } = useProjectList();

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
        <p className="text-sm font-medium text-red-800">Failed to load projects</p>
        <p className="mt-1 text-sm text-red-700">{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-gray-600">Manage your projects and link repositories</p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button>New Project</Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-6">Create your first project to get started</p>
          <Link href="/dashboard/projects/new">
            <Button>Create Project</Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Project Name</th>
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Key</th>
                <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Repos</th>
                <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Features</th>
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project: { id: string; name: string; description?: string; projectKey: string; repoCount: number; featureCount: number }) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{project.name}</p>
                      <p className="text-sm text-gray-600">{project.description || '-'}</p>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-3 font-mono text-sm">
                    {project.projectKey}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-900">
                      {project.repoCount}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-900">
                      {project.featureCount}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/dashboard/projects/${project.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
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
