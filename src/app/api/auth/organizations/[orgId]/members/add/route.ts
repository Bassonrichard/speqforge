/**
 * Organization Member Management API
 * POST /api/auth/organizations/[orgId]/members - Add member to organization
 * PUT /api/auth/organizations/[orgId]/members/[memberId] - Update member role
 * DELETE /api/auth/organizations/[orgId]/members/[memberId] - Remove member
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const addMemberSchema = z.object({
  userId: z.string(),
  role: z.enum(['ADMIN', 'MEMBER', 'APPROVER', 'REVIEWER']),
});

interface RouteContext {
  params: Promise<{ orgId: string }>;
}

/**
 * POST /api/auth/organizations/[orgId]/members
 * Add a new member to the organization
 */
export async function POST(
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

    // Verify user is admin of this org
    const membership = await db.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId: session.userId,
        },
      },
    });

    if (!membership || (membership.role !== 'ADMIN' && membership.role !== 'OWNER')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = addMemberSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validation.error.issues[0].message } },
        { status: 400 }
      );
    }

    const { userId, role } = validation.data;

    // Check if user already exists in org
    const existingMember = await db.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'User is already a member of this organization' } },
        { status: 409 }
      );
    }

    // Add member to organization
    const newMember = await db.orgMember.create({
      data: {
        orgId,
        userId,
        role,
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
    });

    return NextResponse.json({
      success: true,
      data: {
        member: {
          id: newMember.user.id,
          name: newMember.user.username,
          email: newMember.user.email,
          role: newMember.role,
        },
      },
    });
  } catch (error) {
    console.error('Error adding organization member:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to add member' } },
      { status: 500 }
    );
  }
}
