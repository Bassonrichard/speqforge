import { ReactNode } from 'react';
import { ErrorBoundaryProvider } from '@/components/error-boundary';

interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * Auth layout - minimal layout for login and callback pages
 * No navigation or shell, just error boundary
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <ErrorBoundaryProvider>
      {children}
    </ErrorBoundaryProvider>
  );
}

export const metadata = {
  title: 'SeqForge - Sign In',
  description: 'Sign in to SeqForge',
};
