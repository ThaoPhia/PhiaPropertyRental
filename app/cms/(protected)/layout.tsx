import { redirect } from 'next/navigation';
import { getAuthenticatedAdminFromCookies } from '@/lib/auth';

export default async function CMSProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await getAuthenticatedAdminFromCookies();

  if (!admin) {
    redirect('/cms/login');
  }

  return children;
}
