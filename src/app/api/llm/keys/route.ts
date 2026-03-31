import { NextRequest, NextResponse } from 'next/server';
import { encryptKey, decryptKey } from '@/lib/crypto';
import { db } from '@/lib/db';
import { z } from 'zod';

const saveKeySchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google_ai']),
  apiKey: z.string().min(10),
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
      maskedKey: `•••${key.encryptedKey.slice(-4)}`,
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
    // TODO: Check if user is org admin (RBAC)

    const body = await request.json();
    const { provider, apiKey, setAsDefault } = saveKeySchema.parse(body);

    // Encrypt the API key
    const { encryptedKey, iv } = encryptKey(apiKey);

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
        encryptedKey,
        iv,
      },
      update: {
        encryptedKey,
        iv,
        updatedAt: new Date(),
      },
    });

    // Update default provider if requested
    if (setAsDefault) {
      await db.organization.update({
        where: { id: orgId },
        data: {
          aiSettings: {
            defaultProvider: provider,
            providers: [provider], // Add to list
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'API key saved successfully',
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
