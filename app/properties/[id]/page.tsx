import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ensureDbReady, getDb } from '@/lib/db';
import { getPropertyWithImages } from '@/lib/property-data';
import { PropertyStatus } from '@/lib/types';
import PropertyDetailClient from '@/components/PropertyDetailClient';

export const dynamic = 'force-static';
export const revalidate = false;
export const dynamicParams = false;

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams(): Promise<Array<{ id: string }>> {
  await ensureDbReady();
  const db = getDb();
  const rows = db.prepare(`
    SELECT id
    FROM properties
    WHERE status != '${PropertyStatus.REMOVED}'
    ORDER BY datetime(created_at) DESC
  `).all() as { id: number }[];

  return rows.map((row) => ({ id: String(row.id) }));
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  await ensureDbReady();
  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);

  if (Number.isNaN(id)) {
    notFound();
  }

  const property = await getPropertyWithImages(id);

  if (!property || property.status === PropertyStatus.REMOVED) {
    notFound();
  }

  const db = getDb();
  const rows = db.prepare(`
    SELECT id, name
    FROM properties
    WHERE status != '${PropertyStatus.REMOVED}'
    ORDER BY datetime(created_at) DESC
  `).all() as { id: number; name: string }[];

  const currentIndex = rows.findIndex((item) => item.id === id);
  const previousProperty = currentIndex > 0 ? rows[currentIndex - 1] : null;
  const nextProperty = currentIndex >= 0 && currentIndex < rows.length - 1 ? rows[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[92rem] mx-auto px-4 md:px-6 py-8">
        <Link href="/properties" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Properties
        </Link>

        <PropertyDetailClient
          property={property}
          previousProperty={previousProperty}
          nextProperty={nextProperty}
        />
      </div>
    </div>
  );
}
