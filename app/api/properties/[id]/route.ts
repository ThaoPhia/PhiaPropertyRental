import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthenticatedAdminFromRequest } from '@/lib/auth';
import { deletePropertyImage, savePropertyImages } from '@/lib/property-images';
import { getPropertyWithImages } from '@/lib/property-data';
import { parsePropertyHighlights } from '@/lib/property-fields';

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
      price: Number.parseFloat(String(formData.get('price') || '0')) || 0,
      monthlyRent: Number.parseFloat(String(formData.get('monthlyRent') || formData.get('price') || '0')) || 0,
      status: String(formData.get('status') || 'available').trim(),
      dateAvailable: String(formData.get('dateAvailable') || '').trim(),
      details: String(formData.get('details') || formData.get('description') || '').trim(),
      highlights: String(formData.get('highlights') || '[]'),
      imageFiles,
      imageOrder: formData
        .getAll('imageOrder')
        .map((value) => String(value))
        .filter((value) => value.length > 0),
      removedImageUrls: formData
        .getAll('removedImages')
        .map((value) => String(value))
        .filter((value) => value.length > 0),
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
    monthlyRent: Number.parseFloat(String(body.monthlyRent || body.price || '0')) || 0,
    status: String(body.status || 'available').trim(),
    dateAvailable: String(body.dateAvailable || '').trim(),
    details: String(body.details || body.description || '').trim(),
    highlights: typeof body.highlights === 'string' ? body.highlights : JSON.stringify(body.highlights || []),
    imageFiles: [] as File[],
    imageOrder: Array.isArray(body.imageOrder)
      ? body.imageOrder.map((value: unknown) => String(value)).filter((value: string) => value.length > 0)
      : [],
    removedImageUrls: [] as string[],
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

    const property = getPropertyWithImages(id);

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

  const uploadState = { imageUrls: [] as string[] };

  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'Invalid property id' }, { status: 400 });
    }

    const currentProperty = getPropertyWithImages(id);

    if (!currentProperty) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

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
      imageOrder,
      removedImageUrls,
    } = body;

    const existingImages = currentProperty.images ?? [];
    const removedImageSet = new Set(removedImageUrls);
    const retainedExistingImages = existingImages.filter((imageUrl) => !removedImageSet.has(imageUrl));
    const retainedImageSet = new Set(retainedExistingImages);
    const orderedRetainedExistingImages = imageOrder
      .filter((imageUrl: string) => retainedImageSet.has(imageUrl))
      .concat(retainedExistingImages.filter((imageUrl: string) => !imageOrder.includes(imageUrl)));

    let parsedHighlights = [];
    try {
      parsedHighlights = parsePropertyHighlights(highlights);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid highlights' },
        { status: 400 }
      );
    }

    if (imageFiles.length > 0) {
      uploadState.imageUrls = await savePropertyImages(imageFiles);
    }

    const finalOrderedImages = [...orderedRetainedExistingImages, ...uploadState.imageUrls];
    const nextImageUrl = finalOrderedImages[0] || null;

    const result = db.prepare(
      `UPDATE properties 
       SET name=?, type=?, status=?, address=?, city=?, state=?, zipCode=?, bedrooms=?, bathrooms=?, squareFeet=?, monthlyRent=?, details=?, highlights=?, dateAvailable=?, image_url=?
       WHERE id=?`,
    ).run(
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
      JSON.stringify(parsedHighlights),
      dateAvailable || null,
      nextImageUrl,
      id
    );

    if (result.changes === 0) {
      await Promise.all(
        uploadState.imageUrls.map((imageUrl) =>
          deletePropertyImage(imageUrl).catch((cleanupError) => {
            console.error('Failed to clean up uploaded image:', cleanupError);
          })
        )
      );
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    const upsertPropertyImage = db.prepare(
      `INSERT INTO property_images (property_id, image_url, sort_order)
       VALUES (?, ?, ?)
       ON CONFLICT(property_id, image_url) DO UPDATE SET sort_order = excluded.sort_order`
    );

    const deletePropertyImageRow = db.prepare(
      'DELETE FROM property_images WHERE property_id = ? AND image_url = ?'
    );

    const syncGallery = db.transaction(() => {
      finalOrderedImages.forEach((imageUrl, index) => {
        upsertPropertyImage.run(id, imageUrl, index);
      });
      removedImageUrls.forEach((imageUrl) => {
        deletePropertyImageRow.run(id, imageUrl);
      });
    });

    syncGallery();

    if (removedImageUrls.length > 0) {
      await Promise.all(
        removedImageUrls.map((imageUrl) =>
          deletePropertyImage(imageUrl).catch((cleanupError) => {
            console.error('Failed to remove property image file:', cleanupError);
          })
        )
      );
    }

    return NextResponse.json({
      id,
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
      image_url: nextImageUrl,
      images: finalOrderedImages,
    });
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

    const currentProperty = getPropertyWithImages(id);

    const result = db.prepare('DELETE FROM properties WHERE id = ?').run(id);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    await Promise.all(
      (currentProperty?.images ?? [])
        .filter(Boolean)
        .map((imageUrl) =>
          deletePropertyImage(imageUrl).catch((cleanupError) => {
            console.error('Failed to remove property image:', cleanupError);
          })
        )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to delete property' },
      { status: 500 }
    );
  }
}
