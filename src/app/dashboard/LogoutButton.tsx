'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
    } catch {
      // Even on network error, clear client-side state and redirect
    }
    router.push('/login');
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-950/20 transition-all text-xs font-medium cursor-pointer"
    >
      <LogOut className="w-4 h-4" />
      <span>Sign Out</span>
    </button>
  );
}
