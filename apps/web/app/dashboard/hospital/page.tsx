import { Suspense } from 'react';
import type { Metadata } from 'next';
import { HospitalWorkspacePage } from '@/features/hospital/workspace/HospitalWorkspacePage';
export const metadata: Metadata = { title: 'Hospital Workspace', description: 'Manage the hospital queue, clinicians, and room status.' };
export default function HospitalDashboard() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading hospital workspace...</div>}>
      <HospitalWorkspacePage />
    </Suspense>
  );
}
