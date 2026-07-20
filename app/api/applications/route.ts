import { NextRequest, NextResponse } from 'next/server';
import { ensureDbReady, getDb, persistDbToCloudStorage } from '@/lib/db';
import type { ApplicationPayload } from './types';
import { verifyRecaptchaToken } from '@/lib/recaptcha-server';

export async function GET() {
  try {
    await ensureDbReady();
    const db = getDb();
    const rows = db.prepare(`
      SELECT 
        id, 
        applicant_name,
        email,
        phone,
        current_address_street,
        current_address_city,
        current_address_state,
        current_address_zip,
        current_address_since_date,
        household_income,
        move_in_date,
        total_occupancy,
        landlord_name,
        landlord_phone,
        additional_info,
        property_id,
        property_name,
        status,
        created_at
      FROM applications
      ORDER BY 
        CASE status
          WHEN 'pending' THEN 0
          WHEN 'approved' THEN 1
          WHEN 'approve-archived' THEN 2
          WHEN 'declined' THEN 3
          WHEN 'deleted' THEN 4
        END,
        datetime(created_at) DESC
    `).all();

    const applications = (rows as Record<string, unknown>[]).map((row) => ({
      id: Number(row.id),
      applicantName: String(row.applicant_name ?? ''),
      email: String(row.email ?? ''),
      phone: String(row.phone ?? ''),
      currentAddressStreet: String(row.current_address_street ?? ''),
      currentAddressCity: String(row.current_address_city ?? ''),
      currentAddressState: String(row.current_address_state ?? ''),
      currentAddressZip: String(row.current_address_zip ?? ''),
      currentAddressSinceDate: String(row.current_address_since_date ?? ''),
      householdIncome: Number(row.household_income ?? 0),
      moveInDate: String(row.move_in_date ?? ''),
      totalOccupancy: Number(row.total_occupancy ?? 0),
      landlordName: String(row.landlord_name ?? ''),
      landlordPhone: String(row.landlord_phone ?? ''),
      additionalInfo: row.additional_info ? String(row.additional_info) : '',
      propertyId: Number(row.property_id),
      propertyName: String(row.property_name ?? ''),
      status: row.status ? String(row.status) : '',
      createdAt: String(row.created_at ?? ''),
    }));

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Failed to fetch applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  await ensureDbReady();
  const db = getDb();
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
  const currentAddressStreet = String(body.currentAddressStreet || '').trim();
  const currentAddressCity = String(body.currentAddressCity || '').trim();
  const currentAddressState = String(body.currentAddressState || '').trim().toUpperCase();
  const currentAddressZip = String(body.currentAddressZip || '').trim();
  const currentAddressSinceDate = String(body.currentAddressSinceDate || '').trim();
  const householdIncome = Number.parseFloat(String(body.householdIncome || '0'));
  const moveInDate = String(body.moveInDate || '').trim();
  const totalOccupancy = Number.parseInt(String(body.totalOccupancy || '0'), 10);
  const landlordName = String(body.landlordName || '').trim();
  const landlordPhone = String(body.landlordPhone || '').trim();
  const additionalInfo = String(body.additionalInfo || '').trim();
  const recaptchaToken = String(body.recaptchaToken || '').trim();

  if (
    Number.isNaN(propertyId) ||
    !applicantName ||
    !email ||
    !phone ||
    !currentAddressStreet ||
    !currentAddressCity ||
    !currentAddressState ||
    !currentAddressZip ||
    !currentAddressSinceDate ||
    Number.isNaN(householdIncome) ||
    householdIncome < 0 ||
    !moveInDate ||
    Number.isNaN(totalOccupancy) ||
    totalOccupancy < 1 ||
    !landlordName ||
    !landlordPhone ||
    !recaptchaToken
  ) {
    return NextResponse.json(
      { error: 'All application fields are required' },
      { status: 400 }
    );
  }

  const remoteIpHeader = request.headers.get('x-forwarded-for');
  const remoteIp = remoteIpHeader ? remoteIpHeader.split(',')[0].trim() : null;

  try {
    const recaptchaValid = await verifyRecaptchaToken({
      token: recaptchaToken,
      remoteIp,
      expectedAction: 'application',
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

  const property = db.prepare('SELECT id, name FROM properties WHERE id = ?').get(propertyId) as
    | { id: number; name: string }
    | undefined;

  if (!property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }

  const result = db.prepare(`
    INSERT INTO applications (
      property_id, property_name, applicant_name, email, phone, current_address_street, current_address_city, current_address_state, current_address_zip, current_address_since_date, household_income, move_in_date, total_occupancy, landlord_name, landlord_phone, additional_info
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    propertyId,
    property.name,
    applicantName,
    email,
    phone,
    currentAddressStreet,
    currentAddressCity,
    currentAddressState,
    currentAddressZip,
    currentAddressSinceDate,
    householdIncome,
    moveInDate,
    totalOccupancy,
    landlordName,
    landlordPhone,
    additionalInfo
  );
  await persistDbToCloudStorage();

  return NextResponse.json(
    { success: true, applicationId: result.lastInsertRowid },
    { status: 201 }
  );
}
