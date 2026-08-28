import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { ensureDbReady, getDb, persistDbToCloudStorage } from '@/lib/db';
import { getAuthenticatedAdminFromRequest } from '@/lib/auth';
import { deletePropertyImage, savePropertyImages } from '@/lib/property-images';
import { parsePropertyHighlights, serializePropertyHighlights } from '@/lib/property-fields';
import { normalizePropertyRow } from '@/lib/property-fields';
import { readPropertyInput } from '@/lib/property-input';
import { PropertyStatus } from '@/lib/types/types';
import { triggerVercelRedeploy } from '@/lib/vercel-redeploy';

export async function GET(request: NextRequest) {
  try {
    await ensureDbReady();
    const db = getDb();
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
      query += ` AND status != '${PropertyStatus.REMOVED}'`;
    }

    const rows = db.prepare(`${query} ORDER BY datetime(created_at) DESC`).all(...params) as Record<string, unknown>[];
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
  await ensureDbReady();
  const db = getDb();
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
      newImageDescriptions,
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
       (name, type, status, address, city, state, zip_code, bedrooms, bathrooms, square_feet, monthly_rent, details, highlights, date_available, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const insertPropertyImage = db.prepare(
      `INSERT INTO property_images (property_id, image_url, description, sort_order)
       VALUES (?, ?, ?, ?)`
    );

    const createProperty = db.transaction(() => {
      const result = insertProperty.run(
        name,
        type,
        status || PropertyStatus.AVAILABLE,
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
        insertPropertyImage.run(
          result.lastInsertRowid as number,
          image,
          newImageDescriptions[index] ?? '',
          index
        );
      });

      return result;
    });

    const result = createProperty();
    await persistDbToCloudStorage();
    const createdPropertyId = Number(result.lastInsertRowid);

    revalidatePath('/properties');
    revalidatePath(`/properties/${createdPropertyId}`);

    const redeployResult = await triggerVercelRedeploy(`property-created:${createdPropertyId}`);
    if (redeployResult.error) {
      console.error('Vercel redeploy trigger error:', redeployResult.error);
    }

    return NextResponse.json(
      {
        id: createdPropertyId,
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
        image_url: imageUrl,
        images: uploadState.imageUrls,
        gallery_images: uploadState.imageUrls.map((url, index) => ({
          url,
          description: newImageDescriptions[index] ?? '',
        })),
        redeployTriggered: redeployResult.triggered,
        redeployError: redeployResult.error ?? null,
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
