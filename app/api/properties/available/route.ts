import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdminFromRequest } from '@/lib/auth';
import { ensureDbReady, getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  await ensureDbReady();
  const admin = await getAuthenticatedAdminFromRequest(request);

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const properties = db.prepare(`
    SELECT id, name, city, state, status
    FROM properties
    WHERE status = 'available'
    ORDER BY datetime(created_at) DESC
  `).all();

  return NextResponse.json(properties);
}
