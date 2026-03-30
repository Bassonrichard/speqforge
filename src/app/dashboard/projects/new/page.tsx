/**
 * Create Project Page
 */

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CreateProjectForm } from '@/components/feature-form/create-project';

export default function NewProjectPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
        <p className="mt-2 text-gray-600">Set up a new project to manage your features and specs</p>
      </div>

      <div className="rounded-lg border border-gray-200 p-8">
        <CreateProjectForm />
      </div>

      <div className="mt-8">
        <Link href="/projects">
          <Button variant="outline">Back to Projects</Button>
        </Link>
      </div>
    </div>
  );
}
