import { PatientShell } from '@/components/layout/Shell';
import { SkeletonDashboard } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <PatientShell subtitle="Patient portal">
      <SkeletonDashboard />
    </PatientShell>
  );
}
