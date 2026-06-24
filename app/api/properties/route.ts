import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthenticatedAdminFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const city = searchParams.get('city');

    let query = 'SELECT * FROM properties WHERE 1=1';
    const params: (string | number)[] = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (city) {
      query += ' AND city = ?';
      params.push(city);
    }

    const rows = db.prepare(`${query} ORDER BY datetime(createdAt) DESC`).all(...params);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAuthenticatedAdminFromRequest(request);

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name,
      type,
      address,
      city,
      state,
      zipCode,
      bedrooms,
      bathrooms,
      squareFeet,
      price,
      description,
      image_url,
    } = body;

    // Validation
    if (!name || !type || !address || !city || !state || !zipCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = db.prepare(
      `INSERT INTO properties 
       (name, type, address, city, state, zipCode, bedrooms, bathrooms, squareFeet, price, description, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      name,
      type,
      address,
      city,
      state,
      zipCode,
      bedrooms,
      bathrooms,
      squareFeet,
      price,
      description,
      image_url || null
    );

    return NextResponse.json(
      { id: result.lastInsertRowid, ...body },
      { status: 201 }
    );
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to create property' },
      { status: 500 }
    );
  }
}
