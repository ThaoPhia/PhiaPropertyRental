import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdminFromRequest } from '@/lib/auth';
import { ensureDbReady, getDb, persistDbToCloudStorage } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/password';
import { AuthUserRecord } from '@/lib/types';

export async function PUT(request: NextRequest) {
  const admin = await getAuthenticatedAdminFromRequest(request);

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const payload = typeof body === 'object' && body !== null ? body as Record<string, unknown> : null;
  const name = typeof payload?.name === 'string' ? payload.name.trim() : '';
  const currentPassword = typeof payload?.currentPassword === 'string' ? payload.currentPassword : '';
  const newPassword = typeof payload?.newPassword === 'string' ? payload.newPassword : '';

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  if (newPassword && newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters long' }, { status: 400 });
  }

  if (newPassword && !currentPassword) {
    return NextResponse.json({ error: 'Current password is required to change your password' }, { status: 400 });
  }

  await ensureDbReady();
  const db = getDb();
  const currentUser = db.prepare(`
    SELECT id, name, email, password_hash, role
    FROM users
    WHERE id = ?
  `).get(admin.id) as AuthUserRecord | undefined;

  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (newPassword && !verifyPassword(currentPassword, currentUser.password_hash)) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
  }

  db.prepare(`
    UPDATE users
    SET name = ?, password_hash = ?
    WHERE id = ?
  `).run(
    name,
    newPassword ? hashPassword(newPassword) : currentUser.password_hash,
    admin.id
  );

  await persistDbToCloudStorage();

  return NextResponse.json({
    success: true,
    admin: {
      id: currentUser.id,
      name,
      email: currentUser.email,
      role: currentUser.role,
    },
  });
}
