import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { AuthenticatedAdmin } from '@/lib/types';

export const CMS_SESSION_COOKIE = 'cms_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export function createAuthSession(userId: number): { token: string; expiresAt: Date } {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  db.prepare(`DELETE FROM auth_sessions WHERE datetime(expiresAt) <= datetime('now')`).run();
  db.prepare(`INSERT INTO auth_sessions (token, user_id, expiresAt) VALUES (?, ?, ?)`)
    .run(token, userId, expiresAt.toISOString());

  return { token, expiresAt };
}

export function clearAuthSession(token: string): void {
  db.prepare('DELETE FROM auth_sessions WHERE token = ?').run(token);
}

function getAuthenticatedAdminByToken(token: string): AuthenticatedAdmin | null {
  const user = db.prepare(`
    SELECT u.id, u.email, u.role
    FROM auth_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ?
      AND datetime(s.expiresAt) > datetime('now')
  `).get(token) as AuthenticatedAdmin | undefined;

  if (!user || user.role !== 'admin') {
    return null;
  }

  return user;
}

export async function getAuthenticatedAdminFromCookies(): Promise<AuthenticatedAdmin | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CMS_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return getAuthenticatedAdminByToken(token);
}

export async function getAuthenticatedAdminFromRequest(
  request: NextRequest
): Promise<AuthenticatedAdmin | null> {
  const token = request.cookies.get(CMS_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return getAuthenticatedAdminByToken(token);
}

export function setSessionCookie(
  response: NextResponse,
  token: string,
  expiresAt: Date
): void {
  response.cookies.set({
    name: CMS_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: CMS_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
