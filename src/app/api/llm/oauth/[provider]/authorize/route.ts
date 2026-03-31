import { NextRequest, NextResponse } from 'next/server';

/**
 * OAuth Authorization for LLM Providers
 * Redirects to provider-specific OAuth flow
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;

    // Validate provider
    if (provider !== 'github_copilot' && provider !== 'openai_codex') {
      return NextResponse.json(
        { success: false, error: 'Unsupported OAuth provider' },
        { status: 400 }
      );
    }

    // Store orgId in state for callback
    const orgId = request.headers.get('x-org-id') || 'default-org';
    const state = Buffer.from(JSON.stringify({ orgId, provider })).toString('base64url');

    let authUrl: string;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
    const redirectUri = `${baseUrl}/api/llm/oauth/${provider}/callback`;

    if (provider === 'github_copilot') {
      // GitHub OAuth configuration
      const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
      
      if (!clientId) {
        return NextResponse.json(
          { success: false, error: 'GitHub OAuth not configured' },
          { status: 500 }
        );
      }

      // Scopes needed for GitHub Models/Copilot
      const scopes = ['read:user', 'read:org'];

      authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&scope=${scopes.join(' ')}&state=${state}`;
    } else if (provider === 'openai_codex') {
      // OpenAI OAuth configuration
      const clientId = process.env.OPENAI_OAUTH_CLIENT_ID;
      
      if (!clientId) {
        return NextResponse.json(
          { success: false, error: 'OpenAI OAuth not configured' },
          { status: 500 }
        );
      }

      // OpenAI OAuth scopes
      const scopes = ['model.read', 'model.request'];

      authUrl = `https://auth.openai.com/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&scope=${scopes.join(' ')}&state=${state}&response_type=code`;
    } else {
      // Should never reach here due to validation above
      throw new Error('Provider not handled');
    }

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
