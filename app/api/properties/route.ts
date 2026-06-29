import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthenticatedAdminFromRequest } from '@/lib/auth';
import { deletePropertyImage, savePropertyImages } from '@/lib/property-images';
import { parsePropertyHighlights } from '@/lib/property-fields';
import { normalizePropertyRow } from '@/lib/property-fields';

async function readPropertyInput(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const imageFiles = formData
      .getAll('images')
      .filter((value): value is File => value instanceof File && value.size > 0);

    return {
      name: String(formData.get('name') || '').trim(),
      type: String(formData.get('type') || '').trim(),
      address: String(formData.get('address') || '').trim(),
      city: String(formData.get('city') || '').trim(),
      state: String(formData.get('state') || '').trim(),
      zipCode: String(formData.get('zipCode') || '').trim(),
      bedrooms: Number.parseFloat(String(formData.get('bedrooms') || '0')) || 0,
      bathrooms: Number.parseFloat(String(formData.get('bathrooms') || '0')) || 0,
      squareFeet: Number.parseFloat(String(formData.get('squareFeet') || '0')) || 0,
      monthlyRent: Number.parseFloat(String(formData.get('monthlyRent') || '0')) || 0,
      status: String(formData.get('status') || 'available').trim(),
      dateAvailable: String(formData.get('dateAvailable') || '').trim(),
      details: String(formData.get('details') || formData.get('description') || '').trim(),
      highlights: String(formData.get('highlights') || '[]'),
      imageFiles,
    };
  }

  const body = await request.json();

  return {
    name: String(body.name || '').trim(),
    type: String(body.type || '').trim(),
    address: String(body.address || '').trim(),
    city: String(body.city || '').trim(),
    state: String(body.state || '').trim(),
    zipCode: String(body.zipCode || '').trim(),
    bedrooms: Number.parseFloat(String(body.bedrooms || '0')) || 0,
    bathrooms: Number.parseFloat(String(body.bathrooms || '0')) || 0,
    squareFeet: Number.parseFloat(String(body.squareFeet || '0')) || 0,
    monthlyRent: Number.parseFloat(String(body.monthlyRent || '0')) || 0,
    status: String(body.status || 'available').trim(),
    dateAvailable: String(body.dateAvailable || '').trim(),
    details: String(body.details || body.description || '').trim(),
    highlights: typeof body.highlights === 'string' ? body.highlights : JSON.stringify(body.highlights || []),
    imageFiles: [] as File[],
  };
}

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
