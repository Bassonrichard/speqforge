import { db } from '@/lib/db';
import { auditService } from '@/services/audit-service';

export type FeatureStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'HANDED_OFF'
  | 'IN_PROGRESS'
  | 'COMPLETE';

export type ApprovalThreshold = 'SINGLE' | 'UNANIMOUS' | 'MAJORITY';

export interface StatusTransition {
  from: FeatureStatus;
  to: FeatureStatus;
  requiresApproval?: boolean;
  isManual?: boolean;
}

const VALID_TRANSITIONS: StatusTransition[] = [
  // Manual transitions
  { from: 'DRAFT', to: 'IN_REVIEW', isManual: true },
  { from: 'IN_REVIEW', to: 'APPROVED', requiresApproval: true, isManual: true },
  { from: 'IN_REVIEW', to: 'REJECTED', isManual: true },
  { from: 'REJECTED', to: 'DRAFT', isManual: true },
  { from: 'APPROVED', to: 'HANDED_OFF', isManual: true },
  
  // Automatic transitions (via webhooks)
  { from: 'HANDED_OFF', to: 'IN_PROGRESS', isManual: false },
  { from: 'IN_PROGRESS', to: 'COMPLETE', isManual: false },
];

export class ApprovalService {
  /**
   * Validate if a status transition is allowed
   */
  canTransition(
    from: FeatureStatus,
    to: FeatureStatus,
    isManual: boolean = true
  ): boolean {
    return VALID_TRANSITIONS.some(
      (t) =>
        t.from === from &&
        t.to === to &&
        (isManual ? t.isManual !== false : t.isManual === false)
    );
  }

  /**
   * Request review for a spec
   */
  async requestReview(
    specRevId: string,
    reviewerIds: string[],
    requestedBy: string,
    orgId: string
  ): Promise<void> {
    // Get the spec revision and feature
    const specRev = await db.specRevision.findUnique({
      where: { id: specRevId },
      include: {
        feature: true,
      },
    });

    if (!specRev) {
      throw new Error('Spec revision not found');
    }

    // Validate status transition
    if (!this.canTransition(specRev.feature.status as FeatureStatus, 'IN_REVIEW')) {
      throw new Error(
        `Cannot request review from status ${specRev.feature.status}`
      );
    }

    // Update feature status
    await db.feature.update({
      where: { id: specRev.featureId },
      data: { status: 'IN_REVIEW' },
    });

    // Create approval record
    await db.specApproval.create({
      data: {
        specRevId,
        featureId: specRev.featureId,
        requestedBy,
        assignedTo: JSON.stringify(reviewerIds),
        status: 'PENDING',
      },
    });

    // Log the action
    await auditService.logAction({
      orgId,
      userId: requestedBy,
      action: 'SPEC_APPROVED',
      resourceType: 'spec_revision',
      resourceId: specRevId,
      details: {
        reviewers: reviewerIds,
        status: 'IN_REVIEW',
      },
    });
  }

