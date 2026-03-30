/**
 * POST /api/projects/[id]/repos
 * Attach a GitHub repository to a project
 */

import { withAuth, validateBody } from '@/lib/api-middleware';
import { getSession } from '@/lib/auth';
import { apiResponse } from '@/lib/utils';
import { AttachRepositoryInput } from '@/lib/validation';
import { db } from '@/lib/db';

/**
 * POST /api/projects/[id]/repos
 * Attach a GitHub repository to this project
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json(
        apiResponse(false, undefined, { code: 'UNAUTHORIZED', message: 'Not authenticated' }),
        { status: 401 }
      );
    }

    const { id: projectId } = await params;

    // Verify project exists and belongs to user's org
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { orgId: true },
    });

    if (!project || project.orgId !== session.orgId) {
      return Response.json(
        apiResponse(false, undefined, { code: 'NOT_FOUND', message: 'Project not found' }),
        { status: 404 }
      );
    }

    const input = await validateBody(request, AttachRepositoryInput);

    // Check if repo already attached to this project
    const existing = await db.repoAttachment.findUnique({
      where: {
        projectId_fullName: {
          projectId,
          fullName: input.fullName,
        },
      },
    });

    if (existing) {
      return Response.json(
        apiResponse(false, undefined, {
          code: 'ALREADY_ATTACHED',
          message: 'Repository already attached to this project',
        }),
        { status: 400 }
      );
    }

    const repo = await db.repoAttachment.create({
      data: {
        projectId,
        orgId: session.orgId,
        fullName: input.fullName,
        defaultBranch: input.defaultBranch || 'main',
      },
    });

    return Response.json(
      apiResponse(true, {
        id: repo.id,
        fullName: repo.fullName,
        defaultBranch: repo.defaultBranch,
        createdAt: repo.createdAt,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error attaching repository:', error);
    const message = error instanceof Error ? error.message : 'Failed to attach repository';
    return Response.json(
      apiResponse(false, undefined, { code: 'INTERNAL_ERROR', message }),
      { status: 500 }
    );
  }
}
