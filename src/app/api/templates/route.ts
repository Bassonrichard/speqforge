import { NextRequest } from 'next/server';
import { templateService } from '@/services/template-service';
import { withAuth } from '@/lib/api-middleware';
import { apiResponse } from '@/lib/utils';
import { isOrgAdmin } from '@/lib/auth';
import { z } from 'zod';
import { db } from '@/lib/db';

const createTemplateSchema = z.object({
  name: z.string().min(1),
  content: z.string().min(100),
  setAsDefault: z.boolean().optional(),
});

/**
 * GET /api/templates
 * List all templates for the organization
 */
export const GET = withAuth(async (req, { session }) => {
  const orgId = session.orgId;

  if (!orgId) {
    return Response.json(
      apiResponse(false, null, { code: 'NO_ORG', message: 'Organization context required' }),
      {
        status: 400,
      }
    );
  }

  const templates = await templateService.getTemplates(orgId);

  return Response.json(apiResponse(true, templates), { status: 200 });
});

/**
 * POST /api/templates
 * Create a new template (admin only)
 */
export const POST = withAuth(async (req, { session }) => {
  const orgId = session.orgId;
  const userId = session.userId;

  if (!orgId) {
    return Response.json(
      apiResponse(false, null, { code: 'NO_ORG', message: 'Organization context required' }),
      {
        status: 400,
      }
    );
  }

  // Check if user is org admin
  if (!(await isOrgAdmin(session))) {
    return Response.json(
      apiResponse(false, null, { code: 'FORBIDDEN', message: 'Admin access required' }),
      {
        status: 403,
      }
    );
  }

  const body = await req.json();
  const validation = createTemplateSchema.safeParse(body);

  if (!validation.success) {
    return Response.json(
      apiResponse(false, null, { code: 'VALIDATION_ERROR', message: 'Invalid request data' }),
      { status: 400 }
    );
  }

  const { name, content, setAsDefault } = validation.data;

  try {
    const template = await templateService.createTemplate(
      orgId,
      name,
      content,
      userId,
      setAsDefault
    );

    // Audit log
    await db.auditLog.create({
      data: {
        orgId,
        userId,
        action: 'template.created',
        resourceType: 'SpecTemplate',
        resourceId: template.id,
        details: JSON.stringify({ name, setAsDefault }),
      },
    });

    return Response.json(apiResponse(true, template), { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return Response.json(
      apiResponse(false, null, {
        code: 'SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create template',
      }),
      { status: 500 }
    );
  }
});
