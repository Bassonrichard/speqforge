/**
 * GET /api/projects/[id]
 * Project detail endpoint
 */

import { withAuth } from '@/lib/api-middleware';
import { apiResponse } from '@/lib/utils';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * GET /api/projects/[id]
 * Get project details with associated repos and features
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

    const { id: projectId } = await params;

    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        repos: {
          select: {
            id: true,
            fullName: true,
            defaultBranch: true,
            createdAt: true,
          },
        },
        features: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Verify ownership (user's org must match)
    if (!project || project.orgId !== session.orgId) {
      return Response.json(
        apiResponse(false, undefined, { code: 'NOT_FOUND', message: 'Project not found' }),
        { status: 404 }
      );
    }

    return Response.json(
      apiResponse(true, {
        id: project.id,
        name: project.name,
        description: project.description,
        projectKey: project.projectKey,
        branchPattern: project.branchPattern,
        repos: project.repos,
        features: project.features,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching project:', error);
    return Response.json(
      apiResponse(false, undefined, { code: 'INTERNAL_ERROR', message: 'Internal server error' }),
      { status: 500 }
    );
  }
}
