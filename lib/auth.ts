// Cookie-based session, now backed by the JSON users store so the CEO can
// add/remove people via the admin panel without touching code or env vars.

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import type { SessionUser } from './types';
import { findByUsername } from './users-store';

const COOKIE_NAME = 'nahj_session';
// In production, NAHJ_SESSION_SECRET must be set (render.yaml generates one).
// If it's somehow missing we still boot — but loudly warn, since the fallback
// secret is public in the source and would make session tokens forgeable.
if (process.env.NODE_ENV === 'production' && !process.env.NAHJ_SESSION_SECRET) {
  console.error('[auth] SECURITY: NAHJ_SESSION_SECRET is not set in production — using an insecure default. Set it in the host environment.');
}
const SECRET = new TextEncoder().encode(
  process.env.NAHJ_SESSION_SECRET || 'nahj-dev-secret-change-me-please-32bytes!'
);

// Demo accounts that always accept the universal demo password, regardless of
// what's stored on disk. This keeps the four seed logins working on a deployed
// instance whose users.json was created with different (env-var) passwords.
// Set NAHJ_DISABLE_DEMO_LOGIN=1 to turn this off for a real production rollout.
const DEMO_ACCOUNTS = ['executive', 'badir', 'risala', 'iktashif'];
const DEMO_PASSWORD = process.env.NAHJ_DEMO_PASSWORD || '1';

export async function authenticate(username: string, password: string): Promise<SessionUser | null> {
  const u = findByUsername(username);
  if (!u || !u.active) return null;

  const passwordOk =
    u.password === password ||
    (process.env.NAHJ_DISABLE_DEMO_LOGIN !== '1' &&
      DEMO_ACCOUNTS.includes(u.username.toLowerCase()) &&
      password === DEMO_PASSWORD);

  if (!passwordOk) return null;
  return {
    username: u.username,
    role: u.role,
    displayName: u.name,
    permissions: u.permissions,
    scope: u.scope,
  };
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET);
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession(): Promise<void> {
  cookies().delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    const username = payload.username as string | undefined;
    if (!username) return null;
    // Always reflect the live users-store record — if the CEO deactivated
    // someone or changed their permissions, the change takes effect on the
    // next request without forcing a re-login.
    const live = findByUsername(username);
    if (!live || !live.active) return null;
    return {
      username: live.username,
      role: live.role,
      displayName: live.name,
      permissions: live.permissions,
      scope: live.scope,
    };
  } catch {
    return null;
  }
}
