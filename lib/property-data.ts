import db from '@/lib/db';
import { Property } from '@/lib/types';

export function getPropertyWithImages(id: number): Property | null {
  const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(id) as Property | undefined;

  if (!property) {
    return null;
  }

  const imageRows = db
    .prepare(
      `SELECT image_url
       FROM property_images
       WHERE property_id = ?
       ORDER BY sort_order ASC, id ASC`
    )
    .all(id) as { image_url: string }[];

  const images = [
    ...(property.image_url ? [property.image_url] : []),
    ...imageRows.map((row) => row.image_url).filter(Boolean),
  ];

  const uniqueImages = Array.from(new Set(images));

  return {
    ...property,
    image_url: uniqueImages[0] || property.image_url,
    images: uniqueImages,
  };
}
