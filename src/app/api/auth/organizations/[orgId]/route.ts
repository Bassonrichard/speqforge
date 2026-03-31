/**
 * Organization Detail API
 * GET /api/auth/organizations/[orgId] - Get organization details
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { apiResponse } from '@/lib/api-middleware';

interface RouteContext {
  params: Promise<{ orgId: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    // Verify session
    const session = await verifySession(request);
    if (!session) {
      return apiResponse(401, { code: 'UNAUTHORIZED', message: 'Not authenticated' });
    }

    const { orgId } = await context.params;

    // Verify user belongs to this org
    if (session.organizationId !== orgId) {
      return apiResponse(403, {
        code: 'FORBIDDEN',
        message: 'You do not have access to this organization',
      });
    }

    // Fetch organization details
    const organization = await db.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        gitHubOrgName: true,
        approvalThreshold: true,
        createdAt: true,
      },
    });

    if (!organization) {
      return apiResponse(404, {
        code: 'NOT_FOUND',
        message: 'Organization not found',
      });
    }

    return apiResponse(200, { organization });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return apiResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'Failed to fetch organization',
    });
  }
}
