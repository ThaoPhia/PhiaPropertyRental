import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

interface ApplicationPayload {
  propertyId: unknown;
  applicantName: unknown;
  email: unknown;
  phone: unknown;
  householdIncome: unknown;
  moveInDate: unknown;
}

export async function POST(request: NextRequest) {
  let body: ApplicationPayload;

  try {
    body = await request.json() as ApplicationPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const propertyId = Number.parseInt(String(body.propertyId), 10);
  const applicantName = String(body.applicantName || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const phone = String(body.phone || '').trim();
  const householdIncome = Number.parseFloat(String(body.householdIncome || '0'));
  const moveInDate = String(body.moveInDate || '').trim();

  if (
    Number.isNaN(propertyId) ||
    !applicantName ||
    !email ||
    !phone ||
    Number.isNaN(householdIncome) ||
    householdIncome < 0 ||
    !moveInDate
  ) {
    return NextResponse.json(
      { error: 'All application fields are required' },
      { status: 400 }
    );
  }

  const property = db.prepare('SELECT id, name FROM properties WHERE id = ?').get(propertyId) as
    | { id: number; name: string }
    | undefined;

  if (!property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }

  const result = db.prepare(`
    INSERT INTO applications (
      property_id, property_name, applicant_name, email, phone, household_income, move_in_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    propertyId,
    property.name,
    applicantName,
    email,
    phone,
    householdIncome,
    moveInDate
  );

  return NextResponse.json(
    { success: true, applicationId: result.lastInsertRowid },
    { status: 201 }
  );
}
