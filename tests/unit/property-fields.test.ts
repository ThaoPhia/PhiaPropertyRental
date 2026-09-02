import {
  normalizePropertyRow,
  parsePropertyHighlights,
  serializePropertyHighlights,
} from '@/lib/property-fields';
import { PropertyStatus } from '@/lib/types/types';

describe('property fields', () => {
  describe('parsePropertyHighlights', () => {
    it('normalizes legacy icons and removes incomplete highlights', () => {
      const highlights = parsePropertyHighlights(JSON.stringify([
        { icon: '/images/icons/garage-sharp-solid.png', text: '  Two-car garage  ' },
        { icon: '', text: 'Missing icon' },
        { icon: 'FenceIcon', text: '   ' },
        { icon: 'BoxIcon', text: 'Storage' },
        { icon: 'BoxIcon' },
      ]));

      expect(highlights).toEqual([
        { icon: 'GarageIcon', text: 'Two-car garage' },
        { icon: 'BoxIcon', text: 'Storage' },
      ]);
    });

    it('rejects valid JSON that is not an array', () => {
      expect(() => parsePropertyHighlights('{"icon":"GarageIcon"}')).toThrow(
        'Highlights must be an array',
      );
    });
  });

  describe('normalizePropertyRow', () => {
    it('applies defaults, coerces numeric fields, and tolerates malformed highlights', () => {
      const property = normalizePropertyRow({
        id: '42',
        name: 'Garden Duplex',
        type: 'duplex',
        bedrooms: '3',
        bathrooms: '2.5',
        square_feet: '1450',
        monthly_rent: '2100',
        description: 'Legacy description',
        highlights: 'not-json',
        created_at: '2026-08-01T00:00:00.000Z',
        updated_at: '2026-08-02T00:00:00.000Z',
      });

      expect(property).toMatchObject({
        id: 42,
        status: PropertyStatus.AVAILABLE,
        bedrooms: 3,
        bathrooms: 2.5,
        square_feet: 1450,
        monthly_rent: 2100,
        details: 'Legacy description',
        highlights: [],
        date_available: null,
      });
      expect(property.created_at).toEqual(new Date('2026-08-01T00:00:00.000Z'));
      expect(property.updated_at).toEqual(new Date('2026-08-02T00:00:00.000Z'));
    });
  });

  describe('serializePropertyHighlights', () => {
    it('serializes arrays and preserves an existing serialized value', () => {
      const highlights = [{ icon: 'FenceIcon', text: 'Fenced yard' }];

      expect(serializePropertyHighlights(highlights)).toBe(JSON.stringify(highlights));
      expect(serializePropertyHighlights('[{"icon":"BoxIcon","text":"Storage"}]')).toBe(
        '[{"icon":"BoxIcon","text":"Storage"}]',
      );
      expect(serializePropertyHighlights(null)).toBe('[]');
    });
  });
});