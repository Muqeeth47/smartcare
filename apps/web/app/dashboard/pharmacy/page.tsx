import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PharmacyPage } from '@/features/pharmacy/PharmacyPage';

export const metadata: Metadata = {
  title: 'Pharmacy & Dispensary | SmartCare Workspace',
  description: 'Manage prescribed medications, Jan Aushadhi generic savings, and hospital counter pickup.',
};

export default function DashboardPharmacyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center text-sm text-[var(--text-muted)]">
          Loading pharmacy workspace…
        </div>
      }
    >
      <PharmacyPage variant="workspace" />
    </Suspense>
  );
}
