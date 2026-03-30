import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

/**
 * Root page
 * Redirects authenticated users to /dashboard
 * Redirects unauthenticated users to /login
 */
export default async function RootPage() {
  const session = await getSession();

  if (session) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
