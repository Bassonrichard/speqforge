import { db } from '@/lib/db';
import { auditService } from '@/services/audit-service';
import {
  GHWebhookPayload,
  GHPullRequest,
  isGHPullRequestWebhook,
} from '@/types/github';

export interface WebhookResult {
  success: boolean;
  message: string;
  featureId?: string;
  action?: string;
}

export class WebhookService {
  /**
   * Process a GitHub webhook event
   */
  async processWebhook(
    event: string,
    payload: GHWebhookPayload
  ): Promise<WebhookResult> {
    // Route to appropriate handler
    if (event === 'pull_request' && isGHPullRequestWebhook(payload)) {
      const result = await this.handlePullRequestEvent(payload);
      
      // Log webhook event after processing
      if (result.featureId) {
        // We'll need to get orgId from the feature
        const feature = await db.feature.findUnique({
          where: { id: result.featureId },
          select: { project: { select: { orgId: true } } },
        });
        
        if (feature) {
          await this.logWebhookEvent(
            event,
            payload,
            result.featureId,
            feature.project.orgId,
            result.success ? 'PROCESSED' : 'ERROR'
          );
        }
      }
      
      return result;
    }

    return {
      success: true,
      message: `Event ${event} acknowledged but not processed`,
    };
  }

  /**
   * Handle pull request webhook events
   */
  private async handlePullRequestEvent(
    payload: GHWebhookPayload & { pull_request: GHPullRequest }
  ): Promise<WebhookResult> {
    const pr = payload.pull_request;
    const action = payload.action;

    // Extract feature ID from branch name
    // Expected format: spec/{projectKey}/{featureId}-{slug}
    const featureId = this.extractFeatureIdFromBranch(pr.head.ref);

    if (!featureId) {
      return {
        success: true,
        message: 'Not a spec branch, ignoring',
      };
    }

    // Find the feature
    const feature = await db.feature.findFirst({
      where: {
        OR: [
          { id: featureId },
          {
            specs: {
              some: {
                branchName: pr.head.ref,
              },
            },
          },
        ],
      },
      include: {
        project: true,
        specs: {
          where: {
            branchName: pr.head.ref,
          },
          take: 1,
        },
      },
    });

    if (!feature) {
      return {
        success: true,
        message: `No feature found for branch ${pr.head.ref}`,
      };
    }

    // Handle different PR actions
    if (action === 'opened') {
      return this.handlePROpened(feature.id, pr, feature.project.orgId, payload.repository.full_name);
    } else if (action === 'closed' && pr.merged_at) {
      return this.handlePRMerged(feature.id, pr, feature.project.orgId, payload.repository.full_name);
    }

    return {
      success: true,
      message: `PR action ${action} acknowledged`,
      featureId: feature.id,
      action,
    };
  }

  /**
   * Handle PR opened event
   */
  private async handlePROpened(
    featureId: string,
    pr: GHPullRequest,
    orgId: string,
    repository: string
  ): Promise<WebhookResult> {
    // Update feature status to IN_PROGRESS
    await db.feature.update({
      where: { id: featureId },
      data: { status: 'IN_PROGRESS' },
    });

    // Log the status change
    await auditService.logAction({
      orgId,
      userId: 'system',
      action: 'STATUS_CHANGED',
      resourceType: 'feature',
      resourceId: featureId,
      details: {
        oldStatus: 'HANDED_OFF',
        newStatus: 'IN_PROGRESS',
        prUrl: pr.html_url,
        prNumber: pr.number,
        repository,
      },
    });

    return {
      success: true,
      message: `Feature ${featureId} moved to IN_PROGRESS`,
      featureId,
      action: 'opened',
    };
  }

  /**
   * Handle PR merged event
   */
  private async handlePRMerged(
    featureId: string,
    pr: GHPullRequest,
    orgId: string,
    repository: string
 ): Promise<WebhookResult> {
    // Get all sync records for this feature
    const syncRecords = await db.repoSyncRecord.findMany({
      where: {
        featureId,
      },
      include: {
        repo: true,
      },
    });

    // Check if all repos have been merged
    // For simplicity in MVP, we'll mark COMPLETE on first merge
    // In production, you might want to track per-repo status

    await db.feature.update({
      where: { id: featureId },
      data: {
        status: 'COMPLETE',
        completedAt: new Date(),
      },
    });

    // Log the status change
    await auditService.logAction({
      orgId,
      userId: 'system',
      action: 'STATUS_CHANGED',
      resourceType: 'feature',
      resourceId: featureId,
      details: {
        oldStatus: 'IN_PROGRESS',
        newStatus: 'COMPLETE',
        prUrl: pr.html_url,
        prNumber: pr.number,
        repository,
        mergedAt: pr.merged_at,
        mergedBy: pr.merged_by?.login,
      },
    });

    return {
      success: true,
      message: `Feature ${featureId} marked as COMPLETE`,
      featureId,
      action: 'merged',
    };
  }

  /**
   * Extract feature ID from branch name
   * Expected format: spec/{projectKey}/{featureId}-{slug}
   * or spec/{projectKey}/{featureId}-{slug}-r{revNumber}
   */
  private extractFeatureIdFromBranch(branchName: string): string | null {
    const match = branchName.match(/spec\/[^/]+\/([a-f0-9-]+)/);
    if (!match) return null;

    // Extract just the feature ID part (before the slug)
    const idPart = match[1];
    const parts = idPart.split('-');

    // If it's a short ID (8 chars), it's likely the feature ID
    // Otherwise, try to extract UUID pattern
    if (parts[0].length === 8) {
      return parts[0];
    }

    // Try to match UUID pattern
    const uuidMatch = idPart.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/
    );
    return uuidMatch ? uuidMatch[0] : null;
  }

  /**
   * Log webhook event for audit trail
   */
  private async logWebhookEvent(
    event: string,
    payload: GHWebhookPayload,
    featureId?: string,
    orgId?: string,
    status?: string
  ): Promise<void> {
    try {
      // Only log if we have featureId and orgId
      if (featureId && orgId) {
        await db.webhookEvent.create({
          data: {
            eventType: event,
            featureId,
            orgId,
            githubPayload: JSON.stringify(payload),
            status: status || 'PROCESSED',
            processedAt: new Date(),
          },
        });
      }
    } catch (error) {
      console.error('Failed to log webhook event:', error);
    }
  }

  /**
   * Get webhook events for a feature (for debugging/monitoring)
   */
  async getFeatureWebhooks(featureId: string, limit: number = 20) {
    // This would require more complex querying
    // For now, return recent webhooks (simplified)
    return db.webhookEvent.findMany({
      take: limit,
      orderBy: {
        processedAt: 'desc',
      },
    });
  }
}

export const webhookService = new WebhookService();
