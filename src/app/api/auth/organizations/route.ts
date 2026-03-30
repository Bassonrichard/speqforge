import { withAuth } from '@/lib/api-middleware';
import { apiResponse } from '@/lib/utils';
import { db } from '@/lib/db';

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
