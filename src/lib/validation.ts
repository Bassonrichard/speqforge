import { z } from 'zod';

/**
 * Common validation schemas for SeqForge Portal API requests
 */

// ============================================================================
// AUTH & ORG
// ============================================================================

export const CreateOrganizationInput = z.object({
  name: z.string().min(1, 'Organization name is required').max(255),
  description: z.string().max(1000).optional(),
});

export type CreateOrganizationInputType = z.infer<typeof CreateOrganizationInput>;

// ============================================================================
// PROJECT
// ============================================================================

export const CreateProjectInput = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
  description: z.string().max(1000).optional(),
  projectKey: z
    .string()
    .min(2, 'Project key must be at least 2 characters')
    .max(10, 'Project key must be at most 10 characters')
    .regex(/^[A-Z0-9_-]+$/, 'Project key must contain only uppercase letters, numbers, dashes, and underscores'),
  branchPattern: z
    .string()
    .default('spec/{projectKey}/{featureId}-{slug}')
    .refine((val) => val.includes('{projectKey}') && val.includes('{featureId}'), {
      message: 'Branch pattern must include {projectKey} and {featureId} placeholders',
    }),
});

export type CreateProjectInputType = z.infer<typeof CreateProjectInput>;

export const UpdateProjectInput = CreateProjectInput.partial();

export const AttachRepositoryInput = z.object({
  fullName: z.string().regex(/^[\w-]+\/[\w-]+$/, 'Repository must be in format owner/repo'),
  defaultBranch: z.string().default('main'),
});

export type AttachRepositoryInputType = z.infer<typeof AttachRepositoryInput>;

// ============================================================================
// FEATURE & SPEC
// ============================================================================

export const CreateFeatureInput = z.object({
  title: z.string().min(1, 'Feature title is required').max(255),
  description: z.string().min(10, 'Feature description must be at least 10 characters').max(5000),
  projectId: z.string().cuid('Invalid project ID'),
  templateId: z.string().cuid('Invalid template ID').optional(),
});

export type CreateFeatureInputType = z.infer<typeof CreateFeatureInput>;

export const UpdateFeatureInput = CreateFeatureInput.partial();

export const GenerateSpecInput = z.object({
  featureId: z.string().cuid('Invalid feature ID'),
  templateId: z.string().cuid('Invalid template ID').optional(),
  regenerate: z.boolean().default(false),
});

export type GenerateSpecInputType = z.infer<typeof GenerateSpecInput>;

export const ClarifyingAnswerInput = z.object({
  specRevisionId: z.string().cuid('Invalid spec revision ID'),
  answers: z.record(z.string(), z.string()).or(z.array(z.object({
    questionNumber: z.number().int().min(1).max(3),
    answer: z.string().min(1, 'Answer is required'),
  }))),
});

export type ClarifyingAnswerInputType = z.infer<typeof ClarifyingAnswerInput>;

// ============================================================================
// APPROVAL
// ============================================================================

export const RequestReviewInput = z.object({
  featureId: z.string().cuid(),
  specRevisionId: z.string().cuid(),
  reviewerIds: z.array(z.string()).min(1, 'At least one reviewer is required'),
});

export type RequestReviewInputType = z.infer<typeof RequestReviewInput>;

export const ApproveSpecInput = z.object({
  specRevisionId: z.string().cuid(),
  comment: z.string().max(1000).optional(),
});

export type ApproveSpecInputType = z.infer<typeof ApproveSpecInput>;

export const RejectSpecInput = z.object({
  specRevisionId: z.string().cuid(),
  reason: z.string().min(1, 'Rejection reason is required').max(1000),
});

export type RejectSpecInputType = z.infer<typeof RejectSpecInput>;

// ============================================================================
// GITHUB SYNC
// ============================================================================

export const HandoffInput = z.object({
  featureId: z.string().cuid(),
  specRevisionId: z.string().cuid(),
  createPullRequests: z.boolean().default(true),
});

export type HandoffInputType = z.infer<typeof HandoffInput>;

// ============================================================================
// SETTINGS
// ============================================================================

export const LLMProviderKeyInput = z.object({
  provider: z.enum(['openai', 'anthropic', 'google_ai']),
  apiKey: z.string().min(1, 'API key is required'),
  makeDefault: z.boolean().default(false),
  testKey: z.boolean().default(true), // Test the key before saving
});

export type LLMProviderKeyInputType = z.infer<typeof LLMProviderKeyInput>;

export const UpdateApprovalThresholdInput = z.object({
  threshold: z.enum(['SINGLE', 'UNANIMOUS', 'MAJORITY']),
});

export type UpdateApprovalThresholdInputType = z.infer<typeof UpdateApprovalThresholdInput>;

export const UploadTemplateInput = z.object({
  name: z.string().min(1, 'Template name is required').max(255),
  content: z.string().min(100, 'Template must be at least 100 characters'),
  makeDefault: z.boolean().default(false),
  validate: z.boolean().default(true),
});

export type UploadTemplateInputType = z.infer<typeof UploadTemplateInput>;

// ============================================================================
// RBAC
// ============================================================================

export const AssignRoleInput = z.object({
  userId: z.string(),
  role: z.enum(['ADMIN', 'APPROVER', 'MEMBER', 'REVIEWER']),
});

export type AssignRoleInputType = z.infer<typeof AssignRoleInput>;

// ============================================================================
// PAGINATION & FILTERING
// ============================================================================

export const PaginationParams = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationParamsType = z.infer<typeof PaginationParams>;

export const FeatureFilterParams = z.object({
  projectId: z.string().cuid().optional(),
  status: z
    .enum(['DRAFT', 'APPROVED', 'HANDED_OFF', 'IN_PROGRESS', 'IN_MERGE', 'COMPLETE'])
    .optional(),
  search: z.string().optional(),
  ...PaginationParams.shape,
});

export type FeatureFilterParamsType = z.infer<typeof FeatureFilterParams>;
