/**
 * Create Feature Form Component
 * Form for creating new features within a project
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useCreateFeature, useProjectList } from '@/hooks/use-projects-features';

interface CreateFeatureFormProps {
  projectId?: string;
  onSuccess?: () => void;
}

export function CreateFeatureForm({ projectId: initialProjectId, onSuccess }: CreateFeatureFormProps) {
  const router = useRouter();
  const [projectId, setProjectId] = useState(initialProjectId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: projects = [] } = useProjectList();
  const createFeature = useCreateFeature({
    onSuccess: (data) => {
      setProjectId('');
      setTitle('');
      setDescription('');
      onSuccess?.();
      router.push(`/features/${(data as { id: string }).id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!projectId) newErrors.projectId = 'Project is required';
    if (!title.trim()) newErrors.title = 'Feature title is required';
    if (!description.trim()) newErrors.description = 'Feature description is required';
    else if (description.length < 10) newErrors.description = 'Description must be at least 10 characters';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    createFeature.mutate({
      projectId,
      title: title.trim(),
      description: description.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <label htmlFor="project" className="block text-sm font-medium text-gray-900 mb-2">
          Project *
        </label>
        <select
          id="project"
          value={projectId}
          onChange={(e) => {
            setProjectId(e.target.value);
            if (errors.projectId) setErrors({ ...errors, projectId: '' });
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a project...</option>
          {projects.map((p: { id: string; name: string; projectKey: string }) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.projectKey})
            </option>
          ))}
        </select>
        {errors.projectId && <p className="mt-1 text-sm text-red-600">{errors.projectId}</p>}
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-900 mb-2">
          Feature Title *
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors({ ...errors, title: '' });
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Add user authentication"
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-2">
          Feature Description * <span className="text-gray-500 text-xs">(10+ characters)</span>
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (errors.description) setErrors({ ...errors, description: '' });
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe what this feature should do, who will use it, and why it's needed..."
          rows={6}
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        <p className="mt-1 text-xs text-gray-500">{description.length} characters</p>
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={createFeature.isPending}
        >
          {createFeature.isPending ? 'Creating...' : 'Create Feature'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
