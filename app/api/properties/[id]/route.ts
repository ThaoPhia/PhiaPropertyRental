import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'Invalid property id' }, { status: 400 });
    }

    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(property);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch property' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'Invalid property id' }, { status: 400 });
    }

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

    const result = db.prepare(
      `UPDATE properties 
       SET name=?, type=?, address=?, city=?, state=?, zipCode=?, bedrooms=?, bathrooms=?, squareFeet=?, price=?, description=?, image_url=?
       WHERE id=?`,
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
      image_url || null,
      id
    );

    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ id, ...body });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to update property' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'Invalid property id' }, { status: 400 });
    }

    const result = db.prepare('DELETE FROM properties WHERE id = ?').run(id);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to delete property' },
      { status: 500 }
    );
  }
}

