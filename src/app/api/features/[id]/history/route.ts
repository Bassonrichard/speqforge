import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: featureId } = await params;

    // Fetch audit logs for this feature filtered by status change actions
    const auditLogs = await db.auditLog.findMany({
      where: {
        resourceType: 'feature',
        resourceId: featureId,
        action: {
          in: [
            'SPEC_APPROVED',
            'SPEC_REJECTED',
            'SPEC_HANDED_OFF',
            'FEATURE_STATUS_CHANGED',
          ],
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Transform to status history format
    const statusHistory = auditLogs.map((log) => {
      const details = log.details
        ? typeof log.details === 'string'
          ? JSON.parse(log.details)
          : log.details
        : {};

      return {
        id: log.id,
        timestamp: log.timestamp,
        status: details.newStatus || details.status || 'UNKNOWN',
        userId: log.userId,
        userName: log.userId, // TODO: Fetch actual user names when auth is complete
        details: {
          reason: details.reason,
          approvers: details.approvedBy,
          reviewers: details.reviewers,
          oldStatus: details.oldStatus,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: statusHistory,
    });
  } catch (error) {
    console.error('Error fetching feature history:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch feature history',
      },
      { status: 500 }
    );
  }
}
