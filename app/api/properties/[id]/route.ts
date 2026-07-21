import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { ensureDbReady, getDb, persistDbToCloudStorage } from '@/lib/db';
import { getAuthenticatedAdminFromRequest } from '@/lib/auth';
import { deletePropertyImage, savePropertyImages } from '@/lib/property-images';
import { getPropertyWithImages } from '@/lib/property-data';
import { parsePropertyHighlights, serializePropertyHighlights } from '@/lib/property-fields';
import { readPropertyInput } from '@/lib/property-input';
import { PropertyStatus } from '@/lib/types';
import { triggerVercelRedeploy } from '@/lib/vercel-redeploy';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbReady();
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'Invalid property id' }, { status: 400 });
    }

    const property = await getPropertyWithImages(id);
    const admin = await getAuthenticatedAdminFromRequest(request);

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    if (property.status === PropertyStatus.REMOVED && !admin) {
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
  await ensureDbReady();
  const db = getDb();
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

    const currentProperty = await getPropertyWithImages(id);

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
      existingImageDescriptions,
      newImageDescriptions,
    } = body;

    const existingImages = currentProperty.gallery_images ?? (currentProperty.images ?? []).map((url) => ({
      url,
      description: '',
    }));
    const removedImageSet = new Set(removedImageUrls);
    const retainedExistingImages = existingImages.filter((image) => !removedImageSet.has(image.url));
    const retainedImageSet = new Set(retainedExistingImages.map((image) => image.url));
    const orderedRetainedExistingImages = imageOrder
      .filter((imageUrl: string) => retainedImageSet.has(imageUrl))
      .map((imageUrl) => {
        const matchingImage = retainedExistingImages.find((image) => image.url === imageUrl);
        return {
          url: imageUrl,
          description: existingImageDescriptions[imageUrl] ?? matchingImage?.description ?? '',
        };
      })
      .concat(
        retainedExistingImages
          .filter((image) => !imageOrder.includes(image.url))
          .map((image) => ({
            url: image.url,
            description: existingImageDescriptions[image.url] ?? image.description ?? '',
          }))
      );

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

    const finalOrderedImages = [
      ...orderedRetainedExistingImages,
      ...uploadState.imageUrls.map((url, index) => ({
        url,
        description: newImageDescriptions[index] ?? '',
      })),
    ];
    const nextImageUrl = finalOrderedImages[0]?.url || null;

    const result = db.prepare(
      `UPDATE properties 
       SET name=?, type=?, status=?, address=?, city=?, state=?, zip_code=?, bedrooms=?, bathrooms=?, square_feet=?, monthly_rent=?, details=?, highlights=?, date_available=?, image_url=?
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
      `INSERT INTO property_images (property_id, image_url, description, sort_order)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(property_id, image_url) DO UPDATE SET
         description = excluded.description,
         sort_order = excluded.sort_order`
    );

    const deletePropertyImageRow = db.prepare(
      'DELETE FROM property_images WHERE property_id = ? AND image_url = ?'
    );

    const syncGallery = db.transaction(() => {
      finalOrderedImages.forEach((image, index) => {
        upsertPropertyImage.run(id, image.url, image.description, index);
      });
      removedImageUrls.forEach((imageUrl) => {
        deletePropertyImageRow.run(id, imageUrl);
      });
    });

    syncGallery();
    await persistDbToCloudStorage();

    revalidatePath('/properties');
    revalidatePath(`/properties/${id}`);

    const redeployResult = await triggerVercelRedeploy(`property-updated:${id}`);
    if (redeployResult.error) {
      console.error('Vercel redeploy trigger error:', redeployResult.error);
    }

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
      zip_code: zipCode,
      bedrooms,
      bathrooms,
      square_feet: squareFeet,
      monthly_rent: monthlyRent,
      details,
      highlights: parsedHighlights,
      date_available: dateAvailable || null,
      image_url: nextImageUrl,
      images: finalOrderedImages.map((image) => image.url),
      gallery_images: finalOrderedImages,
      redeployTriggered: redeployResult.triggered,
      redeployError: redeployResult.error ?? null,
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
  await ensureDbReady();
  const db = getDb();
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

    const currentProperty = await getPropertyWithImages(id);

    if (!currentProperty) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    db.prepare('DELETE FROM applications WHERE property_id = ?').run(id);

    const result = db.prepare('DELETE FROM properties WHERE id = ?').run(id);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    await persistDbToCloudStorage();

    revalidatePath('/properties');
    revalidatePath(`/properties/${id}`);

    const redeployResult = await triggerVercelRedeploy(`property-deleted:${id}`);
    if (redeployResult.error) {
      console.error('Vercel redeploy trigger error:', redeployResult.error);
    }

    await Promise.all(
      (currentProperty.images ?? [])
        .filter(Boolean)
        .map((imageUrl) =>
          deletePropertyImage(imageUrl).catch((cleanupError) => {
            console.error('Failed to remove property image:', cleanupError);
          })
        )
    );

    return NextResponse.json({
      success: true,
      redeployTriggered: redeployResult.triggered,
      redeployError: redeployResult.error ?? null,
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to delete property' },
      { status: 500 }
    );
  }
}
