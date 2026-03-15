'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Library,
  CalendarDays,
  Bot,
  Layers,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { Profile } from '@/lib/types';

interface SidebarProps {
  user: Profile | null;
}

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/classes', icon: BookOpen, label: 'Classes' },
  { href: '/library', icon: Library, label: 'Library' },
  { href: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { href: '/tutor', icon: Bot, label: 'AI Tutor' },
  { href: '/flashcards', icon: Layers, label: 'Flashcards' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

function getInitials(name: string | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-[260px] backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-r border-[var(--border)] z-40">
      {/* Logo */}
      <div className="px-6 py-5">
        <div className="flex items-center gap-3">
          <svg
            width="36"
            height="36"
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="36" y2="36">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
            </defs>
            <rect width="36" height="36" rx="10" fill="url(#logoGrad)" />
            <path
              d="M18 10L8 16L18 22L28 16L18 10Z"
              fill="white"
              fillOpacity="0.9"
            />
            <path
              d="M8 16V22L18 28L28 22V16"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M28 16V24"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <div>
            <h1 className="text-lg font-bold text-[var(--foreground)]">
              InGen
            </h1>
            <p className="text-xs text-[var(--muted)]">
              Learn smarter, together
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 border-l-2 border-cyan-500'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-4 py-4 border-t border-[var(--border)]">
        {/* User info */}
        {user && (
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
              {getInitials(user.full_name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)] truncate">
                {user.full_name}
              </p>
              <p className="text-xs text-[var(--muted)] truncate">
                {user.email}
              </p>
            </div>
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </aside>
  );
}
