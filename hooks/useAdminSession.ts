'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AuthenticatedAdmin } from '@/lib/types/types';

export function useAdminSession() {
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AuthenticatedAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        setAdmin(data?.admin || null);
        setIsLoading(false);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        setAdmin(null);
        setIsLoading(false);
      }
    };

    fetchAdmin();

    return () => {
      controller.abort();
    };
  }, [pathname]);

  return { admin, isLoading };
}
