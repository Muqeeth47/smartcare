import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PatientDonationsFinder } from '@/features/donations/PatientDonationsFinder';
export const metadata: Metadata = { title: 'Donations & Blood Finder | SmartCare' };
export default function PatientDonationsPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center text-sm text-[var(--text-muted)]">Loading donations…</div>}>
      <PatientDonationsFinder />
    </Suspense>
  );
}
