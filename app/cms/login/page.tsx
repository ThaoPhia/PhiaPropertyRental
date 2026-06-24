import { redirect } from 'next/navigation';
import CMSLoginForm from '@/components/CMSLoginForm';
import { getAuthenticatedAdminFromCookies } from '@/lib/auth';

const ADMIN_EMAIL = 'thoj.phia@gmail.com';

export default async function CMSLoginPage() {
  const admin = await getAuthenticatedAdminFromCookies();

  if (admin) {
    redirect('/cms');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">CMS Login</h1>
        <p className="text-gray-600 mb-6">
          Sign in with your admin email and password to access the CMS.
        </p>
        <CMSLoginForm defaultEmail={ADMIN_EMAIL} />
      </div>
    </div>
  );
}
