'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SiteNav() {
  const pathname = usePathname();
  const propertiesActive = pathname.startsWith('/properties');

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
        <div className="space-x-4">
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
