'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Profile } from '@/lib/types';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import BottomTabBar from './BottomTabBar';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [user, setUser] = useState<Profile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error('Failed to fetch user', err);
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <Sidebar user={user} />

      {/* Mobile header */}
      <MobileHeader onMenuOpen={() => setMenuOpen(true)} user={user} />

      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 md:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed left-0 top-0 bottom-0 w-[260px] z-50 md:hidden backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border-r border-[var(--border)]"
            >
              <Sidebar user={user} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="md:ml-[260px] pb-20 md:pb-0 pt-14 md:pt-0 min-h-screen">
        {children}
      </main>

      {/* Mobile bottom tab bar */}
      <BottomTabBar />
    </div>
  );
}
