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

    // Use the store action directly to avoid it being a dependency that changes
    const setQueue = useAppStore.getState().setQueue;

    // Initialize queue from demo DB and listen for updates
    DemoDB.fetchQueue().then(setQueue);
    const unsub = DemoDB.listenToQueue(setQueue);

    return () => {
      unsub();
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
