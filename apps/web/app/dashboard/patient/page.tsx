import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PatientDashboardPage } from '@/features/patient/dashboard/PatientDashboardPage';

export const metadata: Metadata = {
  title: 'Patient Dashboard | SmartCare',
  description: 'Manage your appointments, visits, and medical history.',
};

export default function PatientDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen p-8 text-center text-sm text-[var(--text-muted)]">Loading dashboard...</div>}>
      <PatientDashboardPage />
    </Suspense>
  );
}

