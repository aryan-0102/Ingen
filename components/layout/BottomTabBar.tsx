'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Library,
  CalendarDays,
  Bot,
} from 'lucide-react';

const tabs = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/classes', icon: BookOpen, label: 'Classes' },
  { href: '/library', icon: Library, label: 'Library' },
  { href: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { href: '/tutor', icon: Bot, label: 'Tutor' },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="flex md:hidden fixed bottom-0 left-0 right-0 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-t border-[var(--border)] z-40">
      {tabs.map((tab) => {
        const isActive =
          pathname === tab.href ||
          (tab.href !== '/dashboard' && pathname.startsWith(tab.href));
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
              isActive ? 'text-cyan-500' : 'text-gray-400'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
