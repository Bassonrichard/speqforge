import { NextRequest, NextResponse } from 'next/server';

/**
 * GitHub OAuth Authorization
 * Redirects to GitHub OAuth flow for Copilot/Models access
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;

    if (provider !== 'github_copilot') {
      return NextResponse.json(
        { success: false, error: 'Unsupported OAuth provider' },
        { status: 400 }
      );
    }

    // GitHub OAuth configuration
    const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/llm/oauth/${provider}/callback`;
    
    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'GitHub OAuth not configured' },
        { status: 500 }
      );
    }

    // Store orgId in state for callback (in production, use encrypted token)
    const orgId = request.headers.get('x-org-id') || 'default-org';
    const state = Buffer.from(JSON.stringify({ orgId, provider })).toString('base64url');

    // Scopes needed for GitHub Models/Copilot
    const scopes = ['read:user', 'read:org'];

    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${scopes.join(' ')}&state=${state}`;

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('OAuth authorization error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initiate OAuth flow',
      },
      { status: 500 }
    );
  }
}
