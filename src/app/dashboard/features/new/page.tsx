/**
 * Create Feature Page
 */

'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CreateFeatureForm } from '@/components/feature-form/create-feature';

export default function NewFeaturePage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || undefined;

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Feature</h1>
        <p className="mt-2 text-gray-600">Describe your feature and start the specification process</p>
      </div>

      <div className="rounded-lg border border-gray-200 p-8">
        <CreateFeatureForm projectId={projectId} />
      </div>

      <div className="mt-8">
        <Link href="/dashboard/features">
          <Button variant="outline">Back to Features</Button>
        </Link>
      </div>
    </div>
  );
}
