import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ClipboardList } from 'lucide-react';

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
  compact?: boolean;
}

/**
 * EmptyState — shown when a list has no items.
 * Accepts an icon, title, optional description, and optional CTA.
 */
export function EmptyState({
  icon: Icon = ClipboardList,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8 px-4 gap-3' : 'py-14 px-6 gap-4',
        className
      )}
      role="status"
      aria-label={title}
    >
      {/* Icon bubble */}
      <span
        className={cn(
          'flex items-center justify-center rounded-2xl text-[var(--teal)] bg-[var(--mint)]',
          compact ? 'w-12 h-12' : 'w-16 h-16'
        )}
      >
        <Icon size={compact ? 24 : 32} strokeWidth={1.5} />
      </span>

      {/* Text */}
      <div className="space-y-1">
        <p className={cn('font-bold text-[var(--text)]', compact ? 'text-sm' : 'text-base')}>
          {title}
        </p>
        {description && (
          <p className="text-sm text-[var(--text-muted)] max-w-[30ch] mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* CTA */}
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className={cn(
              'inline-flex items-center gap-1.5 font-bold text-white rounded-xl no-underline transition-all hover:brightness-105',
              compact ? 'px-4 py-2 text-xs' : 'px-5 py-2.5 text-sm'
            )}
            style={{ background: 'var(--teal)', boxShadow: '0 4px 12px rgba(15,92,168,.25)' }}
          >
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className={cn(
              'inline-flex items-center gap-1.5 font-bold text-white rounded-xl transition-all hover:brightness-105 cursor-pointer',
              compact ? 'px-4 py-2 text-xs' : 'px-5 py-2.5 text-sm'
            )}
            style={{ background: 'var(--teal)', boxShadow: '0 4px 12px rgba(15,92,168,.25)' }}
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
