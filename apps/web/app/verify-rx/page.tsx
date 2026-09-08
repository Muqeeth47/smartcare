import { Suspense } from 'react';
import type { Metadata } from 'next';
import { VerifyRxPage } from '@/features/verify-rx/VerifyRxPage';

export const metadata: Metadata = {
  title: 'Verify Prescription | SmartCare Digital Health',
  description: 'Cryptographic anti-abuse verification of hospital e-prescriptions with one-time dispensation lock.',
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-sm font-semibold text-slate-500">Loading prescription verification...</div>
        </div>
      }
    >
      <VerifyRxPage />
    </Suspense>
  );
}
