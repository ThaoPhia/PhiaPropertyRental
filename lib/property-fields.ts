import { Property, PropertyHighlight, PropertyImage } from '@/lib/types';

const DEFAULT_STATUS: Property['status'] = 'available';
const legacyIconNameByPath: Record<string, string> = {
  '/images/icons/garage-sharp-solid.png': 'GarageIcon',
};

function normalizePropertyHighlightIcon(icon: string): string {
  const trimmedIcon = icon.trim();
  return legacyIconNameByPath[trimmedIcon] ?? trimmedIcon;
}

function isPropertyHighlight(value: unknown): value is PropertyHighlight {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { icon?: unknown }).icon === 'string' &&
    typeof (value as { text?: unknown }).text === 'string'
  );
}

function isPropertyImage(value: unknown): value is PropertyImage {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { url?: unknown }).url === 'string' &&
    typeof (value as { description?: unknown }).description === 'string'
  );
}

export function parsePropertyHighlights(value: unknown): PropertyHighlight[] {
  if (typeof value !== 'string' || value.trim() === '') {
    return [];
  }

  const parsed = JSON.parse(value);

  if (!Array.isArray(parsed)) {
    throw new Error('Highlights must be an array');
  }

  const highlights = parsed.filter(isPropertyHighlight).map((item) => ({
    icon: normalizePropertyHighlightIcon(item.icon),
    text: item.text.trim(),
  }));

  return highlights.filter((item) => item.icon.length > 0 && item.text.length > 0);
}

export function serializePropertyHighlights(highlights: PropertyHighlight[] | string | null | undefined): string {
  if (typeof highlights === 'string') {
    return highlights;
  }

  return JSON.stringify(highlights ?? []);
}

export function normalizePropertyRow(row: Record<string, unknown>): Property {
  const monthly_rent = Number(row.monthly_rent ?? 0);
  const details = String(row.details ?? row.description ?? '');
  const status = (row.status as Property['status'] | undefined) || DEFAULT_STATUS;
  const date_available = row.date_available ? String(row.date_available) : null;
  const highlightsValue = row.highlights;

  let highlights: PropertyHighlight[] = [];
  if (Array.isArray(highlightsValue)) {
    highlights = highlightsValue.filter(isPropertyHighlight).map((item) => ({
      icon: normalizePropertyHighlightIcon(item.icon),
      text: item.text.trim(),
    }));
  } else if (typeof highlightsValue === 'string' && highlightsValue.trim()) {
    try {
      highlights = parsePropertyHighlights(highlightsValue);
    } catch {
      highlights = [];
    }
  }

  const galleryImagesValue = row.gallery_images;
  const gallery_images = Array.isArray(galleryImagesValue)
    ? galleryImagesValue
        .filter(isPropertyImage)
        .map((image) => ({ url: image.url, description: image.description.trim() }))
    : undefined;

  return {
    id: Number(row.id),
    name: String(row.name ?? ''),
    type: row.type as Property['type'],
    status,
    address: String(row.address ?? ''),
    city: String(row.city ?? ''),
    state: String(row.state ?? ''),
    zip_code: String(row.zip_code ?? ''),
    bedrooms: Number(row.bedrooms ?? 0),
    bathrooms: Number(row.bathrooms ?? 0),
    square_feet: Number(row.square_feet ?? 0),
    monthly_rent,
    details,
    highlights,
    date_available,
    image_url: typeof row.image_url === 'string' ? row.image_url : undefined,
    images: Array.isArray(row.images) ? (row.images as string[]) : undefined,
    gallery_images,
    created_at: row.created_at ? new Date(String(row.created_at)) : new Date(),
    updated_at: row.updated_at ? new Date(String(row.updated_at)) : new Date(),
  };
}
