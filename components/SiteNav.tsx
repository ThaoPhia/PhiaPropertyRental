'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminSession } from '@/hooks/useAdminSession';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { admin } = useAdminSession();
  const propertiesActive = pathname.startsWith('/properties');
  const adminHandle = admin?.email?.split('@')[0] ?? '';
  const adminInitials = adminHandle
    .split(/[.\-_]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'A';

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
            alt="PhiaRental"
            width={300}
            height={76}
            className="h-14 md:h-16 w-auto"
            priority
          />
          <span className="text-xl md:text-2xl font-semibold tracking-tight text-blue-700">
            PhiaRental
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/properties"
            className={propertiesActive ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-blue-600'}
          >
            Browse Properties
          </Link>
          {admin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                      type="button"
                      className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 cursor-pointer"
                      aria-label="Open user menu"
                  >
                    <Avatar className="size-8" size="default">
                      <AvatarFallback className="bg-blue-700 text-xs font-semibold text-white">
                        {adminInitials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-white/100 backdrop-blur-none supports-[backdrop-filter]:bg-white"
                >
                  <DropdownMenuItem asChild>
                    <Link href="/cms">CMS</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/cms/applications">Applications</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        void handleLogout();
                      }}
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          )}
        </div>
      </div>
    </nav>
  );
}
