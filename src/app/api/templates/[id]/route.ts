import { getSession, isOrgAdmin } from '@/lib/auth';
import { templateService } from '@/services/template-service';
import { apiResponse } from '@/lib/utils';
import { z } from 'zod';
import { db } from '@/lib/db';

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  content: z.string().min(100).optional(),
  isDefault: z.boolean().optional(),
});

/**
 * GET /api/templates/[id]
 * Get a specific template
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json(
      apiResponse(false, null, { code: 'UNAUTHORIZED', message: 'Not authenticated' }),
      { status: 401 }
    );
  }

  const orgId = session.orgId;
  if (!orgId) {
    return Response.json(
      apiResponse(false, null, { code: 'NO_ORG', message: 'Organization context required' }),
      { status: 400 }
    );
  }

  const { id } = await params;

  const template = await db.specTemplate.findFirst({
    where: {
      id,
      orgId,
    },
  });

  if (!template) {
    return Response.json(
      apiResponse(false, null, { code: 'NOT_FOUND', message: 'Template not found' }),
      { status: 404 }
    );
  }

  return Response.json(apiResponse(true, template), { status: 200 });
}

/**
 * PUT /api/templates/[id]
 * Update a template (admin only)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json(
      apiResponse(false, null, { code: 'UNAUTHORIZED', message: 'Not authenticated' }),
      { status: 401 }
    );
  }

  const orgId = session.orgId;
  const userId = session.userId;
  if (!orgId) {
    return Response.json(
      apiResponse(false, null, { code: 'NO_ORG', message: 'Organization context required' }),
      { status: 400 }
    );
  }

  // Check if user is org admin
  if (!(await isOrgAdmin(session))) {
    return Response.json(
      apiResponse(false, null, { code: 'FORBIDDEN', message: 'Admin access required' }),
      { status: 403 }
    );
  }

  const { id } = await params;

  const body = await request.json();
  const validation = updateTemplateSchema.safeParse(body);

  if (!validation.success) {
    return Response.json(
      apiResponse(false, null, { code: 'VALIDATION_ERROR', message: 'Invalid request data' }),
      { status: 400 }
    );
  }

  const updates = validation.data;

  try {
    // Verify template belongs to org
    const existingTemplate = await db.specTemplate.findFirst({
      where: { id, orgId },
    });

    if (!existingTemplate) {
      return Response.json(
        apiResponse(false, null, { code: 'NOT_FOUND', message: 'Template not found' }),
        { status: 404 }
      );
    }

    const template = await templateService.updateTemplate(id, updates);

    // Audit log
    await db.auditLog.create({
      data: {
        orgId,
        userId,
        action: 'template.updated',
        resourceType: 'SpecTemplate',
        resourceId: template.id,
        details: JSON.stringify(updates),
      },
    });

    return Response.json(apiResponse(true, template), { status: 200 });
  } catch (error) {
    console.error('Error updating template:', error);
    return Response.json(
      apiResponse(false, null, {
        code: 'SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update template',
      }),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/templates/[id]
 * Delete a template (admin only, cannot delete default)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json(
      apiResponse(false, null, { code: 'UNAUTHORIZED', message: 'Not authenticated' }),
      { status: 401 }
    );
  }

  const orgId = session.orgId;
  const userId = session.userId;
  if (!orgId) {
    return Response.json(
      apiResponse(false, null, { code: 'NO_ORG', message: 'Organization context required' }),
      { status: 400 }
    );
  }

  // Check if user is org admin
  if (!(await isOrgAdmin(session))) {
    return Response.json(
      apiResponse(false, null, { code: 'FORBIDDEN', message: 'Admin access required' }),
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    // Verify template belongs to org
    const template = await db.specTemplate.findFirst({
      where: { id, orgId },
    });

    if (!template) {
      return Response.json(
        apiResponse(false, null, { code: 'NOT_FOUND', message: 'Template not found' }),
        { status: 404 }
      );
    }

    await templateService.deleteTemplate(id);

    // Audit log
    await db.auditLog.create({
      data: {
        orgId,
        userId,
        action: 'template.deleted',
        resourceType: 'SpecTemplate',
        resourceId: id,
        details: JSON.stringify({ name: template.name }),
      },
    });

    return Response.json(apiResponse(true, { id }), { status: 200 });
  } catch (error) {
    console.error('Error deleting template:', error);
    return Response.json(
      apiResponse(false, null, {
        code: 'SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete template',
      }),
      { status: 500 }
    );
  }
}
