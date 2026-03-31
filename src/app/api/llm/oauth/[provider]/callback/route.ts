import { NextRequest, NextResponse } from 'next/server';

/**
 * GitHub OAuth Callback
 * Handles the callback from GitHub OAuth flow
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const {searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/llm?error=oauth_${error}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/llm?error=missing_code_or_state`
      );
    }

    // Decode state
    const { orgId } = JSON.parse(Buffer.from(state, 'base64url').toString());

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
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/llm?error=${tokenData.error}`
      );
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    // Calculate expiration
    const expiresAt = expires_in
      ? new Date(Date.now() + expires_in * 1000).toISOString()
      : undefined;

    // Save the token via the keys API
    const saveResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/llm/keys`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-org-id': orgId,
        'x-user-id': 'oauth-flow', // TODO: Get from session
      },
      body: JSON.stringify({
        provider,
        authType: 'oauth',
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt,
        setAsDefault: true,
      }),
    });

    if (!saveResponse.ok) {
      throw new Error('Failed to save OAuth token');
    }

    // Redirect back to settings with success message
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/llm?success=oauth_connected`
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/llm?error=oauth_failed`
    );
  }
}
