/**
 * Organization Members API
 * GET /api/auth/organizations/[orgId]/members - List organization members
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ orgId: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    // Verify session
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { orgId } = await context.params;

    // Verify user belongs to this org
    if (session.orgId !== orgId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have access to this organization' } },
        { status: 403 }
      );
    }

    // Fetch all members of the organization via OrgMember join table
    const orgMembers = await db.orgMember.findMany({
      where: {
        orgId: orgId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'asc',
      },
    });

    // Transform to include role with user data
    const members = orgMembers.map((om) => ({
      id: om.user.id,
      name: om.user.username, // Use username as name
      email: om.user.email,
      orgRole: om.role.toLowerCase() as 'owner' | 'admin' | 'member' | 'approver' | 'reviewer',
    }));

    return NextResponse.json({ success: true, data: { members } });
  } catch (error) {
    console.error('Error fetching organization members:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch organization members' } },
      { status: 500 }
    );
  }
}
