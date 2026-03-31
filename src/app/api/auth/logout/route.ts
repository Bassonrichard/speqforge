import { logout } from '@/lib/auth';
import { withAuth } from '@/lib/api-middleware';
import { apiResponse } from '@/lib/utils';
import { NextResponse } from 'next/server';

/**
 * GET /api/auth/logout
 * Clear user session and redirect to login (browser navigation)
 */
export async function GET() {
  await logout();
  return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL || 'http://localhost:3000'));
}

/**
 * POST /api/auth/logout
 * Clear user session and return JSON response (API calls)
 */
export const POST = withAuth(async (req, { session }) => {
  await logout();
  return Response.json(apiResponse(true, { message: 'Logged out successfully' }), { status: 200 });
});
