import Link from 'next/link';
import { redirect } from 'next/navigation';
import PropertyForm from '@/components/PropertyForm';
import CMSLogoutButton from '@/components/CMSLogoutButton';
import { getAuthenticatedAdminFromCookies } from '@/lib/auth';

export default async function CMSCreatePage() {
  const admin = await getAuthenticatedAdminFromCookies();

  if (!admin) {
    redirect('/cms/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Property Management System</h1>
            <p className="text-sm text-gray-600 mt-1">Signed in as {admin.email}</p>
          </div>
          <CMSLogoutButton />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link href="/cms">
            <div className="p-4 bg-white rounded-lg shadow hover:shadow-lg cursor-pointer border-2 border-gray-200 hover:border-blue-600">
              <h3 className="font-semibold text-gray-900">All Properties</h3>
              <p className="text-sm text-gray-600">View and manage all properties</p>
            </div>
          </Link>
          <div className="p-4 bg-blue-50 rounded-lg shadow border-2 border-blue-600">
            <h3 className="font-semibold text-gray-900">Create New</h3>
            <p className="text-sm text-gray-600">Add a new property listing</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Property</h2>
          <PropertyForm />
        </div>
      </div>
    </div>
  );
}
