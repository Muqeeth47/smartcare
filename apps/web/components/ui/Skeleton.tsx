import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

/** Generic shimmer block */
export function Skeleton({ className, style }: SkeletonProps) {
  return <div className={cn('skeleton', className)} style={style} aria-hidden="true" />;
}

/** Single text line */
export function SkeletonText({ className, width = '100%' }: { className?: string; width?: string | number }) {
  return (
    <span
      className={cn('skeleton skeleton-text inline-block', className)}
      style={{ width }}
      aria-hidden="true"
    />
  );
}

/** Card with a title line + two body lines */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('p-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] space-y-3', className)}>
      <Skeleton className="h-10 w-10 skeleton-circle" />
      <SkeletonText width="55%" />
      <SkeletonText width="80%" />
      <SkeletonText width="65%" />
    </div>
  );
}

/** 4-column stat row */
export function SkeletonStats({ cols = 4 }: { cols?: number }) {
  return (
    <div className={`grid gap-3 ${cols === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'}`}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] space-y-2">
          <SkeletonText width="50%" />
          <SkeletonText width="35%" className="h-7" />
          <SkeletonText width="70%" />
        </div>
      ))}
    </div>
  );
}

/** Full patient dashboard skeleton */
export function SkeletonDashboard() {
  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6" aria-label="Loading dashboard" aria-busy="true">
      {/* Header */}
      <div className="border-b-2 border-[var(--line)] pb-3 mb-5 space-y-2">
        <SkeletonText width="30%" />
        <SkeletonText width="45%" className="h-8" />
        <SkeletonText width="60%" />
      </div>
      {/* Banner */}
      <div className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] flex justify-between items-center gap-4">
        <div className="space-y-2 flex-1">
          <SkeletonText width="20%" />
          <SkeletonText width="40%" className="h-6" />
          <SkeletonText width="60%" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl shrink-0" />
      </div>
      {/* Stats */}
      <SkeletonStats />
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

/** Workspace/doctor dashboard skeleton */
export function SkeletonWorkspace() {
  return (
    <div className="py-6 space-y-6" aria-label="Loading workspace" aria-busy="true">
      <div className="border-b-2 border-[var(--line)] pb-3 mb-5 space-y-2">
        <SkeletonText width="25%" />
        <SkeletonText width="40%" className="h-8" />
      </div>
      <SkeletonStats cols={4} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
