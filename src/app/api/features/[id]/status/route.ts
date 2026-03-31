import { NextRequest, NextResponse } from 'next/server';
import { approvalService } from '@/services/approval-service';
import { auditService } from '@/services/audit-service';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum([
    'DRAFT',
    'IN_REVIEW',
    'APPROVED',
    'REJECTED',
    'HANDED_OFF',
    'IN_PROGRESS',
    'COMPLETE',
  ]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: featureId } = await params;

    // TODO: Get authenticated user from session
    const userId = request.headers.get('x-user-id') || 'default-user';
    const orgId = request.headers.get('x-org-id') || 'default-org';

    const body = await request.json();
    const { status } = updateStatusSchema.parse(body);

    // Get current feature
    const feature = await db.feature.findUnique({
      where: { id: featureId },
    });

    if (!feature) {
      return NextResponse.json(
        { success: false, error: 'Feature not found' },
        { status: 404 }
      );
    }

    // Validate transition
    const canTransition = approvalService.canTransition(
      feature.status as any,
      status,
      true // manual transition
    );

    if (!canTransition) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot transition from ${feature.status} to ${status}`,
        },
        { status: 400 }
      );
    }

    // Update status
    const updateData: any = { status };
    
    // Set completedAt timestamp when transitioning to COMPLETE
    if (status === 'COMPLETE') {
      updateData.completedAt = new Date();
    }
    
    await db.feature.update({
      where: { id: featureId },
      data: updateData,
    });

    // Log the status change
    await auditService.logAction({
      orgId,
      userId,
      action: 'STATUS_CHANGED',
      resourceType: 'feature',
      resourceId: featureId,
      details: {
        oldStatus: feature.status,
        newStatus: status,
        manual: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: { featureId, oldStatus: feature.status, newStatus: status },
    });
  } catch (error) {
    console.error('Error updating feature status:', error);

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
            : 'Failed to update feature status',
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: featureId } = await params;

    const feature = await db.feature.findUnique({
      where: { id: featureId },
      select: {
        id: true,
        status: true,
        completedAt: true,
        updatedAt: true,
      },
    });

    if (!feature) {
      return NextResponse.json(
        { success: false, error: 'Feature not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: feature,
    });
  } catch (error) {
    console.error('Error fetching feature status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch feature status',
      },
      { status: 500 }
    );
  }
}
