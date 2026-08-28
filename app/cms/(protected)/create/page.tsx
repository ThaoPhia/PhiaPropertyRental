import Link from 'next/link';
import { redirect } from 'next/navigation';
import PropertyForm from '@/components/PropertyForm';
import { getAuthenticatedAdminFromCookies } from '@/lib/auth';

export default async function CMSCreatePropertyPage() {
  const admin = await getAuthenticatedAdminFromCookies();

  if (!admin) {
    redirect('/cms/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[92rem] mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Property</h1>
            <p className="text-sm text-gray-600 mt-1">
              Signed in as {admin.name || 'Admin'} ({admin.email})
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/cms" className="text-blue-600 hover:underline inline-block">
              Dashboard
            </Link>
            <Link href="/cms/applications" className="text-blue-600 hover:underline inline-block">
              View Applications
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <PropertyForm />
        </div>
      </div>
    </div>
  );
}
