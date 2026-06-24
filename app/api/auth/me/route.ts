import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdminFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const admin = await getAuthenticatedAdminFromRequest(request);

  return NextResponse.json({
    isAdmin: Boolean(admin),
    admin,
  });
}
