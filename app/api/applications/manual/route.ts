import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdminFromRequest } from '@/lib/auth';
import { ensureDbReady, getDb, persistDbToCloudStorage } from '@/lib/db';

function parseString(value: unknown): string {
  return String(value ?? '').trim();
}

export async function POST(request: NextRequest) {
  await ensureDbReady();
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
  const propertyId = Number.parseInt(String(payload?.propertyId ?? '0'), 10);
  const applicantName = parseString(payload?.applicantName);
  const email = parseString(payload?.email).toLowerCase();
  const phone = parseString(payload?.phone);
  const householdIncome = Number.parseFloat(String(payload?.householdIncome ?? '0'));
  const moveInDate = parseString(payload?.moveInDate);
  const totalOccupancy = Number.parseInt(String(payload?.totalOccupancy ?? '0'), 10);
  const additionalInfo = parseString(payload?.additionalInfo);

  if (
    Number.isNaN(propertyId) ||
    !applicantName ||
    !email ||
    !phone ||
    Number.isNaN(householdIncome) ||
    householdIncome < 0 ||
    !moveInDate ||
    Number.isNaN(totalOccupancy) ||
    totalOccupancy < 1
  ) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const db = getDb();
  const property = db.prepare(`
    SELECT id, name, status
    FROM properties
    WHERE id = ?
  `).get(propertyId) as { id: number; name: string; status: string } | undefined;

  if (!property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }

  if (property.status !== 'available') {
    return NextResponse.json({ error: 'Property is not available' }, { status: 400 });
  }

  const insertApplication = db.prepare(`
    INSERT INTO applications (
      property_id, property_name, applicant_name, email, phone,
      household_income, move_in_date, total_occupancy, additional_info, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const markOtherApplications = db.prepare(`
    UPDATE applications
    SET status = 'declined'
    WHERE property_id = ? AND status NOT IN ('deleted', 'declined', 'approved', 'approve-archived')
  `);

  const archivePriorApproved = db.prepare(`
    UPDATE applications
    SET status = 'approve-archived'
    WHERE property_id = ? AND status = 'approved'
  `);

  const markPropertyOccupied = db.prepare(`
    UPDATE properties
    SET status = 'occupied'
    WHERE id = ?
  `);

  const createManualApplication = db.transaction(() => {
    markOtherApplications.run(propertyId);
    archivePriorApproved.run(propertyId);

    const result = insertApplication.run(
      propertyId,
      property.name,
      applicantName,
      email,
      phone,
      householdIncome,
      moveInDate,
      totalOccupancy,
      additionalInfo,
      'approved'
    );

    markPropertyOccupied.run(propertyId);
    return result;
  });

  const result = createManualApplication();
  await persistDbToCloudStorage();

  return NextResponse.json({
    success: true,
    applicationId: result.lastInsertRowid,
    propertyId,
  }, { status: 201 });
}
