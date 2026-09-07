'use client';

import { useAppStore, useSession } from '@/lib/store/app-store';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarPlus,
  FileText,
  ClipboardList,
  LogOut,
  ListOrdered,
  BarChart3,
  HeartHandshake,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Role Nav Config (matching old project MOBILE_NAV exactly) ───────────────

const NAV_CONFIG = {
  patient: [
    { label: 'Overview', href: '/dashboard/patient',         icon: LayoutDashboard },
    { label: 'Book',     href: '/dashboard/patient/apply/1', icon: CalendarPlus    },
    { label: 'History',  href: '/dashboard/patient/history', icon: FileText        },
    { label: 'Visits',   href: '/dashboard/patient/visits',  icon: ClipboardList   },
  ],
  doctor: [
    { label: 'Overview',   href: '/dashboard/hospital',           icon: LayoutDashboard },
    { label: 'Queue',      href: '/dashboard/queue',               icon: ListOrdered     },
    { label: 'Analytics',  href: '/dashboard/analytics',           icon: BarChart3       },
    { label: 'Donations',  href: '/dashboard/hospital/donations',  icon: HeartHandshake  },
  ],
  staff: [
    { label: 'Operations', href: '/dashboard/admin',               icon: LayoutDashboard },
    { label: 'Queue',      href: '/dashboard/queue',               icon: ListOrdered     },
    { label: 'Analytics',  href: '/dashboard/analytics',           icon: BarChart3       },
    { label: 'Donations',  href: '/dashboard/admin/donations',     icon: HeartHandshake  },
  ],
};

export function BottomNav() {
  const { isLogged, role } = useSession();
  const logout = useAppStore((s) => s.logout);
  const router  = useRouter();
  const pathname = usePathname();

  if (!isLogged || !role || !(role in NAV_CONFIG)) return null;

  const navItems = NAV_CONFIG[role as keyof typeof NAV_CONFIG];

  const isActive = (href: string) => {
    // Exact match for root dashboard pages; prefix match elsewhere
    if (
      href === '/dashboard/patient' ||
      href === '/dashboard/hospital' ||
      href === '/dashboard/admin'
    ) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav
      data-bottom-nav
      aria-label="Mobile navigation"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-[350] lg:hidden',
        'flex items-stretch h-16',
        'bg-[var(--surface)] border-t border-[var(--line)]'
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {navItems.map((item) => {
        const Icon   = item.icon;
        const active = isActive(item.href);
        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'mobile-nav-btn relative flex flex-col items-center justify-center gap-1 flex-1',
              'text-[0.62rem] font-semibold tracking-wide transition-colors',
              'min-h-[44px] px-1',
              active
                ? 'active text-[var(--teal)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            )}
          >
            {active && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2.5px] bg-[var(--teal)] rounded-full" />
            )}
            <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
            <span>{item.label}</span>
          </button>
        );
      })}

      {/* Sign out */}
      <button
        onClick={handleLogout}
        aria-label="Sign out"
        className={cn(
          'mobile-nav-btn flex flex-col items-center justify-center gap-1 flex-1',
          'text-[0.62rem] font-semibold tracking-wide min-h-[44px] px-1',
          'text-[var(--text-muted)] hover:text-[var(--red)] transition-colors'
        )}
      >
        <LogOut size={20} strokeWidth={1.8} />
        <span>Sign out</span>
      </button>
    </nav>
  );
}
