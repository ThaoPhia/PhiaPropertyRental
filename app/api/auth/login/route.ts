import { NextRequest, NextResponse } from 'next/server';
import { ensureDbReady, getDb } from '@/lib/db';
import { createAuthSession, setSessionCookie } from '@/lib/auth';
import { verifyPassword } from '@/lib/password';
import { verifyRecaptchaToken } from '@/lib/recaptcha-server';
import { AuthUserRecord } from '@/lib/types/types';

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
  const recaptchaTokenRaw = payload?.recaptchaToken;

  if (
    typeof emailRaw !== 'string' ||
    typeof passwordRaw !== 'string' ||
    typeof recaptchaTokenRaw !== 'string'
  ) {
    return NextResponse.json(
      { error: 'Email, password, and reCAPTCHA token are required' },
      { status: 400 }
    );
  }

  const email = emailRaw.trim().toLowerCase();
  const password = passwordRaw;
  const recaptchaToken = recaptchaTokenRaw.trim();

  if (!email || !password || !recaptchaToken) {
    return NextResponse.json(
      { error: 'Email, password, and reCAPTCHA token are required' },
      { status: 400 }
    );
  }

  const remoteIpHeader = request.headers.get('x-forwarded-for');
  const remoteIp = remoteIpHeader ? remoteIpHeader.split(',')[0].trim() : null;
  await ensureDbReady();
  const db = getDb();

  try {
    const recaptchaValid = await verifyRecaptchaToken({
      token: recaptchaToken,
      remoteIp,
      expectedAction: 'login',
    });

    if (!recaptchaValid) {
      return NextResponse.json({ error: 'reCAPTCHA verification failed' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'reCAPTCHA verification failed' },
      { status: 503 }
    );
  }

  const user = db.prepare(
    'SELECT id, email, password_hash, role FROM users WHERE email = ?'
  ).get(email) as AuthUserRecord | undefined;

  if (!user || user.role !== 'admin' || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const { token, expiresAt } = await createAuthSession(user.id);
  const response = NextResponse.json({ success: true, email: user.email });
  setSessionCookie(response, token, expiresAt);
  return response;
}
