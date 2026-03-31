import { useQuery } from '@tanstack/react-query';

export interface StatusHistoryEntry {
  id: string;
  timestamp: Date;
  status: string;
  userId: string;
  userName?: string;
  details?: {
    reason?: string;
    approvers?: string[];
    reviewers?: string[];
    oldStatus?: string;
    [key: string]: any;
  };
}

export function useFeatureHistory(featureId: string) {
  return useQuery<StatusHistoryEntry[]>({
    queryKey: ['features', featureId, 'history'],
    queryFn: async () => {
      const response = await fetch(`/api/features/${featureId}/history`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch feature history');
      }

      const data = await response.json();
      return data.data || [];
    },
    enabled: !!featureId,
  });
}
