import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthenticatedAdminFromRequest } from '@/lib/auth';
import { deletePropertyImage, savePropertyImage } from '@/lib/property-images';

async function readPropertyInput(request: NextRequest, existingImageUrl: string | null) {
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
      imageUrl: existingImageUrl,
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
    imageUrl:
      typeof body.image_url === 'string' && body.image_url.trim() ? String(body.image_url).trim() : existingImageUrl,
  };
}

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
  const admin = await getAuthenticatedAdminFromRequest(request);

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const uploadState = { imageUrl: null as string | null };

  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'Invalid property id' }, { status: 400 });
    }

    const currentProperty = db
      .prepare('SELECT image_url FROM properties WHERE id = ?')
      .get(id) as { image_url: string | null } | undefined;

    if (!currentProperty) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const body = await readPropertyInput(request, currentProperty.image_url ?? null);
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
      imageUrl,
    } = body;

    let nextImageUrl = imageUrl;

    if (imageFile) {
      uploadState.imageUrl = await savePropertyImage(imageFile);
      nextImageUrl = uploadState.imageUrl;
    }

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
      nextImageUrl,
      id
    );

    if (result.changes === 0) {
      if (uploadState.imageUrl) {
        await deletePropertyImage(uploadState.imageUrl).catch((cleanupError) => {
          console.error('Failed to clean up uploaded image:', cleanupError);
        });
      }
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    if (uploadState.imageUrl && currentProperty.image_url !== nextImageUrl) {
      await deletePropertyImage(currentProperty.image_url).catch((cleanupError) => {
        console.error('Failed to remove old property image:', cleanupError);
      });
    }

    return NextResponse.json({
      id,
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
      image_url: nextImageUrl,
    });
  } catch (error) {
    if (uploadState.imageUrl) {
      await deletePropertyImage(uploadState.imageUrl).catch((cleanupError) => {
        console.error('Failed to clean up uploaded image:', cleanupError);
      });
    }
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
  const admin = await getAuthenticatedAdminFromRequest(request);

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'Invalid property id' }, { status: 400 });
    }

    const currentProperty = db
      .prepare('SELECT image_url FROM properties WHERE id = ?')
      .get(id) as { image_url: string | null } | undefined;

    const result = db.prepare('DELETE FROM properties WHERE id = ?').run(id);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    await deletePropertyImage(currentProperty?.image_url ?? null).catch((cleanupError) => {
      console.error('Failed to remove property image:', cleanupError);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to delete property' },
      { status: 500 }
    );
  }
}
