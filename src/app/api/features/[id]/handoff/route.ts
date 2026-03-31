import { NextRequest, NextResponse } from 'next/server';
import { syncService } from '@/services/sync-service';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: featureId } = await params;

    // Get feature with latest spec revision
    const feature = await db.feature.findUnique({
      where: { id: featureId },
      include: {
        project: true,
        specs: {
          where: { isActive: true },
          orderBy: { revNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!feature) {
      return NextResponse.json(
        { success: false, error: 'Feature not found' },
        { status: 404 }
      );
    }

    if (!feature.specs || feature.specs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No active specification found for this feature',
        },
        { status: 400 }
      );
    }

    const specRev = feature.specs[0];

    // Check if spec is approved
    // TODO: Implement approval check
    // if (specRev.status !== 'APPROVED') {
    //   return NextResponse.json(
    //     { success: false, error: 'Specification must be approved before handoff' },
    //     { status: 400 }
    //   );
    // }

    // Perform multi-repo sync
    const syncResult = await syncService.syncToRepos(
      specRev.id,
      feature.projectId
    );

    return NextResponse.json({
      success: true,
      data: syncResult,
      message: `Successfully synced to ${syncResult.succeeded.length} of ${
        syncResult.succeeded.length + syncResult.failed.length
      } repositories`,
    });
  } catch (error) {
    console.error('Error during handoff:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to hand off specification',
      },
      { status: 500 }
    );
  }
}

// GET sync status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: featureId } = await params;

    const syncStatus = await syncService.getSyncStatus(featureId);

    return NextResponse.json({
      success: true,
      data: syncStatus,
    });
  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch sync status',
      },
      { status: 500 }
    );
  }
}
