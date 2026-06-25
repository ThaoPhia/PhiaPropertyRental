import { Property, PropertyHighlight } from '@/lib/types';

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
  const monthlyRent = Number(row.monthlyRent ?? row.price ?? 0);
  const details = String(row.details ?? row.description ?? '');
  const status = (row.status as Property['status'] | undefined) || DEFAULT_STATUS;
  const dateAvailable = row.dateAvailable ? String(row.dateAvailable) : null;
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

  return {
    id: Number(row.id),
    name: String(row.name ?? ''),
    type: row.type as Property['type'],
    status,
    address: String(row.address ?? ''),
    city: String(row.city ?? ''),
    state: String(row.state ?? ''),
    zipCode: String(row.zipCode ?? ''),
    bedrooms: Number(row.bedrooms ?? 0),
    bathrooms: Number(row.bathrooms ?? 0),
    squareFeet: Number(row.squareFeet ?? 0),
    monthlyRent,
    details,
    highlights,
    dateAvailable,
    image_url: typeof row.image_url === 'string' ? row.image_url : undefined,
    images: Array.isArray(row.images) ? (row.images as string[]) : undefined,
    createdAt: row.createdAt ? new Date(String(row.createdAt)) : new Date(),
    updatedAt: row.updatedAt ? new Date(String(row.updatedAt)) : new Date(),
  };
}
