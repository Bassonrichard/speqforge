/**
 * Specifications List Page
 * Shows all specifications across all projects
 */

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FeatureList } from '@/components/dashboards/feature-list';

export default function SpecsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Specifications</h1>
          <p className="mt-1 text-gray-600">
            View and manage feature specifications across all projects
          </p>
        </div>
        <Link href="/dashboard/features/new">
          <Button>New Feature</Button>
        </Link>
      </div>

      <FeatureList />
    </div>
  );
}
