'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * GitHub OAuth Login Page
 * Redirects to GitHub for authentication
 */
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const response = await fetch('/api/auth/user');
      if (response.ok) {
        router.push('/dashboard');
      }
    };
    checkAuth();
  }, [router]);

  const handleGitHubSignIn = () => {
    setIsLoading(true);

    // Build GitHub OAuth URL
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    if (!clientId) {
      setError('GitHub OAuth is not configured');
      setIsLoading(false);
      return;
    }

    const redirectUri = `${window.location.origin}/auth/callback`;
    const scope = 'user:email read:user public_repo';
    const state = Math.random().toString(36).substring(7); // Simple state for CSRF protection

    // Store state in sessionStorage for verification
    sessionStorage.setItem('oauth_state', state);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      state,
    });

    window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
  };

  const errorMessage = searchParams.get('error');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-xl font-bold text-white">SQ</span>
          </div>
          <h1 className="text-3xl font-bold text-white">SeqForge</h1>
          <p className="mt-2 text-slate-400">Specification-driven development portal</p>
        </div>

        {/* Card */}
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8 backdrop-blur-sm">
          <h2 className="mb-6 text-center text-xl font-semibold text-white">
            Sign in to SeqForge
          </h2>

          {/* Error Message */}
          {(error || errorMessage) && (
            <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              {error || 'Authentication failed. Please try again.'}
            </div>
          )}

          {/* GitHub Sign In Button */}
          <Button
            onClick={handleGitHubSignIn}
            disabled={isLoading}
            size="lg"
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign in with GitHub
              </>
            )}
          </Button>

          {/* Info Text */}
          <p className="mt-4 text-center text-sm text-slate-400">
            We use GitHub for secure authentication. You can choose public or private repos.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-500">
          <p>
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-blue-400 hover:text-blue-300">
              Terms of Service
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
