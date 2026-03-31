import { NextRequest, NextResponse } from 'next/server';

/**
 * OAuth Authorization Endpoint for OpenAI Codex
 * Redirects user to OpenAI authorization page
 */
export async function GET(request: NextRequest) {
  try {
    // OpenAI OAuth configuration
    const clientId = process.env.OPENAI_OAUTH_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/llm/oauth/openai_codex/callback`;
    
    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'OpenAI OAuth not configured' },
        { status: 500 }
      );
    }

    // Store orgId in state for callback (in production, use encrypted token)
    const orgId = request.headers.get('x-org-id') || 'default-org';
    const state = Buffer.from(JSON.stringify({ orgId, provider: 'openai_codex' })).toString('base64url');

    // OpenAI OAuth scopes
    // Based on OpenCode implementation: access to models and chat
    const scopes = ['model.read', 'model.request'];

    const authUrl = `https://auth.openai.com/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${scopes.join(' ')}&state=${state}&response_type=code`;

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('OpenAI OAuth authorization error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initiate OAuth flow',
      },
      { status: 500 }
    );
  }
}
