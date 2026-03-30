/**
 * DELETE /api/projects/[id]/repos/[repoId]
 * Detach a repository from a project
 */

import { getSession } from '@/lib/auth';
import { apiResponse } from '@/lib/utils';
import { db } from '@/lib/db';

interface Params {
  id: string;
  repoId: string;
}

/**
 * DELETE /api/projects/[id]/repos/[repoId]
 * Detach a repository from this project
 */
export async function DELETE(request: Request, { params }: { params: Promise<Params> }) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json(
        apiResponse(false, undefined, { code: 'UNAUTHORIZED', message: 'Not authenticated' }),
        { status: 401 }
      );
    }

    const { id: projectId, repoId } = await params;

    // Verify project ownership
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

    // Verify repo belongs to this project
    const repo = await db.repoAttachment.findUnique({
      where: { id: repoId },
      select: { projectId: true },
    });

    if (!repo || repo.projectId !== projectId) {
      return Response.json(
        apiResponse(false, undefined, { code: 'NOT_FOUND', message: 'Repository not found' }),
        { status: 404 }
      );
    }

    // Delete repo attachment (cascade will handle related records)
    await db.repoAttachment.delete({
      where: { id: repoId },
    });

    return Response.json(
      apiResponse(true, { message: 'Repository detached successfully' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error detaching repository:', error);
    return Response.json(
      apiResponse(false, undefined, { code: 'INTERNAL_ERROR', message: 'Internal server error' }),
      { status: 500 }
    );
  }
}
