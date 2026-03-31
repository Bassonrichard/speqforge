import { NextRequest, NextResponse } from 'next/server';
import { templateService } from '@/services/template-service';
import { z } from 'zod';

const createTemplateSchema = z.object({
  name: z.string().min(1),
  content: z.string().min(100),
  setAsDefault: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // TODO: Get authenticated user and orgId from session
    const orgId = request.headers.get('x-org-id') || 'default-org';

    const templates = await templateService.getTemplates(orgId);

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch templates',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Get authenticated user and orgId from session
    const orgId = request.headers.get('x-org-id') || 'default-org';
    const userId = request.headers.get('x-user-id') || 'default-user';

    const body = await request.json();
    const { name, content, setAsDefault } = createTemplateSchema.parse(body);

    // TODO: Check if user is org admin (RBAC)

    const template = await templateService.createTemplate(
      orgId,
      name,
      content,
      userId,
      setAsDefault
    );

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Error creating template:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create template',
      },
      { status: 500 }
    );
  }
}
