'use client';

import { useRouter } from 'next/navigation';

export default function CMSLogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/cms/login');
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded"
    >
      Log out
    </button>
  );
}
