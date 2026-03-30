import { SessionPayload, isOrgAdmin, canApproveSpecs } from './auth';

/**
 * Role-Based Access Control utilities
 * Provides fine-grained permission checking for different user actions
 */

/**
 * Check if user is organization admin
 */
export async function checkIsOrgAdmin(session: SessionPayload | null): Promise<boolean> {
  return isOrgAdmin(session);
}

/**
 * Check if user can approve specifications
 */
export async function checkCanApproveSpecs(session: SessionPayload | null): Promise<boolean> {
  return canApproveSpecs(session);
}

/**
 * Check if user can create features in current org
 */
export async function checkCanCreateFeature(session: SessionPayload | null): Promise<boolean> {
  if (!session?.orgId) {
    return false;
  }
  // All org members can create features
  return true;
}

/**
 * Check if user can create projects in current org
 */
export async function checkCanCreateProject(session: SessionPayload | null): Promise<boolean> {
  if (!session?.orgId) {
    return false;
  }
  // Only admins can create projects
  return isOrgAdmin(session);
}

/**
 * Check if user can manage organization settings
 */
export async function checkCanManageOrgSettings(session: SessionPayload | null): Promise<boolean> {
  if (!session?.orgId) {
    return false;
  }
  // Only admins can manage org settings
  return isOrgAdmin(session);
}

/**
 * Check if user can manage users in organization
 */
export async function checkCanManageUsers(session: SessionPayload | null): Promise<boolean> {
  if (!session?.orgId) {
    return false;
  }
  // Only admins can manage users
  return isOrgAdmin(session);
}

/**
 * Check if user can configure LLM provider keys
 */
export async function checkCanConfigureLLM(session: SessionPayload | null): Promise<boolean> {
  if (!session?.orgId) {
    return false;
  }
  // Only admins can configure LLM
  return isOrgAdmin(session);
}

/**
 * Check if user can modify approval thresholds
 */
export async function checkCanModifyApprovalThreshold(session: SessionPayload | null): Promise<boolean> {
  if (!session?.orgId) {
    return false;
  }
  // Only admins can modify approval settings
  return isOrgAdmin(session);
}

/**
 * Check if user can upload spec templates
 */
export async function checkCanUploadTemplate(session: SessionPayload | null): Promise<boolean> {
  if (!session?.orgId) {
    return false;
  }
  // Only admins can upload templates
  return isOrgAdmin(session);
}

/**
 * Check if user can request a review on a spec
 */
export async function checkCanRequestReview(session: SessionPayload | null): Promise<boolean> {
  if (!session?.orgId) {
    return false;
  }
  // All org members can request reviews
  return true;
}

/**
 * Check if user can reject a spec
 */
export async function checkCanRejectSpec(session: SessionPayload | null): Promise<boolean> {
  if (!session?.orgId) {
    return false;
  }
  // Only designated approvers can reject
  return canApproveSpecs(session);
}

/**
 * Check if user can handoff a spec to GitHub
 */
export async function checkCanHandoffSpec(session: SessionPayload | null): Promise<boolean> {
  if (!session?.orgId) {
    return false;
  }
  // Spec author and admins can handoff
  // (authorization checks are done at API level with resourceId)
  return true;
}

/**
 * Helper: Ensure user is authenticated
 */
export function ensureAuthenticated(session: SessionPayload | null): session is SessionPayload {
  return session !== null && session.userId !== undefined;
}

/**
 * Helper: Ensure user has current org
 */
export function ensureHasOrg(session: SessionPayload | null): session is SessionPayload & { orgId: string } {
  return session !== null && session.orgId !== undefined && session.orgId !== null;
}

/**
 * Helper: Multiple permission check (AND logic)
 */
export async function checkAllPermissions(
  session: SessionPayload | null,
  checks: Array<() => Promise<boolean>>
): Promise<boolean> {
  for (const check of checks) {
    if (!(await check())) {
      return false;
    }
  }
  return true;
}

/**
 * Helper: Multiple permission check (OR logic)
 */
export async function checkAnyPermission(
  session: SessionPayload | null,
  checks: Array<() => Promise<boolean>>
): Promise<boolean> {
  for (const check of checks) {
    if (await check()) {
      return true;
    }
  }
  return false;
}
