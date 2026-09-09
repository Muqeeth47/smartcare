import { Suspense } from 'react';
import type { Metadata } from 'next';
import { DonationFinderPage } from '@/features/donations/DonationFinderPage';
export const metadata: Metadata = { title: 'Donations | SmartCare', description: 'Blood and organ donation community support.' };
export default function DonatePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center text-sm text-[var(--text-muted)]">Loading donations…</div>}>
      <DonationFinderPage />
    </Suspense>
  );
}
