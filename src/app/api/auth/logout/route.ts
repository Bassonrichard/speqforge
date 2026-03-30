import { logout } from '@/lib/auth';
import { withAuth } from '@/lib/api-middleware';
import { apiResponse } from '@/lib/utils';

/**
 * POST /api/auth/logout
 * Clear user session and redirect to login
 */
export const POST = withAuth(async (req, { session }) => {
  await logout();
  return Response.json(apiResponse(true, { message: 'Logged out successfully' }), { status: 200 });
});
