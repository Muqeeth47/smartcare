import { Suspense } from 'react';
import type { Metadata } from 'next';
import { LoginPage } from '@/features/auth/LoginPage';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your SmartCare account — patient, doctor, or hospital operations.',
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
};

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center text-sm text-[var(--text-muted)]">Loading sign in…</div>}>
      <LoginPage />
    </Suspense>
  );
}
