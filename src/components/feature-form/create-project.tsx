/**
 * Create Project Form Component
 * Form for creating new projects with validation and submission
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useCreateProject } from '@/hooks/use-projects-features';

interface CreateProjectFormProps {
  onSuccess?: () => void;
}

export function CreateProjectForm({ onSuccess }: CreateProjectFormProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectKey, setProjectKey] = useState('');
  const [branchPattern, setBranchPattern] = useState('spec/{projectKey}/{featureId}-{slug}');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createProject = useCreateProject({
    onSuccess: () => {
      setName('');
      setDescription('');
      setProjectKey('');
      setBranchPattern('spec/{projectKey}/{featureId}-{slug}');
      onSuccess?.();
      router.push('/dashboard/projects');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Project name is required';
    if (!projectKey.trim()) newErrors.projectKey = 'Project key is required';
    if (projectKey && !/^[A-Z0-9_-]+$/.test(projectKey)) {
      newErrors.projectKey = 'Only uppercase letters, numbers, dashes, and underscores';
    }
    if (projectKey && projectKey.length > 10) {
      newErrors.projectKey = 'Project key must be 10 characters or less';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    createProject.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      projectKey: projectKey.trim(),
      branchPattern,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
          Project Name *
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors({ ...errors, name: '' });
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="My Project"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="projectKey" className="block text-sm font-medium text-gray-900 mb-2">
          Project Key * <span className="text-gray-500 text-xs">(for branch naming)</span>
        </label>
        <input
          id="projectKey"
          type="text"
          value={projectKey}
          onChange={(e) => {
            setProjectKey(e.target.value.toUpperCase());
            if (errors.projectKey) setErrors({ ...errors, projectKey: '' });
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          placeholder="PROJ"
        />
        {errors.projectKey && <p className="mt-1 text-sm text-red-600">{errors.projectKey}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-2">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="What is this project about?"
          rows={3}
        />
      </div>

      <div>
        <label htmlFor="branchPattern" className="block text-sm font-medium text-gray-900 mb-2">
          Branch Pattern
        </label>
        <input
          id="branchPattern"
          type="text"
          value={branchPattern}
          onChange={(e) => setBranchPattern(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          placeholder="spec/{projectKey}/{featureId}-{slug}"
        />
        <p className="mt-1 text-xs text-gray-500">
          Placeholders: {"{productKey}"}, {"{featureId}"}, {"{slug}"}
        </p>
      </div>

      <Button
        type="submit"
        disabled={createProject.isPending}
        className="w-full"
      >
        {createProject.isPending ? 'Creating...' : 'Create Project'}
      </Button>
    </form>
  );
}
