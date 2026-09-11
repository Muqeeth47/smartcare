import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PharmacyPage } from '@/features/pharmacy/PharmacyPage';

export const metadata: Metadata = {
  title: 'My Pharmacy & Prescriptions | SmartCare Patient Portal',
  description: 'Manage prescribed medications, Jan Aushadhi generic savings, and hospital counter pickup.',
};

export default function PatientPharmacyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center text-sm text-[var(--text-muted)]">
          Loading your pharmacy orders…
        </div>
      }
    >
      <PharmacyPage variant="patient" />
    </Suspense>
  );
}
