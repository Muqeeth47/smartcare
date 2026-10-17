'use client';

import { usePathname, useSearchParams } from 'next/navigation';
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
import { COMMAND_SECTIONS, DEFAULT_COMMAND_SECTION, commandHref } from '@/lib/nav-sections';

const BOTTOM_COMMAND_IDS = ['summary', 'telemetry', 'redistribution'];

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
    { label: 'Donate', href: '/dashboard/hospital/donations', icon: HeartHandshake },
  ],
  // The three most-used command pages. Everything else is in the menu drawer.
  staff: [
    ...COMMAND_SECTIONS.filter((s) => BOTTOM_COMMAND_IDS.includes(s.id)).map((s) => ({
      label: s.shortLabel,
      href: commandHref(s.id),
      icon: s.icon,
    })),
    { label: 'Queue', href: '/dashboard/queue', icon: ListOrdered },
  ],
};

/** A tab whose address carries a query (like ?commandTab=telemetry) is active only when the query matches too. */
function isTabActive(tab: NavTab, pathname: string, searchParams: URLSearchParams | null): boolean {
  const [base, query] = tab.href.split('?');
  if (!query) return tab.exact ? pathname === base : pathname.startsWith(base);
  if (pathname !== base) return false;
  const wanted = new URLSearchParams(query);
  const wantedSection = wanted.get('commandTab');
  const currentSection = searchParams?.get('commandTab') ?? DEFAULT_COMMAND_SECTION;
  return wantedSection === currentSection;
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
        const active = isTabActive(tab, pathname, searchParams);
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
        href="/dashboard/ambulance"
        className={cn('mobile-nav-btn mobile-nav-btn-sos', pathname.startsWith('/dashboard/ambulance') && 'active')}
        aria-label="SOS Ambulance Dispatch"
        aria-current={pathname.startsWith('/dashboard/ambulance') ? 'page' : undefined}
      >
        <Siren size={19} className="shrink-0 text-rose-600" />
        <span className="font-extrabold text-rose-600">SOS</span>
      </Link>
    </nav>
  );
}
