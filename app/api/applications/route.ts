import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

interface ApplicationPayload {
  propertyId: unknown;
  applicantName: unknown;
  email: unknown;
  phone: unknown;
  currentAddressStreet: unknown;
  currentAddressCity: unknown;
  currentAddressState: unknown;
  currentAddressZip: unknown;
  currentAddressSinceDate: unknown;
  householdIncome: unknown;
  moveInDate: unknown;
  totalOccupancy: unknown;
  landlordName: unknown;
  landlordPhone: unknown;
  additionalInfo: unknown;
}

export async function GET() {
  try {
    const applications = db.prepare(`
      SELECT 
        id, 
        applicant_name as applicantName,
        email,
        phone,
        current_address_street as currentAddressStreet,
        current_address_city as currentAddressCity,
        current_address_state as currentAddressState,
        current_address_zip as currentAddressZip,
        current_address_since_date as currentAddressSinceDate,
        household_income as householdIncome,
        move_in_date as moveInDate,
        total_occupancy as totalOccupancy,
        landlord_name as landlordName,
        landlord_phone as landlordPhone,
        additional_info as additionalInfo,
        property_id as propertyId,
        property_name as propertyName,
        status,
        createdAt
      FROM applications
      ORDER BY 
        CASE status
          WHEN 'pending' THEN 0
          WHEN 'approved' THEN 1
          WHEN 'declined' THEN 2
          WHEN 'deleted' THEN 3
        END,
        createdAt DESC
    `).all();

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
    !landlordPhone
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

  return NextResponse.json(
    { success: true, applicationId: result.lastInsertRowid },
    { status: 201 }
  );
}
