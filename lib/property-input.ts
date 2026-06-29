import { NextRequest } from 'next/server';

export interface PropertyInput {
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  monthlyRent: number;
  status: string;
  dateAvailable: string;
  details: string;
  highlights: string;
  imageFiles: File[];
  imageOrder: string[];
  removedImageUrls: string[];
}

function parseNumber(value: unknown): number {
  return Number.parseFloat(String(value || '0')) || 0;
}

function parseString(value: unknown): string {
  return String(value || '').trim();
}

function parseStringArray(values: unknown[]): string[] {
  return values.map((value) => String(value)).filter((value) => value.length > 0);
}

export async function readPropertyInput(request: NextRequest): Promise<PropertyInput> {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();

    return {
      name: parseString(formData.get('name')),
      type: parseString(formData.get('type')),
      address: parseString(formData.get('address')),
      city: parseString(formData.get('city')),
      state: parseString(formData.get('state')),
      zipCode: parseString(formData.get('zipCode')),
      bedrooms: parseNumber(formData.get('bedrooms')),
      bathrooms: parseNumber(formData.get('bathrooms')),
      squareFeet: parseNumber(formData.get('squareFeet')),
      monthlyRent: parseNumber(formData.get('monthlyRent')),
      status: parseString(formData.get('status')) || 'available',
      dateAvailable: parseString(formData.get('dateAvailable')),
      details: parseString(formData.get('details') || formData.get('description')),
      highlights: String(formData.get('highlights') || '[]'),
      imageFiles: formData
        .getAll('images')
        .filter((value): value is File => value instanceof File && value.size > 0),
      imageOrder: parseStringArray(formData.getAll('imageOrder')),
      removedImageUrls: parseStringArray(formData.getAll('removedImages')),
    };
  }

  const body = await request.json() as Record<string, unknown>;

  return {
    name: parseString(body.name),
    type: parseString(body.type),
    address: parseString(body.address),
    city: parseString(body.city),
    state: parseString(body.state),
    zipCode: parseString(body.zipCode),
    bedrooms: parseNumber(body.bedrooms),
    bathrooms: parseNumber(body.bathrooms),
    squareFeet: parseNumber(body.squareFeet),
    monthlyRent: parseNumber(body.monthlyRent),
    status: parseString(body.status) || 'available',
    dateAvailable: parseString(body.dateAvailable),
    details: parseString(body.details || body.description),
    highlights: typeof body.highlights === 'string' ? body.highlights : JSON.stringify(body.highlights || []),
    imageFiles: [],
    imageOrder: Array.isArray(body.imageOrder) ? parseStringArray(body.imageOrder) : [],
    removedImageUrls: [],
  };
}
