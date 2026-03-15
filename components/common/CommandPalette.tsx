'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LayoutDashboard,
  BookOpen,
  Library,
  CalendarDays,
  Bot,
  Layers,
  Settings,
} from 'lucide-react';

interface PageItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const pages: PageItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { name: 'Classes', href: '/classes', icon: <BookOpen className="w-4 h-4" /> },
  { name: 'Library', href: '/library', icon: <Library className="w-4 h-4" /> },
  { name: 'Calendar', href: '/calendar', icon: <CalendarDays className="w-4 h-4" /> },
  { name: 'AI Tutor', href: '/tutor', icon: <Bot className="w-4 h-4" /> },
  { name: 'Flashcards', href: '/flashcards', icon: <Layers className="w-4 h-4" /> },
  { name: 'Settings', href: '/settings', icon: <Settings className="w-4 h-4" /> },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const filteredPages = pages.filter((page) =>
    page.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleNavigate = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery('');
      router.push(href);
    },
    [router]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
            onClick={() => {
              setOpen(false);
              setQuery('');
            }}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[200] flex items-start justify-center pt-[20vh]"
          >
            <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
                <Search className="w-5 h-5 text-[var(--muted)]" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search pages..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none"
                />
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-medium text-[var(--muted)] bg-gray-100 dark:bg-gray-800 rounded-md border border-[var(--border)]">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[300px] overflow-y-auto p-2">
                {filteredPages.length > 0 ? (
                  <div>
                    <p className="px-3 py-1.5 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                      Pages
                    </p>
                    {filteredPages.map((page) => (
                      <button
                        key={page.href}
                        onClick={() => handleNavigate(page.href)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-[var(--foreground)] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <span className="text-[var(--muted)]">{page.icon}</span>
                        {page.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="px-3 py-6 text-center text-sm text-[var(--muted)]">
                    No results found.
                  </p>
                )}

                {/* Recent section (empty state) */}
                {!query && (
                  <div className="mt-2">
                    <p className="px-3 py-1.5 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                      Recent
                    </p>
                    <p className="px-3 py-3 text-sm text-[var(--muted)]">
                      No recent pages.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
