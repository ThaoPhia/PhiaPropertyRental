import Link from 'next/link';
import { redirect } from 'next/navigation';
import PropertyForm from '@/components/PropertyForm';
import { Button } from '@/components/ui/button';
import { getAuthenticatedAdminFromCookies } from '@/lib/auth';
import { ensureDbReady } from '@/lib/db';
import { getPropertyWithImages } from '@/lib/property-data';

interface CMSEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function CMSEditPage({ params }: CMSEditPageProps) {
  const admin = await getAuthenticatedAdminFromCookies();

  if (!admin) {
    redirect('/cms/login');
  }

  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  await ensureDbReady();
  const property = Number.isNaN(id) ? null : await getPropertyWithImages(id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[92rem] mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <Link href="/cms" className="text-blue-600 hover:underline inline-block">
            ← Back to CMS
          </Link>
        </div>

        {!property ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Property not found</p>
            <Button asChild className="px-6">
              <Link href="/cms">
                Return to CMS
              </Link>
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Edit Property</h2>
            <p className="text-sm text-gray-600 mb-6">Signed in as {admin.email}</p>
            <PropertyForm initialData={property} />
          </div>
        )}
      </div>
    </div>
  );
}
