import { switchOrganization, createSessionToken, setSessionCookie } from '@/lib/auth';
import { withAuth, validateBody } from '@/lib/api-middleware';
import { apiResponse } from '@/lib/utils';
import { z } from 'zod';

const SwitchOrgInput = z.object({
  orgId: z.string().cuid('Invalid organization ID'),
});

/**
 * POST /api/auth/switch-org
 * Switch to a different organization
 */
export const POST = withAuth(async (request, { session }) => {
  const { orgId } = await validateBody(request, SwitchOrgInput);

  // Switch organization
  const newSession = await switchOrganization(session, orgId);

  // Create new token with updated org context
  const newToken = await createSessionToken(newSession);
  await setSessionCookie(newToken);

  return Response.json(
    apiResponse(true, newSession),
    { status: 200 }
  );
});
