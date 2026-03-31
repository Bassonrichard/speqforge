import { db } from '@/lib/db';
import { decryptKey } from '@/lib/crypto';
import { LLMGateway, type LLMProvider } from './llm-gateway';

/**
 * Load LLM credentials for an organization
 * Returns configured provider and decrypted key/token
 */
export async function loadOrgLLMCredentials(orgId: string): Promise<{
  provider: LLMProvider;
  apiKey: string;
  authType: 'api_key' | 'oauth';
}> {
  // Find default provider for org
  const defaultKey = await db.userKey.findFirst({
    where: {
      orgId,
      isDefault: true,
    },
  });

  // Fall back to any configured provider
  const key = defaultKey || await db.userKey.findFirst({
    where: { orgId },
    orderBy: { createdAt: 'desc' },
  });

  if (!key) {
    // Fall back to environment variables
    const envProvider = (process.env.DEFAULT_LLM_PROVIDER || 'openai') as LLMProvider;
    const envKey = getEnvKeyForProvider(envProvider);
    
    if (!envKey) {
      throw new Error('No LLM API key configured for organization or in environment');
    }

    return {
      provider: envProvider,
      apiKey: envKey,
      authType: 'api_key',
    };
  }

  // Check if OAuth token needs refresh
  if (key.authType === 'oauth' && key.expiresAt && key.expiresAt < new Date()) {
    if (key.refreshToken && key.refreshTokenIv) {
      // Refresh the token
      const refreshedToken = await refreshOAuthToken(key.provider, key.refreshToken, key.refreshTokenIv);
      
      // Update the key in database
      await db.userKey.update({
        where: { id: key.id },
        data: {
          encryptedKey: refreshedToken.encryptedKey,
          iv: refreshedToken.iv,
          expiresAt: refreshedToken.expiresAt,
        },
      });

      return {
        provider: key.provider as LLMProvider,
        apiKey: refreshedToken.accessToken,
        authType: 'oauth',
      };
    } else {
      throw new Error(`OAuth token expired for provider ${key.provider} and no refresh token available`);
    }
  }

  // Decrypt the key/token
  const decryptedKey = decryptKey(key.encryptedKey, key.iv);

  return {
    provider: key.provider as LLMProvider,
    apiKey: decryptedKey,
    authType: key.authType as 'api_key' | 'oauth',
  };
}

/**
 * Create LLM Gateway for an organization using their configured keys
 */
export async function createOrgLLMGateway(orgId: string): Promise<LLMGateway> {
  const credentials = await loadOrgLLMCredentials(orgId);
  return new LLMGateway(credentials.provider, credentials.apiKey);
}

/**
 * Get environment variable key for a provider
 */
function getEnvKeyForProvider(provider: LLMProvider): string | undefined {
  switch (provider) {
    case 'openai':
      return process.env.OPENAI_API_KEY;
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY;
    case 'google_ai':
      return process.env.GOOGLE_AI_API_KEY;
    default:
      return undefined;
  }
}

/**
 * Refresh an OAuth access token using refresh token
 */
async function refreshOAuthToken(
  provider: string,
  encryptedRefreshToken: string,
  refreshTokenIv: string
): Promise<{
  accessToken: string;
  encryptedKey: string;
  iv: string;
  expiresAt: Date;
}> {
  const { encryptKey } = await import('@/lib/crypto');
  const refreshToken = decryptKey(encryptedRefreshToken, refreshTokenIv);

  if (provider === 'github_copilot') {
    // Refresh GitHub token
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
        client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh GitHub token: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`GitHub token refresh error: ${data.error}`);
    }

    const { access_token, expires_in } = data;
    const { encryptedKey, iv } = encryptKey(access_token);

    return {
      accessToken: access_token,
      encryptedKey,
      iv,
      expiresAt: new Date(Date.now() + expires_in * 1000),
    };
  }

  if (provider === 'openai_codex') {
    // Refresh OpenAI token
    const response = await fetch('https://auth.openai.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.OPENAI_OAUTH_CLIENT_ID,
        client_secret: process.env.OPENAI_OAUTH_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh OpenAI token: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`OpenAI token refresh error: ${data.error}`);
    }

    const { access_token, expires_in } = data;
    const { encryptedKey, iv } = encryptKey(access_token);

    return {
      accessToken: access_token,
      encryptedKey,
      iv,
      expiresAt: new Date(Date.now() + expires_in * 1000),
    };
  }

  throw new Error(`Token refresh not implemented for provider: ${provider}`);
}
