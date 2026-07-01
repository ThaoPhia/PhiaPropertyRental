import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

interface StatusPayload {
  applicationId: unknown;
  status: unknown;
}

const ALLOWED_STATUSES = new Set(['pending', 'deleted']);

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as StatusPayload;

    const applicationId = Number.parseInt(String(body.applicationId || '0'), 10);
    const status = String(body.status || '').trim().toLowerCase();

    if (Number.isNaN(applicationId) || !ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: 'Invalid application ID or status' }, { status: 400 });
    }

    const result = db
      .prepare("UPDATE applications SET status = ? WHERE id = ? AND status != 'deleted'")
      .run(status, applicationId);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Error updating application status:', error);
    return NextResponse.json({ error: 'Failed to update application status' }, { status: 500 });
  }
}
