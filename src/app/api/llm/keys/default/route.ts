import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id') || 'default-org';
    const body = await request.json();
    const { provider } = body;

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Provider is required' },
        { status: 400 }
      );
    }

    // Clear all defaults
    await db.userKey.updateMany({
      where: { orgId, isDefault: true },
      data: { isDefault: false },
    });

    // Set new default
    await db.userKey.update({
      where: {
        orgId_provider: {
          orgId,
          provider,
        },
      },
      data: { isDefault: true },
    });

    return NextResponse.json({
      success: true,
      data: { provider },
    });
  } catch (error) {
    console.error('Error setting default provider:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to set default provider',
      },
      { status: 500 }
    );
  }
}