  /**
   * Approve a spec
   */
  async approveSpec(
    specRevId: string,
    approverId: string,
    orgId: string,
    threshold: ApprovalThreshold = 'SINGLE',
    comment?: string
  ): Promise<{ approved: boolean; message: string }> {
    // Get the approval record
    const approval = await db.specApproval.findFirst({
      where: { specRevId },
      include: {
        spec: {
          include: {
            feature: true,
          },
        },
      },
    });

    if (!approval) {
      throw new Error('Approval record not found');
    }

    // Check if user is a valid reviewer
    const reviewers = Array.isArray(approval.assignedTo)
      ? (approval.assignedTo as string[])
      : JSON.parse(approval.assignedTo as string);
    
    if (!reviewers.includes(approverId)) {
      throw new Error('User is not assigned as a reviewer');
    }

    // Check if already approved by this user
    const approvedBy = approval.approvedBy
      ? Array.isArray(approval.approvedBy)
        ? (approval.approvedBy as string[])
        : JSON.parse(approval.approvedBy as string)
      : [];
    
    if (approvedBy.includes(approverId)) {
      return {
        approved: false,
        message: 'You have already approved this spec',
      };
    }

    // Add to approved list
    approvedBy.push(approverId);

    // Check if threshold is met
    const meetsThreshold = this.checkApprovalThreshold(
      approvedBy.length,
      reviewers.length,
      threshold
    );

    // Update approval record
    await db.specApproval.update({
      where: { id: approval.id },
      data: {
        approvedBy: JSON.stringify(approvedBy),
        status: meetsThreshold ? 'APPROVED' : 'PENDING',
        comments: comment || approval.comments,
      },
    });

    // If threshold is met, update feature status
    if (meetsThreshold) {
      await db.feature.update({
        where: { id: approval.spec.featureId },
        data: { status: 'APPROVED' },
      });

      // Log the approval
      await auditService.logAction({
        orgId,
        userId: approverId,
        action: 'SPEC_APPROVED',
        resourceType: 'spec_revision',
        resourceId: specRevId,
        details: {
          threshold,
          approvedBy,
          approverCount: approvedBy.length,
          requiredCount: reviewers.length,
        },
      });
    }

    return {
      approved: meetsThreshold,
      message: meetsThreshold
        ? 'Spec approved successfully'
        : `Approval recorded (${approvedBy.length}/${reviewers.length})`,
    };
  }

  /**
   * Reject a spec
   */
  async rejectSpec(
    specRevId: string,
    reviewerId: string,
    reason: string,
    orgId: string
  ): Promise<void> {
    const approval = await db.specApproval.findFirst({
      where: { specRevId },
      include: {
        spec: {
          include: {
            feature: true,
          },
        },
      },
    });

    if (!approval) {
      throw new Error('Approval record not found');
    }

    // Update approval record
    await db.specApproval.update({
      where: { id: approval.id },
      data: {
        status: 'REJECTED',
        rejectedBy: reviewerId,
        comments: reason,
      },
    });

    // Update feature status
    await db.feature.update({
      where: { id: approval.spec.featureId },
      data: { status: 'REJECTED' },
    });

    // Log the rejection
    await auditService.logAction({
      orgId,
      userId: reviewerId,
      action: 'SPEC_REJECTED',
      resourceType: 'spec_revision',
      resourceId: specRevId,
      details: {
        reason,
        rejectedBy: reviewerId,
      },
    });
  }

  /**
   * Move spec to handoff (after approval)
   */
  async moveToHandoff(
    featureId: string,
    userId: string,
    orgId: string
  ): Promise<void> {
    const feature = await db.feature.findUnique({
      where: { id: featureId },
    });

    if (!feature) {
      throw new Error('Feature not found');
    }

    // Validate transition
    if (!this.canTransition(feature.status as FeatureStatus, 'HANDED_OFF')) {
      throw new Error(
        `Cannot hand off from status ${feature.status}. Must be APPROVED.`
      );
    }

    // Update feature status
    await db.feature.update({
      where: { id: featureId },
      data: { status: 'HANDED_OFF' },
    });

    // Log the handoff
    await auditService.logAction({
      orgId,
      userId,
      action: 'SPEC_HANDED_OFF',
      resourceType: 'feature',
      resourceId: featureId,
      details: {
        oldStatus: feature.status,
        newStatus: 'HANDED_OFF',
      },
    });
  }

  /**
   * Check if approval threshold is met
   */
  private checkApprovalThreshold(
    approvedCount: number,
    totalReviewers: number,
    threshold: ApprovalThreshold
  ): boolean {
    switch (threshold) {
      case 'SINGLE':
        return approvedCount >= 1;
      case 'UNANIMOUS':
        return approvedCount === totalReviewers;
      case 'MAJORITY':
        return approvedCount > totalReviewers / 2;
      default:
        return false;
    }
  }

  /**
   * Get approval status for a spec
   */
  async getApprovalStatus(specRevId: string) {
    return db.specApproval.findFirst({
      where: { specRevId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all approvals for a feature
   */
  async getFeatureApprovals(featureId: string) {
    return db.specApproval.findMany({
      where: {
        featureId,
      },
      include: {
        spec: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const approvalService = new ApprovalService();
