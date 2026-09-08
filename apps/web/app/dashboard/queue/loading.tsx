import { WorkspaceShell } from '@/components/layout/Shell';
import { SkeletonStats, SkeletonCard } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <WorkspaceShell subtitle="Live queue">
      <div className="py-6 space-y-5">
        <SkeletonStats cols={4} />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] flex items-center gap-4">
              <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <span className="skeleton skeleton-text inline-block" style={{ width: '40%' }} />
                <span className="skeleton skeleton-text inline-block" style={{ width: '60%' }} />
              </div>
              <div className="skeleton h-8 w-20 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </WorkspaceShell>
  );
}
