'use client';

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

let queryClient: QueryClient;

/**
 * Get or create a singleton QueryClient instance
 * This ensures the same client is used across renders
 */
function getQueryClient() {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute
          gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
          retry: 1,
          refetchOnWindowFocus: false,
        },
        mutations: {
          retry: 1,
        },
      },
    });
  }
  return queryClient;
}

/**
 * Root providers component
 * Wraps the entire app with necessary context providers
 */
export function Providers({ children }: { children: ReactNode }) {
  const client = getQueryClient();

  return (
    <QueryClientProvider client={client}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
