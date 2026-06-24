'use client';

import { useEffect, useState } from 'react';
import { AuthenticatedAdmin } from '@/lib/types';

export function useAdminSession() {
  const [admin, setAdmin] = useState<AuthenticatedAdmin | null>(null);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const response = await fetch('/api/auth/me');

        if (!response.ok) {
          setAdmin(null);
          return;
        }

        const data = await response.json();
        setAdmin(data?.admin || null);
      } catch {
        setAdmin(null);
      }
    };

    fetchAdmin();
  }, []);

  return admin;
}
