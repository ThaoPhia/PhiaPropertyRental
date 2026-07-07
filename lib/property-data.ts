import { ensureDbReady, getDb } from '@/lib/db';
import { Property } from '@/lib/types';
import { normalizePropertyRow } from '@/lib/property-fields';

export async function getPropertyWithImages(id: number): Promise<Property | null> {
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
      `SELECT image_url
       FROM property_images
       WHERE property_id = ?
       ORDER BY sort_order ASC, id ASC`
    )
    .all(id) as { image_url: string }[];

  const orderedImages = imageRows.map((row) => row.image_url).filter(Boolean);
  if (property.image_url && !orderedImages.includes(property.image_url)) {
    orderedImages.unshift(property.image_url);
  }
  const uniqueImages = Array.from(new Set(orderedImages));

  return {
    ...property,
    image_url: uniqueImages[0] || property.image_url,
    images: uniqueImages,
  };
}
