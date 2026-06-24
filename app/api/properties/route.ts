import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthenticatedAdminFromRequest } from '@/lib/auth';
import { deletePropertyImage, savePropertyImage } from '@/lib/property-images';

async function readPropertyInput(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const imageFile = formData.get('image');

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
      price: Number.parseFloat(String(formData.get('price') || '0')) || 0,
      description: String(formData.get('description') || '').trim(),
      imageFile: imageFile instanceof File && imageFile.size > 0 ? imageFile : null,
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
    price: Number.parseFloat(String(body.price || '0')) || 0,
    description: String(body.description || '').trim(),
    imageFile: null as File | null,
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

  const uploadState = { imageUrl: null as string | null };

  try {
    const body = await readPropertyInput(request);
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
      imageFile,
    } = body;

    // Validation
    if (!name || !type || !address || !city || !state || !zipCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    uploadState.imageUrl = imageFile ? await savePropertyImage(imageFile) : null;
    const imageUrl = uploadState.imageUrl;

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
      imageUrl
    );

    return NextResponse.json(
      {
        id: result.lastInsertRowid,
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
        image_url: imageUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    if (uploadState.imageUrl) {
      await deletePropertyImage(uploadState.imageUrl).catch((cleanupError) => {
        console.error('Failed to clean up uploaded image:', cleanupError);
      });
    }
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to create property' },
      { status: 500 }
    );
  }
}
