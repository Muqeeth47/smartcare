import { Suspense } from 'react';
import type { Metadata } from 'next';
import { DonationsPage } from '@/features/donations/DonationsPage';
export const metadata: Metadata = { title: 'Admin Donations' };
export default function AdminDonationsPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center text-sm text-[var(--text-muted)]">Loading donations…</div>}>
      <DonationsPage role="staff" />
    </Suspense>
  );
}
