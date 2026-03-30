/**
 * API Route Middleware & Utilities
 *
 * Provides standardized patterns for:
 * - Session validation
 * - Error handling
 * - Response formatting
 * - Type-safe request handling
 *
 * Usage:
 * ```tsx
 * import { withAuth } from '@/lib/api-middleware';
 *
 * export const GET = withAuth(async (req, { session }) => {
 *   return apiResponse(true, { message: 'Hello ' + session.username });
 * });
 * ```
 */

import { getSession, type SessionPayload } from '@/lib/auth';
import { apiResponse } from '@/lib/utils';

/**
 * Request context populated by middleware
 * Session is guaranteed to be non-null when passed through withAuth middleware
 */
export interface ApiRequestContext {
  session: SessionPayload;
}

/**
 * Handler function type for protected API routes
 */
export type AuthedHandler = (
  request: Request,
  context: ApiRequestContext
) => Promise<Response>;

/**
 * Higher-order function to wrap API route handlers with automatic session validation
 *
 * Ensures:
 * - Session is extracted and validated
 * - 401 response if not authenticated
 * - Standard error handling
 * - Type-safe context passing
 *
 * @param handler - Route handler that receives session in context
 * @returns GET/POST/PATCH/DELETE route handler
 *
 * @example
 * ```tsx
 * export const POST = withAuth(async (req, { session }) => {
 *   const body = await req.json();
 *   // session is guaranteed to exist
 *   return apiResponse(true, { result: 'OK' });
 * });
 * ```
 */
export function withAuth(handler: AuthedHandler) {
  return async (request: Request): Promise<Response> => {
    try {
      // Extract and validate session
      const session = await getSession();

      if (!session) {
        return Response.json(
          apiResponse(false, undefined, {
            code: 'UNAUTHORIZED',
            message: 'Not authenticated. Please log in.',
          }),
          { status: 401 }
        );
      }

      // Pass session in context to handler
      return await handler(request, { session });
    } catch (error) {
      console.error('API route error:', error);
      return Response.json(
        apiResponse(false, undefined, {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        }),
        { status: 500 }
      );
    }
  };
}

/**
 * Pattern for public/unauthenticated API routes
 * Use when session is optional or explicitly not required
 *
 * @example
 * ```tsx
 * export const GET = withoutAuth(async (req) => {
 *   return apiResponse(true, { status: 'OK' });
 * });
 * ```
 */
export function withoutAuth(handler: (request: Request) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    try {
      return await handler(request);
    } catch (error) {
      console.error('API route error:', error);
      return Response.json(
        apiResponse(false, undefined, {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        }),
        { status: 500 }
      );
    }
  };
}

/**
 * Parse and validate JSON request body with error handling
 *
 * @example
 * ```tsx
 * const body = await parseJson(req, 'Error parsing request');
 * ```
 */
export async function parseJson(
  request: Request,
  errorMessage = 'Invalid request body'
): Promise<unknown> {
  try {
    return await request.json();
  } catch (error) {
    throw new Error(errorMessage);
  }
}

/**
 * Validate request body against a Zod schema
 *
 * @example
 * ```tsx
 * const body = await validateBody(req, CreateProjectInput);
 * // body is now typed as CreateProjectInput
 * ```
 */
export async function validateBody<T>(request: Request, schema: { parse: (data: unknown) => T }): Promise<T> {
  const body = await parseJson(request);
  return schema.parse(body);
}
