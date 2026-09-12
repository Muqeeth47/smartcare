import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AmbulancePage } from '@/features/ambulance/AmbulancePage';

export const metadata: Metadata = {
  title: 'Emergency Ambulance Dispatch | SmartCare Workspace',
  description: 'Instant GPS ambulance dispatch with trauma centre integration and ICU bed reservation.',
};

export default function DashboardAmbulancePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center text-sm text-[var(--text-muted)]">
          Loading ambulance dispatch…
        </div>
      }
    >
      <AmbulancePage embedded={true} />
    </Suspense>
  );
}
