import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { ensureDbReady, getDb } from '@/lib/db';
import { AuthenticatedAdmin } from '@/lib/types';

export const CMS_SESSION_COOKIE = 'cms_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const SESSION_TOKEN_VERSION = 'v1';

type SessionPayload = {
  sub: number;
  exp: number;
};

function getSessionSecret(): string {
  const configuredSecret = process.env.CMS_SESSION_SECRET?.trim();
  if (configuredSecret) {
    return configuredSecret;
  }

  const adminPassword = process.env.CMS_ADMIN_PASSWORD?.trim();
  if (adminPassword) {
    return `cms-session:${adminPassword}`;
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'dev-insecure-cms-session-secret';
  }

  throw new Error('CMS_SESSION_SECRET or CMS_ADMIN_PASSWORD must be configured in production.');
}

function signSessionPayload(payload: string): string {
  return crypto
    .createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('base64url');
}

function encodeSessionToken(userId: number, expiresAt: Date): string {
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      exp: expiresAt.getTime(),
      nonce: crypto.randomBytes(16).toString('base64url'),
    }),
    'utf8'
  ).toString('base64url');

  return `${SESSION_TOKEN_VERSION}.${payload}.${signSessionPayload(payload)}`;
}

function decodeSessionToken(token: string): { userId: number; expiresAt: Date } | null {
  const [version, payload, signature] = token.split('.');
  if (version !== SESSION_TOKEN_VERSION || !payload || !signature) {
    return null;
  }

  const expectedSignature = signSessionPayload(payload);
  const signatureBuffer = Buffer.from(signature, 'utf8');
  const expectedSignatureBuffer = Buffer.from(expectedSignature, 'utf8');

  if (
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    return null;
  }

  let parsedPayload: unknown;
  try {
    parsedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (typeof parsedPayload !== 'object' || parsedPayload === null) {
    return null;
  }

  const candidate = parsedPayload as Partial<SessionPayload>;
  if (
    typeof candidate.sub !== 'number' ||
    !Number.isInteger(candidate.sub) ||
    typeof candidate.exp !== 'number'
  ) {
    return null;
  }

  const expiresAt = new Date(candidate.exp);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    return null;
  }

  return {
    userId: candidate.sub,
    expiresAt,
  };
}

export async function createAuthSession(userId: number): Promise<{ token: string; expiresAt: Date }> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const token = encodeSessionToken(userId, expiresAt);

  return { token, expiresAt };
}

export async function clearAuthSession(token?: string): Promise<void> {
  void token;
  return;
}

async function getAuthenticatedAdminByUserId(userId: number): Promise<AuthenticatedAdmin | null> {
  await ensureDbReady();
  const db = getDb();
  const user = db.prepare(`
    SELECT id, name, email, role
    FROM users
    WHERE id = ?
  `).get(userId) as AuthenticatedAdmin | undefined;

  if (!user || user.role !== 'admin') {
    return null;
  }

  return user;
}

async function getLegacyAuthenticatedAdminByToken(token: string): Promise<AuthenticatedAdmin | null> {
  await ensureDbReady();
  const db = getDb();
  const user = db.prepare(`
    SELECT u.id, u.name, u.email, u.role
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

async function getAuthenticatedAdminByToken(token: string): Promise<AuthenticatedAdmin | null> {
  const session = decodeSessionToken(token);
  if (session) {
    return await getAuthenticatedAdminByUserId(session.userId);
  }

  return await getLegacyAuthenticatedAdminByToken(token);
}

export async function getAuthenticatedAdminFromCookies(): Promise<AuthenticatedAdmin | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CMS_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return await getAuthenticatedAdminByToken(token);
}

export async function getAuthenticatedAdminFromRequest(
  request: NextRequest
): Promise<AuthenticatedAdmin | null> {
  const token = request.cookies.get(CMS_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return await getAuthenticatedAdminByToken(token);
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
