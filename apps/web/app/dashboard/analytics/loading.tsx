import { WorkspaceShell } from '@/components/layout/Shell';
import { SkeletonStats, SkeletonCard } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <WorkspaceShell subtitle="Analytics">
      <div className="py-6 space-y-5">
        <SkeletonStats cols={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonCard className="h-48" />
          <SkeletonCard className="h-48" />
        </div>
      </div>
    </WorkspaceShell>
  );
}
