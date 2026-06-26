'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AuthenticatedAdmin } from '@/lib/types';

export function useAdminSession() {
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AuthenticatedAdmin | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchAdmin = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) {
          setAdmin(null);
          return;
        }

        const data = await response.json();
        setAdmin(data?.admin || null);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        setAdmin(null);
      }
    };

    fetchAdmin();

    return () => {
      controller.abort();
    };
  }, [pathname]);

  return admin;
}
