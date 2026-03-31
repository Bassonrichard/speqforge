import { format } from 'date-fns';
import { StatusBadge, type FeatureStatus } from '@/components/ui/status-badge';

export interface StatusHistoryEntry {
  id: string;
  timestamp: Date;
  status: FeatureStatus;
  userId: string;
  userName?: string;
  details?: {
    reason?: string;
    approvers?: string[];
    reviewers?: string[];
    [key: string]: any;
  };
}

interface StatusTimelineProps {
  entries: StatusHistoryEntry[];
  className?: string;
}

export function StatusTimeline({ entries, className }: StatusTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500">
        No status history available
      </div>
    );
  }

  return (
    <div className={className}>
      <ol className="relative border-l border-gray-300 pl-6">
        {entries.map((entry, index) => (
          <li key={entry.id} className="mb-6 last:mb-0">
            <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-4 ring-white">
              <span className="h-3 w-3 rounded-full bg-blue-600" />
            </span>
            <div className="flex items-center gap-2">
              <StatusBadge status={entry.status} />
              <time className="text-xs text-gray-500">
                {format(entry.timestamp, 'PPp')}
              </time>
            </div>
            <p className="mt-1 text-sm text-gray-700">
              {entry.userName || entry.userId}
            </p>
            {entry.details?.reason && (
              <p className="mt-1 text-sm italic text-gray-500">
                &ldquo;{entry.details.reason}&rdquo;
              </p>
            )}
            {entry.details?.approvers && entry.details.approvers.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                Approved by: {entry.details.approvers.join(', ')}
              </p>
            )}
            {entry.details?.reviewers && entry.details.reviewers.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                Reviewers: {entry.details.reviewers.join(', ')}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
