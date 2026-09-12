import { Suspense } from 'react';
import type { Metadata } from 'next';
import { VerifyRxPage } from '@/features/verify-rx/VerifyRxPage';

export const metadata: Metadata = {
  title: 'Verify Prescription | SmartCare Doctor Workspace',
  description: 'Cryptographic anti-abuse verification of hospital e-prescriptions with one-time dispensation lock.',
};

export default function DashboardVerifyRxPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center text-sm text-[var(--text-muted)]">
          Loading prescription verification...
        </div>
      }
    >
      <VerifyRxPage embedded={true} />
    </Suspense>
  );
}
