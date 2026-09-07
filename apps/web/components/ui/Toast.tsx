'use client';

import { useAppStore } from '@/lib/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Info } from 'lucide-react';

export function Toast() {
  const { toastMessage, toastType } = useAppStore(useShallow((s) => ({
    toastMessage: s.toastMessage,
    toastType: s.toastType,
  })));

  if (!toastMessage) return null;

  const Icon = toastType === 'success' ? CheckCircle : toastType === 'error' ? XCircle : Info;

  return (
    <div
      data-toast-region
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[600] pointer-events-none"
    >
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius)]',
          'bg-[var(--surface-raised)] border shadow-[var(--shadow-card)]',
          'text-sm font-medium whitespace-nowrap pointer-events-auto',
          'animate-in fade-in slide-in-from-bottom-2 duration-200',
          toastType === 'success' && 'border-[var(--green)] text-[var(--green)]',
          toastType === 'error' && 'border-[var(--red)] text-[var(--red)]',
          toastType === 'info' && 'border-[var(--line)] text-[var(--text)]'
        )}
      >
        <Icon size={15} />
        {toastMessage}
      </div>
    </div>
  );
}
