import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import { db } from './db';

/**
 * Authentication utilities for GitHub OAuth and session management
 * Handles JWT creation, verification, and user/org context extraction
 */

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'dev-secret-key-change-in-production'
);

const JWT_ALGORITHM = 'HS256';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Session payload structure
 */
export interface SessionPayload {
  userId: string;
  username: string;
  email: string | null;
  avatarUrl: string | null;
  orgId: string | null;
  orgRole?: 'owner' | 'admin' | 'member';
  iat?: number;
  exp?: number;
}

/**
 * Create a JWT session token
 */
export async function createSessionToken(payload: Omit<SessionPayload, 'iat' | 'exp'>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_DURATION / 1000)
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify and decode a JWT session token
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Get the current session from cookies
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return null;
    }

    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Set session cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000, // Convert ms to seconds
    path: '/',
  });
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

/**
 * Check if user is an organization admin
 */
export async function isOrgAdmin(session: SessionPayload | null): Promise<boolean> {
  if (!session?.orgId) {
    return false;
  }

  return session.orgRole === 'owner' || session.orgRole === 'admin';
}

/**
 * Check if user can approve specs (admin or designated approver)
 */
export async function canApproveSpecs(session: SessionPayload | null): Promise<boolean> {
  if (!session?.orgId) {
    return false;
  }

  // Check if user is admin
  if (await isOrgAdmin(session)) {
    return true;
  }

  // Check if user is a designated approver for their org
  try {
    const org = await db.organization.findUnique({
      where: { id: session.orgId },
      select: { defaultApproverId: true },
    });

    return org?.defaultApproverId === session.userId;
  } catch {
    return false;
  }
}

/**
 * Verify and create/update user from GitHub OAuth
 * Returns session payload with org context
 */
export async function authenticateFromGitHub(githubUser: {
  id: number;
  login: string;
  email: string | null;
  avatar_url: string | null;
}): Promise<SessionPayload> {
  // Create or update user in database
  const user = await db.user.upsert({
    where: { id: String(githubUser.id) },
    create: {
      id: String(githubUser.id),
      username: githubUser.login,
      email: githubUser.email,
      avatarUrl: githubUser.avatar_url,
      githubToken: 'placeholder', // Will be updated with real token from OAuth
    },
    update: {
      username: githubUser.login,
      email: githubUser.email,
      avatarUrl: githubUser.avatar_url,
      updatedAt: new Date(),
    },
  });

  // Get user's organizations
  const memberships = await db.orgMember.findMany({
    where: { userId: user.id },
    include: { organization: true },
    take: 1, // Get first org as default
  });

  const defaultOrg = memberships[0];

  const payload: SessionPayload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    orgId: defaultOrg?.orgId || null,
    orgRole: defaultOrg?.role as 'owner' | 'admin' | 'member' | undefined,
  };

  return payload;
}

/**
 * Switch user's active organization
 */
export async function switchOrganization(
  session: SessionPayload,
  orgId: string
): Promise<SessionPayload> {
  // Verify user is member of that org
  const membership = await db.orgMember.findUnique({
    where: {
      orgId_userId: {
        userId: session.userId,
        orgId: orgId,
      },
    },
  });

  if (!membership) {
    throw new Error('User is not a member of this organization');
  }

  return {
    ...session,
    orgId,
    orgRole: membership.role as 'admin' | 'owner' | 'member',
  };
}

/**
 * Logout - clear session
 */
export async function logout(): Promise<void> {
  await clearSessionCookie();
}
