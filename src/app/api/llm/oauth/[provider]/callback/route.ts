import { NextRequest, NextResponse } from 'next/server';

/**
 * OAuth Callback for LLM Providers
 * Handles the callback from provider-specific OAuth flows
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;

    if (error) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/settings/llm?error=oauth_${error}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/settings/llm?error=missing_code_or_state`
      );
    }

    // Decode state
    const { orgId } = JSON.parse(Buffer.from(state, 'base64url').toString());

    // Exchange code for access token - provider-specific
    let tokenUrl: string;
    let tokenBody: Record<string, string>;

    if (provider === 'github_copilot') {
      tokenUrl = 'https://github.com/login/oauth/access_token';
      tokenBody = {
        client_id: process.env.GITHUB_OAUTH_CLIENT_ID!,
        client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET!,
        code,
      };
    } else if (provider === 'openai_codex') {
      tokenUrl = 'https://auth.openai.com/oauth/token';
      tokenBody = {
        client_id: process.env.OPENAI_OAUTH_CLIENT_ID!,
        client_secret: process.env.OPENAI_OAUTH_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${baseUrl}/api/llm/oauth/${provider}/callback`,
      };
    } else {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/settings/llm?error=unsupported_provider`
      );
    }

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(tokenBody),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/settings/llm?error=${tokenData.error}`
      );
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    // Calculate expiration
    const expiresAt = expires_in
      ? new Date(Date.now() + expires_in * 1000).toISOString()
      : undefined;

    // Save the token via the keys API
    const saveResponse = await fetch(`${baseUrl}/api/llm/keys`, {
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
      `${baseUrl}/dashboard/settings/llm?success=oauth_connected`
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
    return NextResponse.redirect(
      `${baseUrl}/dashboard/settings/llm?error=oauth_failed`
    );
  }
}
