import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { createAuthSession, setSessionCookie } from '@/lib/auth';
import { verifyPassword } from '@/lib/password';
import { AuthUserRecord } from '@/lib/types';

interface RecaptchaVerificationResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

async function verifyRecaptchaToken(token: string, remoteIp: string | null): Promise<boolean> {
  const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;

  if (!recaptchaSecret) {
    throw new Error('RECAPTCHA_SECRET_KEY is not configured');
  }

  const payload = new URLSearchParams();
  payload.set('secret', recaptchaSecret);
  payload.set('response', token);
  if (remoteIp) {
    payload.set('remoteip', remoteIp);
  }

  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: payload.toString(),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to verify reCAPTCHA');
  }

  const result = (await response.json()) as RecaptchaVerificationResponse;
  
  if (!result.success) {
    return false;
  }

  const scoreThreshold = 0.5;
  if (result.score !== undefined && result.score < scoreThreshold) {
    console.warn(`reCAPTCHA score too low: ${result.score}`);
    return false;
  }

  return true;
}

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

  try {
    const recaptchaValid = await verifyRecaptchaToken(recaptchaToken, remoteIp);

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

  const { token, expiresAt } = createAuthSession(user.id);
  const response = NextResponse.json({ success: true, email: user.email });
  setSessionCookie(response, token, expiresAt);
  return response;
}
