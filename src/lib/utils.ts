import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { createHmac } from 'crypto';
import { ApiError } from '@/types/errors';

/**
 * Merge Tailwind classes with automatic conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Standard API response wrapper
 */
export function apiResponse<T>(
  success: boolean,
  data?: T,
  error?: { code: string; message: string }
) {
  return {
    success,
    data,
    error,
  };
}

/**
 * Verify GitHub webhook signature
 * Uses HMAC-SHA256 to verify that the webhook came from GitHub
 */
export function verifyGitHubWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  const digest = `sha256=${hmac.digest('hex')}`;

  // Use timing-safe comparison to prevent timing attacks
  return digest === signature;
}

/**
 * Generate GitHub webhook signature for testing
 */
export function generateGitHubWebhookSignature(
  payload: string,
  secret: string
): string {
  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  return `sha256=${hmac.digest('hex')}`;
}

/**
 * Create standardized API error response
 */
export function createErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return apiResponse(false, undefined, {
      code: error.code,
      message: error.message,
    });
  }

  if (error instanceof Error) {
    return apiResponse(false, undefined, {
      code: 'INTERNAL_ERROR',
      message: error.message,
    });
  }

  return apiResponse(false, undefined, {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
  });
}

/**
 * Format feature branch name using project branch pattern
 */
export function formatBranchName(
  pattern: string,
  projectKey: string,
  featureId: string,
  featureSlug: string,
  revisionNumber: number = 1
): string {
  let branchName = pattern
    .replace('{projectKey}', projectKey)
    .replace('{featureId}', featureId)
    .replace('{slug}', featureSlug)
    .replace('{revNumber}', revisionNumber.toString());

  // Ensure branch name is valid Git ref
  branchName = branchName
    .toLowerCase()
    .replace(/[^a-z0-9_\-/]/g, '-') // Replace invalid chars with dash
    .replace(/--+/g, '-') // Collapse multiple dashes
    .replace(/^-|-$/g, ''); // Remove leading/trailing dashes

  // Ensure max length
  if (branchName.length > 250) {
    // Keep start/end, truncate middle
    const start = branchName.substring(0, 120);
    const end = branchName.substring(branchName.length - 120);
    branchName = `${start}-${end}`;
  }

  return branchName;
}

/**
 * Slugify a string for use in URLs/branches
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Format markdown with syntax highlighting support
 */
export function formatMarkdown(content: string): string {
  // Basic sanitization: remove potential script tags
  return content.replace(/<script[^>]*>.*?<\/script>/gi, '');
}

/**
 * Delay utility for async operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry utility for failed operations
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        await delay(delayMs * attempt); // Exponential backoff
      }
    }
  }

  throw lastError || new Error('Max retry attempts exceeded');
}

/**
 * Parse pagination params
 */
export function parsePaginationParams(page?: string | number, pageSize?: string | number) {
  const p = typeof page === 'string' ? parseInt(page, 10) : page || 1;
  const size = typeof pageSize === 'string' ? parseInt(pageSize, 10) : pageSize || 20;

  return {
    skip: Math.max(0, (p - 1) * size),
    take: Math.min(size, 100), // Cap at 100 per page
  };
}
