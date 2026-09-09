import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PatientVisitsPage } from '@/features/patient/dashboard/PatientVisitsPage';
export const metadata: Metadata = { title: 'My Visits', description: 'Your previous visits and appointments.' };
export default function VisitsPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center text-sm text-[var(--text-muted)]">Loading visits…</div>}>
      <PatientVisitsPage />
    </Suspense>
  );
}
