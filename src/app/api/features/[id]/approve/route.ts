import { getSession } from '@/lib/auth';
import { approvalService } from '@/services/approval-service';
import { apiResponse } from '@/lib/utils';
import { z } from 'zod';
import { db } from '@/lib/db';

const requestReviewSchema = z.object({
  specRevisionId: z.string().cuid(),
  reviewerIds: z.array(z.string().cuid()).min(1, 'At least one reviewer is required'),
});

const approveRejectSchema = z.object({
  specRevisionId: z.string().cuid(),
  comment: z.string().max(1000).optional(),
});

const rejectSchema = z.object({
  specRevisionId: z.string().cuid(),
  reason: z.string().min(1, 'Rejection reason is required').max(1000),
});

/**
 * POST /api/features/[id]/approve/request-review
 * Request review from assigned reviewers
 */
export async function POST(
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

  const { id: featureId } = await params;
  const body = await request.json();
  
  // Determine which action is being requested
  const action = body.action as 'request-review' | 'approve' | 'reject';

  try {
    if (action === 'request-review') {
      const validation = requestReviewSchema.safeParse(body);
      if (!validation.success) {
        return Response.json(
          apiResponse(false, null, { code: 'VALIDATION_ERROR', message: 'Invalid request data' }),
          { status: 400 }
        );
      }

      const { specRevisionId, reviewerIds } = validation.data;

      // Verify feature belongs to user's org
      const feature = await db.feature.findUnique({
        where: { id: featureId },
        include: { project: true },
      });

      if (!feature || feature.project.orgId !== session.orgId) {
        return Response.json(
          apiResponse(false, null, { code: 'NOT_FOUND', message: 'Feature not found' }),
          { status: 404 }
        );
      }

      await approvalService.requestReview(
        specRevisionId,
        reviewerIds,
        session.userId,
        session.orgId!
      );

      return Response.json(
        apiResponse(true, { message: 'Review requested successfully' }),
        { status: 200 }
      );
    }

    if (action === 'approve') {
      const validation = approveRejectSchema.safeParse(body);
      if (!validation.success) {
        return Response.json(
          apiResponse(false, null, { code: 'VALIDATION_ERROR', message: 'Invalid request data' }),
          { status: 400 }
        );
      }

      const { specRevisionId, comment } = validation.data;

      // Get org approval threshold
      const org = await db.organization.findUnique({
        where: { id: session.orgId! },
      });

      const threshold = (org?.approvalThreshold as 'SINGLE' | 'UNANIMOUS' | 'MAJORITY') || 'SINGLE';

      const result = await approvalService.approveSpec(
        specRevisionId,
        session.userId,
        session.orgId!,
        threshold,
        comment
      );

      return Response.json(
        apiResponse(true, result),
        { status: 200 }
      );
    }

    if (action === 'reject') {
      const validation = rejectSchema.safeParse(body);
      if (!validation.success) {
        return Response.json(
          apiResponse(false, null, { code: 'VALIDATION_ERROR', message: 'Invalid request data' }),
          { status: 400 }
        );
      }

      const { specRevisionId, reason } = validation.data;

      await approvalService.rejectSpec(
        specRevisionId,
        session.userId,
        reason,
        session.orgId!
      );

      return Response.json(
        apiResponse(true, { message: 'Spec rejected' }),
        { status: 200 }
      );
    }

    return Response.json(
      apiResponse(false, null, { code: 'BAD_REQUEST', message: 'Invalid action' }),
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in approval workflow:', error);
    return Response.json(
      apiResponse(false, null, {
        code: 'SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to process approval action',
      }),
      { status: 500 }
    );
  }
}
