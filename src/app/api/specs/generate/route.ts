import { NextRequest, NextResponse } from 'next/server';
import { specService } from '@/services/spec-service';
import { db } from '@/lib/db';
import { z } from 'zod';

const generateSpecSchema = z.object({
  featureId: z.string(),
  templateId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // TODO: Get authenticated user and orgId from session
    // For now, we'll extract from request or use default
    const orgId = request.headers.get('x-org-id') || 'default-org';

    const body = await request.json();
    const { featureId, templateId } = generateSpecSchema.parse(body);

    // Get feature details
    const feature = await db.feature.findUnique({
      where: { id: featureId },
      include: {
        project: true,
      },
    });

    if (!feature) {
      return NextResponse.json(
        { success: false, error: 'Feature not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this feature's organization
    // TODO: Implement proper RBAC check

    // Generate spec
    const specRevision = await specService.generateSpec({
      featureId,
      featureDescription: feature.description || '',
      featureTitle: feature.title,
      projectName: feature.project.name,
      templateId,
      orgId: feature.project.orgId,
    });

    return NextResponse.json({
      success: true,
      data: specRevision,
    });
  } catch (error) {
    console.error('Error generating spec:', error);

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
          error instanceof Error
            ? error.message
            : 'Failed to generate specification',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featureId = searchParams.get('featureId');

    if (!featureId) {
      return NextResponse.json(
        { success: false, error: 'featureId is required' },
        { status: 400 }
      );
    }

    // Get latest spec revision for this feature
    const specRevision = await db.specRevision.findFirst({
      where: {
        featureId,
      },
      orderBy: {
        revNumber: 'desc',
      },
      include: {
        answers: true,
      },
    });

    if (!specRevision) {
      return NextResponse.json(
        { success: false, error: 'No spec found for this feature' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: specRevision,
    });
  } catch (error) {
    console.error('Error fetching spec:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch specification',
      },
      { status: 500 }
    );
  }
}
