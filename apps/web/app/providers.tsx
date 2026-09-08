'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Toast } from '@/components/ui/Toast';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAppStore } from '@/lib/store/app-store';
import { DemoDB } from '@/lib/db/demo-db';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Initialize font scale from storage before Zustand rehydrates
    try {
      const savedScale = parseInt(localStorage.getItem('smartcare.fontScale') || '0', 10);
      if (savedScale !== 0 && !isNaN(savedScale)) {
        const sizes: Record<string, string> = { '-2': '13px', '-1': '14px', '0': '16px', '1': '18px', '2': '20px' };
        const px = sizes[String(savedScale)] ?? '16px';
        document.documentElement.style.setProperty('--font-base', px);
        useAppStore.getState().setFontScale(savedScale);
      }
    } catch {}

    // Use the store actions directly
    const { setQueue, setActiveAmbulance } = useAppStore.getState();

    // Initialize queue and active ambulance from demo DB
    DemoDB.fetchQueue().then(setQueue);
    const initialAmb = DemoDB.getActiveAmbulance();
    if (initialAmb) setActiveAmbulance(initialAmb);

    const unsub = DemoDB.listenToQueue(setQueue);

    // Cross-portal event handlers for presentation demo sync
    const handleAmbulanceDispatched = (e: Event) => {
      const amb = (e as CustomEvent).detail;
      setActiveAmbulance(amb || null);
    };

    const handleAmbulanceCancelled = () => {
      setActiveAmbulance(null);
    };

    const handleAppointmentCancelled = () => {
      DemoDB.fetchQueue().then((q) => {
        useAppStore.getState().setQueue(q);
      });
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'smartcare.activeAmbulance') {
        const updatedAmb = DemoDB.getActiveAmbulance();
        setActiveAmbulance(updatedAmb);
      }
    };

    window.addEventListener('smartcare:ambulance-dispatched', handleAmbulanceDispatched);
    window.addEventListener('smartcare:ambulance-cancelled', handleAmbulanceCancelled);
    window.addEventListener('smartcare:appointment-cancelled', handleAppointmentCancelled);
    window.addEventListener('storage', handleStorage);

    return () => {
      unsub();
      window.removeEventListener('smartcare:ambulance-dispatched', handleAmbulanceDispatched);
      window.removeEventListener('smartcare:ambulance-cancelled', handleAmbulanceCancelled);
      window.removeEventListener('smartcare:appointment-cancelled', handleAppointmentCancelled);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {mounted && <Toast />}
      {mounted && <BottomNav />}
    </QueryClientProvider>
  );
}
