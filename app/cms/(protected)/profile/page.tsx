import Link from 'next/link';
import { redirect } from 'next/navigation';
import AdminProfileForm from '@/components/AdminProfileForm';
import { getAuthenticatedAdminFromCookies } from '@/lib/auth';

export default async function CMSProfilePage() {
  const admin = await getAuthenticatedAdminFromCookies();

  if (!admin) {
    redirect('/cms/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[92rem] mx-auto px-4 md:px-6 py-8">
        <div className="mb-6">
          <Link href="/cms" className="text-blue-600 hover:underline inline-block">
            ← Back to CMS
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
          <p className="text-sm text-gray-600 mt-1">
            Update your name and password for this CMS account.
          </p>
        </div>

        <AdminProfileForm admin={admin} />
      </div>
    </div>
  );
}
