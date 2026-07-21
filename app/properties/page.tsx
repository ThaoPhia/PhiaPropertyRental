import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PropertyCard from '@/components/PropertyCard';
import { ensureDbReady, getDb } from '@/lib/db';
import { normalizePropertyRow } from '@/lib/property-fields';
import { PropertyStatus } from '@/lib/types';

export const dynamic = 'force-static';

export default async function PropertiesPage() {
  await ensureDbReady();
  const db = getDb();

  const rows = db.prepare(`
    SELECT * FROM properties
    WHERE status != '${PropertyStatus.REMOVED}'
    ORDER BY datetime(created_at) DESC
  `).all() as Record<string, unknown>[];

  const properties = rows.map((row) => normalizePropertyRow(row));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-50">
      <div className="max-w-[92rem] mx-auto px-4 md:px-6 py-10 md:py-14">
        <div className="mb-10 rounded-3xl border border-slate-200 bg-white/80 p-6 md:p-10 shadow-sm">
          <p className="text-sm font-semibold tracking-[0.2em] uppercase text-blue-700">Phia Property Rental</p>
          <h1 className="mt-3 text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
            Beautiful Homes, Carefully Maintained
          </h1>
          <p className="mt-4 max-w-2xl text-slate-600 text-base md:text-lg">
            Explore our curated portfolio of rentals with spacious layouts, premium finishes, and
            ready-to-move-in comfort.
          </p>
          {properties.length > 0 && (
            <div className="mt-6">
              <Badge>
                {properties.length} {properties.length === 1 ? 'Property Available' : 'Properties Available'}
              </Badge>
            </div>
          )}
        </div>

        {properties.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <p className="text-gray-600 mb-4">No properties found.</p>
            <Button asChild className="px-6">
              <Link href="/cms">
                Add a Property
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
