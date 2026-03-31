import { withAuth } from '@/lib/api-middleware';
import { apiResponse } from '@/lib/utils';
import { db } from '@/lib/db';
import { z } from 'zod';

const createOrgSchema = z.object({
  name: z.string().min(3).max(100),
  approvalThreshold: z.enum(['SINGLE', 'UNANIMOUS', 'MAJORITY']).default('SINGLE'),
});

/**
 * GET /api/auth/organizations
 * Get all organizations for the current user
 */
export const GET = withAuth(async (req, { session }) => {
  try {
    const memberships = await db.orgMember.findMany({
      where: { userId: session.userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            aiSettings: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const organizations = memberships.map((membership) => ({
      id: membership.organization.id,
      name: membership.organization.name,
      role: membership.role,
      avatarUrl: null, // TODO: Add avatar support to Organization model
    }));

    return Response.json(apiResponse(true, organizations), { status: 200 });
  } catch (error) {
    console.error('Failed to fetch organizations:', error);
    return Response.json(
      apiResponse(false, undefined, {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch organizations',
      }),
      { status: 500 }
    );
  }
});

/**
 * POST /api/auth/organizations
 * Create a new organization
 */
export const POST = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    const validation = createOrgSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        apiResponse(false, undefined, {
          code: 'VALIDATION_ERROR',
          message: validation.error.issues[0].message,
        }),
        { status: 400 }
      );
    }

    const { name, approvalThreshold } = validation.data;

    // Create organization with creator as owner
    const organization = await db.organization.create({
      data: {
        name,
        aiSettings: {},
        approvalThreshold,
        members: {
          create: {
            userId: session.userId,
            role: 'ADMIN', // Creator is admin by default
          },
        },
      },
      include: {
        members: {
          where: { userId: session.userId },
        },
      },
    });

    return Response.json(
      apiResponse(true, {
        organization: {
          id: organization.id,
          name: organization.name,
          approvalThreshold: organization.approvalThreshold,
          role: organization.members[0].role,
        },
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create organization:', error);
    return Response.json(
      apiResponse(false, undefined, {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create organization',
      }),
      { status: 500 }
    );
  }
});
