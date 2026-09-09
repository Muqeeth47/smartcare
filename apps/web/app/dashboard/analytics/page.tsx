import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AnalyticsDashboardPage } from '@/features/analytics/AnalyticsDashboardPage';
export const metadata: Metadata = { title: 'Analytics', description: 'Queue analytics and operational insights.' };
export default function Analytics() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center text-sm text-[var(--text-muted)]">Loading analytics…</div>}>
      <AnalyticsDashboardPage />
    </Suspense>
  );
}
