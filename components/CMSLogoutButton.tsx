'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function CMSLogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/cms/login');
    router.refresh();
  };

  return (
    <Button
      onClick={handleLogout}
      variant="secondary"
      className="h-9 px-4 text-gray-800"
    >
      Log out
    </Button>
  );
}
