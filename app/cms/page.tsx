import Link from 'next/link';
import { redirect } from 'next/navigation';
import PropertyForm from '@/components/PropertyForm';
import { getAuthenticatedAdminFromCookies } from '@/lib/auth';

export default async function CMSCreatePage() {
  const admin = await getAuthenticatedAdminFromCookies();

  if (!admin) {
    redirect('/cms/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[92rem] mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Property Management System</h1>
            <p className="text-sm text-gray-600 mt-1">
              Signed in as {admin.name || 'Admin'} ({admin.email})
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/cms/applications" className="text-blue-600 hover:underline inline-block">
              View Applications
            </Link>
            <Link href="/cms/profile" className="text-blue-600 hover:underline inline-block">
              Edit Profile
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/properties">
            <div className="p-4 bg-white rounded-lg shadow hover:shadow-lg cursor-pointer border-2 border-gray-200 hover:border-blue-600">
              <h3 className="font-semibold text-gray-900">All Properties</h3>
              <p className="text-sm text-gray-600">View and manage all properties</p>
            </div>
          </Link>
          <div className="p-4 bg-blue-50 rounded-lg shadow border-2 border-blue-600">
            <h3 className="font-semibold text-gray-900">Create New</h3>
            <p className="text-sm text-gray-600">Add a new property listing</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow border-2 border-gray-200">
            <h3 className="font-semibold text-gray-900">Admin Profile</h3>
            <dl className="mt-3 space-y-2 text-sm text-gray-600">
              <div>
                <dt className="font-medium text-gray-900">Name</dt>
                <dd>{admin.name || 'Admin'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-900">Email</dt>
                <dd>{admin.email}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-900">Role</dt>
                <dd className="capitalize">{admin.role}</dd>
              </div>
            </dl>
            <Link href="/cms/profile" className="mt-4 inline-block text-blue-600 hover:underline">
              Update profile
            </Link>
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
