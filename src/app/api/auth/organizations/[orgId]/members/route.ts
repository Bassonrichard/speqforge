/**
 * Organization Members API
 * GET /api/auth/organizations/[orgId]/members - List organization members
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

    // Fetch all members of the organization
    const members = await db.user.findMany({
      where: {
        organizationId: orgId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        orgRole: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return apiResponse(200, { members });
  } catch (error) {
    console.error('Error fetching organization members:', error);
    return apiResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'Failed to fetch organization members',
    });
  }
}
