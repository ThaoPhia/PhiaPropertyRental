import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { createAuthSession, setSessionCookie } from '@/lib/auth';
import { verifyPassword } from '@/lib/password';
import { AuthUserRecord } from '@/lib/types';

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const payload = typeof body === 'object' && body !== null ? body as Record<string, unknown> : null;
  const emailRaw = payload?.email;
  const passwordRaw = payload?.password;

  if (typeof emailRaw !== 'string' || typeof passwordRaw !== 'string') {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const email = emailRaw.trim().toLowerCase();
  const password = passwordRaw;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const user = db.prepare(
    'SELECT id, email, password_hash, role FROM users WHERE email = ?'
  ).get(email) as AuthUserRecord | undefined;

  if (!user || user.role !== 'admin' || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const { token, expiresAt } = createAuthSession(user.id);
  const response = NextResponse.json({ success: true, email: user.email });
  setSessionCookie(response, token, expiresAt);
  return response;
}
