import { Suspense } from 'react';
import type { Metadata } from 'next';
import { MedicalHistoryPage } from '@/features/patient/history/MedicalHistoryPage';
export const metadata: Metadata = { title: 'Medical History', description: 'Your personal medical history and passport.' };
export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center text-sm text-[var(--text-muted)]">Loading medical history…</div>}>
      <MedicalHistoryPage />
    </Suspense>
  );
}
