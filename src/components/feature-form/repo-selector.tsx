/**
 * Repository Selector Component
 * Search and select GitHub repositories
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAttachRepository } from '@/hooks/use-projects-features';

interface RepoSelectorProps {
  projectId: string;
  onSuccess?: () => void;
}

export function RepoSelector({ projectId, onSuccess }: RepoSelectorProps) {
  const [fullName, setFullName] = useState('');
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [error, setError] = useState('');

  const attachRepo = useAttachRepository(projectId, {
    onSuccess: () => {
      setFullName('');
      setDefaultBranch('main');
      setError('');
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Repository name is required (format: owner/repo)');
      return;
    }

    if (!/^[\w-]+\/[\w-]+$/.test(fullName)) {
      setError('Invalid format. Use: owner/repo');
      return;
    }

    attachRepo.mutate({
      fullName: fullName.trim(),
      defaultBranch: defaultBranch || 'main',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-900 mb-2">
          Repository *
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            if (error) setError('');
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="owner/repository"
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>

      <div>
        <label htmlFor="branch" className="block text-sm font-medium text-gray-900 mb-2">
          Default Branch
        </label>
        <input
          id="branch"
          type="text"
          value={defaultBranch}
          onChange={(e) => setDefaultBranch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="main"
        />
      </div>

      <Button
        type="submit"
        disabled={attachRepo.isPending}
        variant="outline"
      >
        {attachRepo.isPending ? 'Attaching...' : 'Attach Repository'}
      </Button>
    </form>
  );
}
