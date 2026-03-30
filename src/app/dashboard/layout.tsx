import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { ErrorBoundaryProvider } from '@/components/error-boundary';
import DashboardShell from '@/components/dashboards/shell';

interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * Dashboard layout - protects all child routes with authentication
 * Provides sidebar navigation and error boundary
 */
export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // Check authentication
  const session = await getSession();

  if (!session || !session.userId) {
    redirect('/login');
  }

  return (
    <ErrorBoundaryProvider>
      <DashboardShell user={{
        id: session.userId,
        username: session.username,
        avatarUrl: session.avatarUrl,
      }}>
        {children}
      </DashboardShell>
    </ErrorBoundaryProvider>
  );
}

export const metadata = {
  title: 'SeqForge - Dashboard',
  description: 'Manage your specifications and projects',
};
