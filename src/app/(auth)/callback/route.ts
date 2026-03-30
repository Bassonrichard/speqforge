import { redirect } from 'next/navigation';
import { authenticateFromGitHub, createSessionToken, setSessionCookie } from '@/lib/auth';
import { createErrorResponse } from '@/lib/utils';
import { ValidationError } from '@/types/errors';

/**
 * GitHub OAuth Callback Handler
 * Exchanges authorization code for access token and creates session
 * 
 * Route: GET /auth/callback?code=...&state=...
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      const errorDescription = searchParams.get('error_description');
      console.error('GitHub OAuth error:', error, errorDescription);
      redirect(`/login?error=${encodeURIComponent(error)}`);
    }

    // Validate code and state
    if (!code || !state) {
      throw new ValidationError('Missing authorization code or state');
    }

    // TODO: Verify state from session storage (would need to be passed via request somehow)
    // For now, we trust the code is valid if it came from GitHub

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
        client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('GitHub token error:', tokenData.error);
      throw new Error(`GitHub error: ${tokenData.error_description}`);
    }

    const accessToken = tokenData.access_token;

    // Fetch user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch GitHub user info');
    }

    const githubUser = await userResponse.json();

    // Fetch user email (it's a separate endpoint if not public)
    let userEmail = githubUser.email;
    if (!userEmail) {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (emailResponse.ok) {
        const emails = await emailResponse.json();
        const primaryEmail = emails.find((e: any) => e.primary);
        userEmail = primaryEmail?.email || emails[0]?.email;
      }
    }

    // Authenticate user and create session
    const sessionPayload = await authenticateFromGitHub({
      id: githubUser.id,
      login: githubUser.login,
      email: userEmail,
      avatar_url: githubUser.avatar_url,
    });

    // Create JWT token
    const sessionToken = await createSessionToken(sessionPayload);

    // Set session cookie
    await setSessionCookie(sessionToken);

    // Redirect to dashboard
    redirect('/dashboard');
  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    redirect(`/login?error=${encodeURIComponent(errorMessage)}`);
  }
}
