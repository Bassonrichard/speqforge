/**
 * GET /api/features/[id]
 * Feature detail endpoint
 */

import { getSession } from '@/lib/auth';
import { apiResponse } from '@/lib/utils';
import { db } from '@/lib/db';

/**
 * GET /api/features/[id]
 * Get feature details with specs and repos
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json(
        apiResponse(false, undefined, { code: 'UNAUTHORIZED', message: 'Not authenticated' }),
        { status: 401 }
      );
    }

    const { id: featureId } = await params;

    const feature = await db.feature.findUnique({
      where: { id: featureId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectKey: true,
            orgId: true,
            repos: {
              select: {
                id: true,
                fullName: true,
                defaultBranch: true,
              },
            },
          },
        },
        specs: {
          select: {
            id: true,
            revNumber: true,
            status: true,
            branchName: true,
            commitSha: true,
            isActive: true,
            createdAt: true,
            approvedAt: true,
          },
          orderBy: { revNumber: 'desc' },
        },
        approvals: {
          select: {
            id: true,
            status: true,
            requestedBy: true,
            requestedAt: true,
            reviewers: true,
            approvedBy: true,
            rejectedBy: true,
            rejectedAt: true,
            rejectionReason: true,
            comments: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!feature || feature.project.orgId !== session.orgId) {
      return Response.json(
        apiResponse(false, undefined, { code: 'NOT_FOUND', message: 'Feature not found' }),
        { status: 404 }
      );
    }

    return Response.json(
      apiResponse(true, {
        id: feature.id,
        title: feature.title,
        description: feature.description,
        status: feature.status,
        createdBy: feature.createdBy,
        createdAt: feature.createdAt,
        updatedAt: feature.updatedAt,
        completedAt: feature.completedAt,
        project: {
          id: feature.project.id,
          name: feature.project.name,
          projectKey: feature.project.projectKey,
          repos: feature.project.repos,
        },
        specs: feature.specs,
        latestApproval: feature.approvals[0] || null,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching feature:', error);
    return Response.json(
      apiResponse(false, undefined, { code: 'INTERNAL_ERROR', message: 'Internal server error' }),
      { status: 500 }
    );
  }
}
