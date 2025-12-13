'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export const SignOutButton = () => {
  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <button
      onClick={handleSignOut}
      className="text-text-secondary hover:text-text-primary transition-colors p-2"
      aria-label="Logout"
    >
      <LogOut className="w-5 h-5" />
    </button>
  );
};


