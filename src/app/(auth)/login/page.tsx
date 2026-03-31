'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Login form component (uses useSearchParams)
 */
function LoginForm() {
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FFF8F0] via-[#F4F1EA] to-[#FFF8F0] px-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-[#FF6B35]/10 to-[#FF8C42]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-[#FF8C42]/10 to-[#FF6B35]/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xl border border-[#E0DCD4] p-2.5">
            <img src="/logos/favicon-96x96.png" alt="SeqForge" className="w-full h-full" />
          </div>
          <h1 className="text-4xl font-bold text-[#2A2A2A] mb-2" style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}>SeqForge</h1>
          <p className="text-sm uppercase tracking-widest text-[#6B6B6B]" style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}>Portal</p>
          <p className="mt-3 text-[#6B6B6B] leading-relaxed">Specification-driven development platform</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border-2 border-[#E0DCD4] bg-white/95 backdrop-blur-sm p-8 shadow-2xl">
          <h2 className="mb-6 text-center text-xl font-bold text-[#2A2A2A]" style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}>
            SIGN IN TO CONTINUE
          </h2>

          {/* Error Message */}
          {(error || errorMessage) && (
            <div className="mb-6 rounded-xl border-2 border-[#D64545]/20 bg-[#D64545]/10 p-4 text-sm text-[#D64545]" style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}>
              {error || 'Authentication failed. Please try again.'}
            </div>
          )}

          {/* GitHub Sign In Button */}
          <Button
            onClick={handleGitHubSignIn}
            disabled={isLoading}
            size="lg"
            className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] hover:from-[#E55A2B] hover:to-[#E77A34] text-white px-6 py-6 text-sm font-bold group transition-all duration-300 shadow-lg hover:shadow-xl rounded-xl border-none"
            style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                SIGNING IN...
              </>
            ) : (
              <>
                <GitBranch className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                SIGN IN WITH GITHUB
              </>
            )}
          </Button>

          {/* Info Text */}
          <p className="mt-5 text-center text-xs text-[#6B6B6B] leading-relaxed">
            We use GitHub for secure authentication. Choose between public or private repository access.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-[#6B6B6B]" style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}>
          <p>
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-[#FF6B35] hover:text-[#E55A2B] font-semibold transition-colors">
              Terms of Service
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * GitHub OAuth Login Page
 * Redirects to GitHub for authentication
 */
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FFF8F0] via-[#F4F1EA] to-[#FFF8F0]">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
