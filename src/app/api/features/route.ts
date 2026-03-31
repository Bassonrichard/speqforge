/**
 * GET/POST /api/features
 * Feature list and creation endpoints
 */

import { withAuth, validateBody } from '@/lib/api-middleware';
import { apiResponse } from '@/lib/utils';
import { CreateFeatureInput } from '@/lib/validation';
import { db } from '@/lib/db';

/**
 * GET /api/features
 * List features for the current organization, with optional filters
 */
export const GET = withAuth(async (req, { session }) => {
  if (!session.orgId) {
    return Response.json(
      apiResponse(false, undefined, { code: 'NO_ORG', message: 'User must select an organization first' }),
      { status: 400 }
    );
  }

  // Extract query parameters
  const url = new URL(req.url);
  const projectId = url.searchParams.get('projectId');
  const status = url.searchParams.get('status');
  const sortBy = url.searchParams.get('sortBy') || 'createdAt';
  const sortOrder = url.searchParams.get('sortOrder') || 'desc';

  const features = await db.feature.findMany({
    where: {
      project: {
        orgId: session.orgId,
      },
      ...(projectId ? { projectId } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          projectKey: true,
        },
      },
      specs: {
        select: {
          id: true,
          revNumber: true,
          status: true,
          isActive: true,
        },
        orderBy: { revNumber: 'desc' },
        take: 1,
      },
    },
    orderBy: { [sortBy]: sortOrder },
  });

  return Response.json(
    apiResponse(true, {
      features: features.map((f) => ({
        id: f.id,
        title: f.title,
        description: f.description,
        status: f.status,
        projectId: f.projectId,
        projectName: f.project.name,
        projectKey: f.project.projectKey,
        latestSpec: f.specs[0] || null,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      })),
    }),
    { status: 200 }
  );
});

/**
 * POST /api/features
 * Create a new feature
 */
export const POST = withAuth(async (req, { session }) => {
  if (!session.orgId) {
    return Response.json(
      apiResponse(false, undefined, { code: 'NO_ORG', message: 'User must select an organization first' }),
      { status: 400 }
    );
  }

  const input = await validateBody(req, CreateFeatureInput);

  // Verify project exists and belongs to user's org
  const project = await db.project.findUnique({
    where: { id: input.projectId },
    select: { orgId: true },
  });

  if (!project || project.orgId !== session.orgId) {
    return Response.json(
      apiResponse(false, undefined, { code: 'NOT_FOUND', message: 'Project not found' }),
      { status: 404 }
    );
  }

  const feature = await db.feature.create({
    data: {
      projectId: input.projectId,
      title: input.title,
      description: input.description,
      createdBy: session.userId,
      status: 'DRAFT',
    },
  });

  return Response.json(
    apiResponse(true, {
      id: feature.id,
      title: feature.title,
      description: feature.description,
      status: feature.status,
      createdAt: feature.createdAt,
    }),
    { status: 201 }
  );
});
