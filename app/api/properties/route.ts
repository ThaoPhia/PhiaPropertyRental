import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthenticatedAdminFromRequest } from '@/lib/auth';
import { deletePropertyImage, savePropertyImages } from '@/lib/property-images';
import { parsePropertyHighlights } from '@/lib/property-fields';
import { normalizePropertyRow } from '@/lib/property-fields';
import { readPropertyInput } from '@/lib/property-input';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const city = searchParams.get('city');
    const admin = await getAuthenticatedAdminFromRequest(request);
    const includeRemoved = Boolean(admin);

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

    if (!includeRemoved) {
      query += " AND status != 'removed'";
    }

    const rows = db.prepare(`${query} ORDER BY datetime(createdAt) DESC`).all(...params) as Record<string, unknown>[];
    const properties = rows.map((row) => normalizePropertyRow(row));

    return NextResponse.json(properties);
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

  const uploadState = { imageUrls: [] as string[] };

  try {
    const body = await readPropertyInput(request);
    const {
      name,
      type,
      status,
      address,
      city,
      state,
      zipCode,
      bedrooms,
      bathrooms,
      squareFeet,
      monthlyRent,
      dateAvailable,
      details,
      highlights,
      imageFiles,
    } = body;

    // Validation
    if (!name || !type || !address || !city || !state || !zipCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let parsedHighlights = [];
    try {
      parsedHighlights = parsePropertyHighlights(highlights);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid highlights' },
        { status: 400 }
      );
    }

    uploadState.imageUrls = await savePropertyImages(imageFiles);
    const imageUrl = uploadState.imageUrls[0] || null;

    const insertProperty = db.prepare(
      `INSERT INTO properties 
       (name, type, status, address, city, state, zipCode, bedrooms, bathrooms, squareFeet, monthlyRent, details, highlights, dateAvailable, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const insertPropertyImage = db.prepare(
      `INSERT INTO property_images (property_id, image_url, sort_order)
       VALUES (?, ?, ?)`
    );

    const createProperty = db.transaction(() => {
      const result = insertProperty.run(
        name,
        type,
        status || 'available',
        address,
        city,
        state,
        zipCode,
        bedrooms,
        bathrooms,
        squareFeet,
        monthlyRent,
        details,
        JSON.stringify(parsedHighlights),
        dateAvailable || null,
        imageUrl
      );

      uploadState.imageUrls.forEach((image, index) => {
        insertPropertyImage.run(result.lastInsertRowid as number, image, index);
      });

      return result;
    });

    const result = createProperty();

    return NextResponse.json(
      {
        id: result.lastInsertRowid,
        name,
        type,
        status,
        address,
        city,
        state,
        zipCode,
        bedrooms,
        bathrooms,
        squareFeet,
        monthlyRent,
        details,
        highlights: parsedHighlights,
        dateAvailable: dateAvailable || null,
        image_url: imageUrl,
        images: uploadState.imageUrls,
      },
      { status: 201 }
    );
  } catch (error) {
    if (uploadState.imageUrls.length > 0) {
      await Promise.all(
        uploadState.imageUrls.map((imageUrl) =>
          deletePropertyImage(imageUrl).catch((cleanupError) => {
            console.error('Failed to clean up uploaded image:', cleanupError);
          })
        )
      );
    }
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to create property' },
      { status: 500 }
    );
  }
}
