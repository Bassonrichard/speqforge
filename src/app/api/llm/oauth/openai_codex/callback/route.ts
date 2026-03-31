import { NextRequest, NextResponse } from 'next/server';

/**
 * OAuth Callback Endpoint for OpenAI Codex
 * Exchanges authorization code for access token and saves encrypted credentials
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings/llm?error=oauth_${error}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings/llm?error=missing_code_or_state`
      );
    }

    // Decode state
    const { orgId } = JSON.parse(Buffer.from(state, 'base64url').toString());

    // Exchange code for access token
    const tokenResponse = await fetch('https://auth.openai.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.OPENAI_OAUTH_CLIENT_ID,
        client_secret: process.env.OPENAI_OAUTH_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/llm/oauth/openai_codex/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings/llm?error=${tokenData.error}`
      );
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    // Calculate expiration
    const expiresAt = expires_in
      ? new Date(Date.now() + expires_in * 1000).toISOString()
      : undefined;

    // Save the token via the keys API
    const saveResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/llm/keys`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-org-id': orgId,
        'x-user-id': 'oauth-flow', // TODO: Get from session
      },
      body: JSON.stringify({
        provider: 'openai_codex',
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
      `${process.env.NEXTAUTH_URL}/dashboard/settings/llm?success=oauth_connected`
    );
  } catch (error) {
    console.error('OpenAI OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/settings/llm?error=oauth_failed`
    );
  }
}
