import { withAuth } from '@/lib/api-middleware';
import { apiResponse } from '@/lib/utils';

/**
 * GET /api/auth/user
 * Get current authenticated user and org context
 */
export const GET = withAuth(async (req, { session }) => {
  return Response.json(apiResponse(true, session), { status: 200 });
});
