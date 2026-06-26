'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminSession } from '@/hooks/useAdminSession';

export default function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const admin = useAdminSession();
  const propertiesActive = pathname.startsWith('/properties');
  const isCmsActive = pathname.startsWith('/cms');

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/cms/login');
    router.refresh();
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-[92rem] mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
        <Link href="/" className="inline-flex items-center gap-3 md:gap-4">
          <Image
            src="/images/logos/logo.png"
            alt="Phia Rental LLC"
            width={300}
            height={76}
            className="h-14 md:h-16 w-auto"
            priority
          />
          <span className="text-xl md:text-2xl font-semibold tracking-tight text-blue-700">
            Phia Rental LLC
          </span>
        </Link>
        <div className="flex items-center gap-4">
          {admin && (
            <div className="inline-flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2">
              <Link
                href="/cms"
                className={isCmsActive ? 'text-blue-700 font-semibold' : 'text-blue-700 hover:text-blue-800 font-medium'}
              >
                CMS
              </Link>
              <span className="h-4 w-px bg-blue-200" aria-hidden="true"></span>
              <button
                onClick={handleLogout}
                className="text-blue-700 hover:text-blue-800 font-medium cursor-pointer"
              >
                Log out
              </button>
            </div>
          )}
          <Link
            href="/properties"
            className={propertiesActive ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-blue-600'}
          >
            Browse Properties
          </Link>
        </div>
      </div>
    </nav>
  );
}
