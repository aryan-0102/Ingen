'use client';

import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/common/Toast';
import PomodoroTimer from '@/components/common/PomodoroTimer';
import CommandPalette from '@/components/common/CommandPalette';

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const { toasts, showToast, dismissToast } = useToast();

  return (
    <>
      {children}
      <ToastContainer toasts={toasts} dismissToast={dismissToast} />
      <PomodoroTimer />
      <CommandPalette />
    </>
  );
}
