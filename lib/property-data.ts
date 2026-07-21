import { ensureDbReady, getDb } from '@/lib/db';
import { Property, PropertyImage } from '@/lib/types';
import { normalizePropertyRow } from '@/lib/property-fields';

export async function getPropertyWithImages(id: number): Promise<Property | null> {
  // TEST
  await ensureDbReady();
  const db = getDb();
  const propertyRow = db.prepare('SELECT * FROM properties WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined;

  if (!propertyRow) {
    return null;
  }

  const property = normalizePropertyRow(propertyRow);
  const imageRows = db
    .prepare(
     `SELECT image_url, description
       FROM property_images
       WHERE property_id = ?
       ORDER BY sort_order ASC, id ASC`
    )
    .all(id) as { image_url: string; description: string | null }[];

  const orderedGalleryImages = imageRows
    .filter((row) => Boolean(row.image_url))
    .map((row) => ({
     url: row.image_url,
     description: row.description ?? '',
    }));

  if (property.image_url && !orderedGalleryImages.some((image) => image.url === property.image_url)) {
    orderedGalleryImages.unshift({ url: property.image_url, description: '' });
  }
  const uniqueGalleryImages = orderedGalleryImages.reduce<PropertyImage[]>((acc, image) => {
    if (!acc.some((entry) => entry.url === image.url)) {
     acc.push(image);
    }
    return acc;
  }, []);

  return {
    ...property,
    image_url: uniqueGalleryImages[0]?.url || property.image_url,
    images: uniqueGalleryImages.map((image) => image.url),
    gallery_images: uniqueGalleryImages,
  };
}
