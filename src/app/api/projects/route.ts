/**
 * GET/POST /api/projects
 * Project list and creation endpoints
 */

import { withAuth } from '@/lib/api-middleware';
import { apiResponse } from '@/lib/utils';
import { validateBody } from '@/lib/api-middleware';
import { CreateProjectInput } from '@/lib/validation';
import { db } from '@/lib/db';

/**
 * GET /api/projects
 * List all projects for the current organization
 */
export const GET = withAuth(async (req, { session }) => {
  if (!session.orgId) {
    return Response.json(
      apiResponse(false, undefined, { code: 'NO_ORG', message: 'User must select an organization first' }),
      { status: 400 }
    );
  }

  const projects = await db.project.findMany({
    where: { orgId: session.orgId },
    orderBy: { createdAt: 'desc' },
    include: {
      repos: true,
      features: true,
    },
  });

  return Response.json(
    apiResponse(true, {
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        projectKey: p.projectKey,
        branchPattern: p.branchPattern,
        repoCount: p.repos.length,
        featureCount: p.features.length,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    }),
    { status: 200 }
  );
});

/**
 * POST /api/projects
 * Create a new project
 */
export const POST = withAuth(async (req, { session }) => {
  if (!session.orgId) {
    return Response.json(
      apiResponse(false, undefined, { code: 'NO_ORG', message: 'User must select an organization first' }),
      { status: 400 }
    );
  }

  const input = await validateBody(req, CreateProjectInput);

  // Verify projectKey is unique within org
  const existing = await db.project.findUnique({
    where: { orgId_projectKey: { orgId: session.orgId, projectKey: input.projectKey } },
  });

  if (existing) {
    return Response.json(
      apiResponse(false, undefined, {
        code: 'DUPLICATE_KEY',
        message: `Project key "${input.projectKey}" already exists in this organization`,
      }),
      { status: 400 }
    );
  }

  const project = await db.project.create({
    data: {
      orgId: session.orgId,
      name: input.name,
      description: input.description,
      projectKey: input.projectKey,
      branchPattern: input.branchPattern || 'spec/{projectKey}/{featureId}-{slug}',
    },
  });

  return Response.json(
    apiResponse(true, {
      id: project.id,
      name: project.name,
      projectKey: project.projectKey,
      createdAt: project.createdAt,
    }),
    { status: 201 }
  );
});
