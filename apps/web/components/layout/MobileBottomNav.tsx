'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  CalendarPlus,
  FileText,
  ClipboardList,
  ListOrdered,
  BarChart3,
  HeartHandshake,
  Siren,
} from 'lucide-react';
import { useSession } from '@/lib/store/app-store';
import { cn } from '@/lib/utils';

interface NavTab {
  label: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
}

const ROLE_NAV_TABS: Record<string, NavTab[]> = {
  patient: [
    { label: 'Overview', href: '/dashboard/patient', icon: LayoutDashboard, exact: true },
    { label: 'Book', href: '/dashboard/patient/apply/1', icon: CalendarPlus },
    { label: 'Passport', href: '/dashboard/patient/history', icon: FileText },
    { label: 'Visits', href: '/dashboard/patient/visits', icon: ClipboardList },
  ],
  doctor: [
    { label: 'Overview', href: '/dashboard/hospital', icon: LayoutDashboard, exact: true },
    { label: 'Queue', href: '/dashboard/queue', icon: ListOrdered },
    { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { label: 'Donations', href: '/dashboard/hospital/donations', icon: HeartHandshake },
  ],
  staff: [
    { label: 'Ops', href: '/dashboard/admin', icon: LayoutDashboard, exact: true },
    { label: 'Queue', href: '/dashboard/queue', icon: ListOrdered },
    { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { label: 'Donations', href: '/dashboard/admin/donations', icon: HeartHandshake },
  ],
};

export function MobileBottomNav() {
  const pathname = usePathname();
  const { role: sessionRole } = useSession();

  // Infer role from URL path if not set in session
  const role =
    sessionRole ||
    (pathname.startsWith('/dashboard/patient')
      ? 'patient'
      : pathname.startsWith('/dashboard/hospital')
      ? 'doctor'
      : pathname.startsWith('/dashboard/admin')
      ? 'staff'
      : 'patient');

  // Don't render on public non-dashboard pages
  const isDashboard = pathname.startsWith('/dashboard');
  if (!isDashboard) return null;

  const tabs = ROLE_NAV_TABS[role] || ROLE_NAV_TABS.patient;

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn('mobile-nav-btn', active && 'active')}
            aria-label={tab.label}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={19} className="shrink-0" />
            <span className="truncate max-w-full">{tab.label}</span>
          </Link>
        );
      })}

      {/* Persistent SOS tab */}
      <Link
        href="/ambulance"
        className={cn('mobile-nav-btn mobile-nav-btn-sos', pathname.startsWith('/ambulance') && 'active')}
        aria-label="SOS Ambulance Dispatch"
        aria-current={pathname.startsWith('/ambulance') ? 'page' : undefined}
      >
        <Siren size={19} className="shrink-0 animate-pulse text-rose-600" />
        <span className="font-extrabold text-rose-600">SOS</span>
      </Link>
    </nav>
  );
}
