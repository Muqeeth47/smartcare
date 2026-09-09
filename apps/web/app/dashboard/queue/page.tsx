import { Suspense } from 'react';
import type { Metadata } from 'next';
import { QueueWorkspacePage } from '@/features/hospital/queue/QueueWorkspacePage';
export const metadata: Metadata = { title: 'Queue Workspace', description: 'Live patient queue management.' };
export default function QueuePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center text-sm text-[var(--text-muted)]">Loading queue…</div>}>
      <QueueWorkspacePage />
    </Suspense>
  );
}
