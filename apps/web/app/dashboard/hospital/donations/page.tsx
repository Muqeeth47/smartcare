import { Suspense } from 'react';
import type { Metadata } from 'next';
import { DonationsPage } from '@/features/donations/DonationsPage';
export const metadata: Metadata = { title: 'Hospital Donations' };
export default function HospitalDonationsPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center text-sm text-[var(--text-muted)]">Loading donations…</div>}>
      <DonationsPage role="doctor" />
    </Suspense>
  );
}
