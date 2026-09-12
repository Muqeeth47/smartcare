import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AdminWorkspacePage } from '@/features/admin/workspace/AdminWorkspacePage';
export const metadata: Metadata = { title: 'Admin Operations', description: 'Hospital operations, rooms, and walk-in management.' };
export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading admin workspace...</div>}>
      <AdminWorkspacePage />
    </Suspense>
  );
}
