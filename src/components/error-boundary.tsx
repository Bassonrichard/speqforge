'use client';

import React, { ReactNode, ReactElement } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactElement;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component for catching React component errors
 * Prevents entire app from crashing when a component has an error
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('Error boundary caught an error:', error);
    console.error('Error info:', errorInfo);

    // You could also log the error to an error reporting service here
    // e.g., Sentry, LogRocket, etc.
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      return <DefaultErrorFallback error={this.state.error} reset={this.resetError} />;
    }

    return this.props.children;
  }
}

/**
 * Default error fallback UI
 */
interface ErrorFallbackProps {
  error: Error;
  reset: () => void;
}

function DefaultErrorFallback({ error, reset }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-red-100 p-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
        </div>

        <h1 className="mb-2 text-center text-xl font-bold text-gray-900">Something went wrong</h1>

        <p className="mb-6 text-center text-sm text-gray-600">
          We encountered an unexpected error. Please try again or contact support if the problem persists.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <details className="mb-6 rounded bg-gray-100 p-3 text-xs text-gray-700">
            <summary className="cursor-pointer font-semibold">Error details (dev only)</summary>
            <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={reset} className="flex-1">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button variant="ghost" onClick={() => window.location.href = '/'} className="flex-1">
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Async error boundary for Next.js - handles errors in async components
 * Usage in layout.tsx: wrap children with this component
 */
export function ErrorBoundaryProvider({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}

/**
 * Hook to manually trigger error boundary
 * Throw errors from inside components to trigger boundary
 */
export function useErrorBoundary() {
  return {
    captureException: (error: Error) => {
      throw error;
    },
  };
}
