import { NextRequest, NextResponse } from 'next/server';
import { encryptKey, decryptKey, maskKey } from '@/lib/crypto';
import { db } from '@/lib/db';
import { auditService } from '@/services/audit-service';
import { z } from 'zod';

const saveKeySchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google_ai', 'github_copilot', 'openai_codex']),
  apiKey: z.string().min(10).optional(),
  authType: z.enum(['api_key', 'oauth']).default('api_key'),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  expiresAt: z.string().optional(),
  setAsDefault: z.boolean().optional(),
});

// GET all configured LLM keys (masked)
export async function GET(request: NextRequest) {
  try {
    // TODO: Get authenticated user and orgId from session
    const orgId = request.headers.get('x-org-id') || 'default-org';

    const keys = await db.userKey.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });

    // Return masked keys
    const maskedKeys = keys.map((key) => ({
      id: key.id,
      provider: key.provider,
      authType: key.authType,
      maskedKey: key.maskedKey || maskKey(key.encryptedKey),
      isDefault: key.isDefault,
      createdAt: key.createdAt,
      updatedAt: key.updatedAt,
    }));

    // Get org default provider
    const org = await db.organization.findUnique({
      where: { id: orgId },
      select: { aiSettings: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        keys: maskedKeys,
        defaultProvider: (org?.aiSettings as any)?.defaultProvider || null,
      },
    });
  } catch (error) {
    console.error('Error fetching LLM keys:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch LLM keys',
      },
      { status: 500 }
    );
  }
}

// PUT save/update LLM key
export async function PUT(request: NextRequest) {
  try {
    // TODO: Get authenticated user and orgId from session
    const orgId = request.headers.get('x-org-id') || 'default-org';
    const userId = request.headers.get('x-user-id') || 'default-user';
    // TODO: Check if user is org admin (RBAC)

    const body = await request.json();
    const { provider, apiKey, authType, accessToken, refreshToken, expiresAt, setAsDefault } = saveKeySchema.parse(body);

    // For API key providers
    if (authType === 'api_key' && apiKey) {
      // Encrypt the API key
      const { encryptedKey, iv } = encryptKey(apiKey);
      const masked = maskKey(apiKey);

      // Clear any existing default if setting new one
      if (setAsDefault) {
        await db.userKey.updateMany({
          where: { orgId, isDefault: true },
          data: { isDefault: false },
        });
      }

      // Save or update the key
      await db.userKey.upsert({
        where: {
          orgId_provider: {
            orgId,
            provider,
          },
        },
        create: {
          orgId,
          provider,
          authType: 'api_key',
          encryptedKey,
          iv,
          maskedKey: masked,
          isDefault: setAsDefault || false,
        },
        update: {
          encryptedKey,
          iv,
          maskedKey: masked,
          isDefault: setAsDefault || false,
          updatedAt: new Date(),
        },
      });

      // Log the action
      await auditService.logAction({
        orgId,
        userId,
        action: 'LLM_KEY_CONFIGURED',
        resourceType: 'user_key',
        resourceId: provider,
        details: {
          provider,
          authType: 'api_key',
          isDefault: setAsDefault,
        },
      });
    }

    // For OAuth providers (GitHub Copilot, etc.)
    if (authType === 'oauth' && accessToken) {
      const { encryptedKey: encryptedAccessToken, iv: accessTokenIv } = encryptKey(accessToken);
      
      let encryptedRefreshToken: string | undefined;
      let refreshTokenIv: string | undefined;
      
      if (refreshToken) {
        const refreshData = encryptKey(refreshToken);
        encryptedRefreshToken = refreshData.encryptedKey;
        refreshTokenIv = refreshData.iv;
      }

      // Clear any existing default if setting new one
      if (setAsDefault) {
        await db.userKey.updateMany({
          where: { orgId, isDefault: true },
          data: { isDefault: false },
        });
      }

      await db.userKey.upsert({
        where: {
          orgId_provider: {
            orgId,
            provider,
          },
        },
        create: {
          orgId,
          provider,
          authType: 'oauth',
          encryptedKey: encryptedAccessToken,
          iv: accessTokenIv,
          refreshToken: encryptedRefreshToken,
          refreshTokenIv,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
          maskedKey: 'OAuth Token',
          isDefault: setAsDefault || false,
        },
        update: {
          encryptedKey: encryptedAccessToken,
          iv: accessTokenIv,
          refreshToken: encryptedRefreshToken,
          refreshTokenIv,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
          isDefault: setAsDefault || false,
          updatedAt: new Date(),
        },
      });

      // Log the action
      await auditService.logAction({
        orgId,
        userId,
        action: 'LLM_KEY_CONFIGURED',
        resourceType: 'user_key',
        resourceId: provider,
        details: {
          provider,
          authType: 'oauth',
          isDefault: setAsDefault,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `${authType === 'oauth' ? 'OAuth token' : 'API key'} saved successfully`,
    });
  } catch (error) {
    console.error('Error saving LLM key:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to save API key',
      },
      { status: 500 }
    );
  }
}

// DELETE remove LLM key
export async function DELETE(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id') || 'default-org';
    const userId = request.headers.get('x-user-id') || 'default-user';
    
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Provider is required' },
        { status: 400 }
      );
    }

    await db.userKey.delete({
      where: {
        orgId_provider: {
          orgId,
          provider,
        },
      },
    });

    // Log the action
    await auditService.logAction({
      orgId,
      userId,
      action: 'LLM_KEY_CONFIGURED',
      resourceType: 'user_key',
      resourceId: provider,
      details: {
        provider,
        action: 'deleted',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting LLM key:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete API key',
      },
      { status: 500 }
    );
  }
}
