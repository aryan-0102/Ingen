'use client';

import { Menu } from 'lucide-react';
import { Profile } from '@/lib/types';

interface MobileHeaderProps {
  onMenuOpen: () => void;
  user: Profile | null;
}

function getInitials(name: string | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function MobileHeader({ onMenuOpen, user }: MobileHeaderProps) {
  return (
    <header className="flex md:hidden fixed top-0 left-0 right-0 h-14 items-center justify-between px-4 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-[var(--border)] z-40">
      {/* Hamburger */}
      <button
        onClick={onMenuOpen}
        className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Logo */}
      <span className="text-lg font-bold text-[var(--foreground)]">InGen</span>

      {/* User avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
        {getInitials(user?.full_name)}
      </div>
    </header>
  );
}
