import { WorkspaceShell } from '@/components/layout/Shell';
import { SkeletonWorkspace } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <WorkspaceShell subtitle="Hospital operations">
      <SkeletonWorkspace />
    </WorkspaceShell>
  );
}
