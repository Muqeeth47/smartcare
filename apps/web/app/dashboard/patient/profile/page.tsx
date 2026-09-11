import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PatientDashboardPage } from '@/features/patient/dashboard/PatientDashboardPage';

export const metadata: Metadata = {
  title: 'Patient Profile & Preferences | SmartCare',
  description: 'View and manage personal health identity, contact details, and clinical preferences.',
};

export default function PatientProfileRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen p-8 text-center text-sm text-[var(--text-muted)]">Loading profile...</div>}>
      <PatientDashboardPage initialTab="profile" />
    </Suspense>
  );
}
