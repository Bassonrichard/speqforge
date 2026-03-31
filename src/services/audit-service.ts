import { db } from '@/lib/db';

export type AuditAction =
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'FEATURE_CREATED'
  | 'FEATURE_UPDATED'
  | 'SPEC_GENERATED'
  | 'SPEC_REGENERATED'
  | 'SPEC_APPROVED'
  | 'SPEC_REJECTED'
  | 'SPEC_HANDED_OFF'
  | 'TEMPLATE_CREATED'
  | 'TEMPLATE_UPDATED'
  | 'TEMPLATE_DELETED'
  | 'LLM_KEY_CONFIGURED'
  | 'REPO_ATTACHED'
  | 'REPO_DETACHED'
  | 'CLARIFYING_ANSWERS_SUBMITTED'
  | 'SYNC_COMPLETED'
  | 'SYNC_FAILED'
  | 'WEBHOOK_RECEIVED'
  | 'STATUS_CHANGED';

export type ResourceType =
  | 'project'
  | 'feature'
  | 'spec_revision'
  | 'template'
  | 'repo_attachment'
  | 'user_key'
  | 'webhook';

export interface AuditLogEntry {
  orgId: string;
  userId: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId: string;
  details?: Record<string, unknown>;
  metadata?: {
    timestamp?: Date;
  };
}

export class AuditService {
  /**
   * Log an action to the audit log
   */
  async logAction(entry: AuditLogEntry): Promise<void> {
    try {
      await db.auditLog.create({
        data: {
          orgId: entry.orgId,
          userId: entry.userId,
          action: entry.action,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          details: entry.details ? JSON.stringify(entry.details) : undefined,
          timestamp: entry.metadata?.timestamp || new Date(),
        },
      });
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Failed to write audit log:', error);
    }
  }

  /**
   * Log multiple actions in bulk (for batch operations)
   */
  async logActions(entries: AuditLogEntry[]): Promise<void> {
    try {
      await db.auditLog.createMany({
        data: entries.map((entry) => ({
          orgId: entry.orgId,
          userId: entry.userId,
          action: entry.action,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          details: entry.details ? JSON.stringify(entry.details) : undefined,
          timestamp: entry.metadata?.timestamp || new Date(),
        })),
      });
    } catch (error) {
      console.error('Failed to write audit logs:', error);
    }
  }

  /**
   * Query audit logs for a specific resource
   */
  async getResourceLogs(
    resourceType: ResourceType,
    resourceId: string,
    limit: number = 50
  ) {
    return db.auditLog.findMany({
      where: {
        resourceType,
        resourceId,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Query audit logs for an organization
   */
  async getOrgLogs(
    orgId: string,
    filters?: {
      action?: AuditAction;
      resourceType?: ResourceType;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    limit: number = 100
  ) {
    return db.auditLog.findMany({
      where: {
        orgId,
        ...(filters?.action && { action: filters.action }),
        ...(filters?.resourceType && { resourceType: filters.resourceType }),
        ...(filters?.userId && { userId: filters.userId }),
        ...(filters?.startDate &&
          filters.endDate && {
            timestamp: {
              gte: filters.startDate,
              lte: filters.endDate,
            },
          }),
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get audit log statistics for an organization
   */
  async getOrgStats(orgId: string, daysBack: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const logs = await db.auditLog.findMany({
      where: {
        orgId,
        timestamp: {
          gte: startDate,
        },
      },
      select: {
        action: true,
        resourceType: true,
        timestamp: true,
      },
    });

    // Group by action
    const actionCounts = logs.reduce(
      (acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Group by resource type
    const resourceCounts = logs.reduce(
      (acc, log) => {
        acc[log.resourceType] = (acc[log.resourceType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: logs.length,
      byAction: actionCounts,
      byResourceType: resourceCounts,
      period: {
        start: startDate,
        end: new Date(),
        days: daysBack,
      },
    };
  }
}

export const auditService = new AuditService();
