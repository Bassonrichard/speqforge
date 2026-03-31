import { cn } from '@/lib/utils';

export type FeatureStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'HANDED_OFF'
  | 'IN_PROGRESS'
  | 'COMPLETE';

interface StatusBadgeProps {
  status: FeatureStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  FeatureStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-800 border-gray-300',
  },
  IN_REVIEW: {
    label: 'In Review',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  APPROVED: {
    label: 'Approved',
    className: 'bg-green-100 text-green-800 border-green-300',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 border-red-300',
  },
  HANDED_OFF: {
    label: 'Handed Off',
    className: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  COMPLETE: {
    label: 'Complete',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
