// Cookie-based session, now backed by the JSON users store so the CEO can
// add/remove people via the admin panel without touching code or env vars.

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import type { SessionUser } from './types';
import { findByUsername } from './users-store';

const COOKIE_NAME = 'nahj_session';
const SECRET = new TextEncoder().encode(
  process.env.NAHJ_SESSION_SECRET || 'nahj-dev-secret-change-me-please-32bytes!'
);

export async function authenticate(username: string, password: string): Promise<SessionUser | null> {
  const u = findByUsername(username);
  if (!u || !u.active) return null;
  if (u.password !== password) return null;
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
