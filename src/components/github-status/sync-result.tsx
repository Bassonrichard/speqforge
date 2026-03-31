'use client';

import { ExternalLink, CheckCircle2, XCircle, GitBranch } from 'lucide-react';

interface SyncResult {
  repoId: string;
  repoFullName: string;
  status: 'SUCCESS' | 'FAILED';
  branch?: string;
  prUrl?: string;
  error?: string;
}

interface SyncResultDisplayProps {
  results: {
    succeeded: SyncResult[];
    failed: SyncResult[];
  };
}

export function SyncResultDisplay({ results }: SyncResultDisplayProps) {
  const total = results.succeeded.length + results.failed.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Sync Results</h3>
        <div className="text-sm text-muted-foreground">
          {results.succeeded.length} of {total} succeeded
        </div>
      </div>

      {/* Success Results */}
      {results.succeeded.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-green-600 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Successfully Synced
          </h4>
          {results.succeeded.map((result) => (
            <div
              key={result.repoId}
              className="border border-green-200 rounded-lg p-4 bg-green-50"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-gray-900">{result.repoFullName}</p>
                  {result.branch && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <GitBranch className="h-3 w-3" />
                      <code className="text-xs">{result.branch}</code>
                    </p>
                  )}
                </div>
                {result.prUrl && (
                  <a
                    href={result.prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    View PR
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Failure Results */}
      {results.failed.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-red-600 flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Failed to Sync
          </h4>
          {results.failed.map((result) => (
            <div
              key={result.repoId}
              className="border border-red-200 rounded-lg p-4 bg-red-50"
            >
              <p className="font-medium text-gray-900 mb-1">{result.repoFullName}</p>
              <p className="text-sm text-red-600">{result.error || 'Unknown error'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
