'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SiteNav() {
  const pathname = usePathname();
  const propertiesActive = pathname.startsWith('/properties');

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-blue-600">
          PhiaRentalLLC
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
