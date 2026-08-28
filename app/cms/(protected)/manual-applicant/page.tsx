import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthenticatedAdminFromCookies } from '@/lib/auth';
import ManualApplicantForm from '@/components/cms/ManualApplicantForm';

export default async function ManualApplicantPage() {
  const admin = await getAuthenticatedAdminFromCookies();

  if (!admin) {
    redirect('/cms/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[92rem] mx-auto px-4 md:px-6 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manual Applicant Assignment</h1>
            <p className="text-sm text-gray-600 mt-1">
              Signed in as {admin.name || 'Admin'} ({admin.email})
            </p>
          </div>
          <Link href="/cms" className="text-blue-600 hover:underline">
            ← Back to CMS
          </Link>
        </div>

        <ManualApplicantForm />
      </div>
    </div>
  );
}
