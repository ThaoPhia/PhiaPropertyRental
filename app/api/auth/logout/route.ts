import { NextRequest, NextResponse } from 'next/server';
import { clearAuthSession, clearSessionCookie, CMS_SESSION_COOKIE } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const token = request.cookies.get(CMS_SESSION_COOKIE)?.value;

  if (token) {
    await clearAuthSession(token);
  }

  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}
