'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  X,
  PanelLeftClose,
  PanelLeftOpen,
  HeartPulse,
  LayoutDashboard,
  CalendarPlus,
  FileText,
  ClipboardCheck,
  UserRound,
  HeartHandshake,
  CircleHelp,
  LogOut,
  ListOrdered,
  BarChart3,
  Pill,
  Siren,
  ShieldCheck,
  ShieldAlert,
  Truck,
  MapPin,
  Activity,
  Building2,
  Stethoscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession, useAppStore } from '@/lib/store/app-store';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface SidebarSection {
  title?: string;
  badge?: string;
  items: SidebarItem[];
}

interface RoleConfig {
  sections: SidebarSection[];
  secondary: SidebarItem[];
}

const SIDEBAR_ITEMS: Record<string, RoleConfig> = {
  patient: {
    sections: [
      {
        items: [
          { label: 'Overview', href: '/dashboard/patient', icon: LayoutDashboard },
          { label: 'Book appointment', href: '/dashboard/patient/apply/1', icon: CalendarPlus },
          { label: 'Medical History', href: '/dashboard/patient/history', icon: FileText },
          { label: 'Previous visits', href: '/dashboard/patient/visits', icon: ClipboardCheck },
          { label: 'Profile', href: '/dashboard/patient?tab=profile', icon: UserRound },
        ],
      },
    ],
    secondary: [
      { label: 'Pharmacy & Orders', href: '/dashboard/patient/pharmacy', icon: Pill },
      { label: 'Ambulance (SOS)', href: '/dashboard/ambulance', icon: Siren },
      { label: 'Donations', href: '/dashboard/patient/donations', icon: HeartHandshake },
      { label: 'Help', href: '/about', icon: CircleHelp },
    ],
  },
  doctor: {
    sections: [
      {
        title: 'Module 1: Patient & Doctor',
        badge: 'Clinical',
        items: [
          { label: 'Clinical Queue & eRx', href: '/dashboard/hospital?module=clinical', icon: Stethoscope },
          { label: 'Queue Workspace', href: '/dashboard/queue', icon: ListOrdered },
          { label: 'Verify Prescription', href: '/dashboard/verify-rx', icon: ShieldCheck },
          { label: 'Clinical Analytics', href: '/dashboard/analytics', icon: BarChart3 },
        ],
      },
      {
        title: 'Module 2: Hospital & State Mesh',
        badge: 'Supply',
        items: [
          { label: 'Medicine Stock Register', href: '/dashboard/hospital?module=supply&supplyTab=inventory', icon: Pill },
          { label: 'SOS Shortage Desk', href: '/dashboard/hospital?module=supply&supplyTab=shortage', icon: ShieldAlert },
          { label: 'Inward Dispatches (OTP)', href: '/dashboard/hospital?module=supply&supplyTab=inward', icon: Truck },
        ],
      },
    ],
    secondary: [
      { label: 'Help', href: '/about', icon: CircleHelp },
    ],
  },
  staff: {
    sections: [
      {
        title: 'State Health Command',
        badge: 'MoHFW Mesh',
        items: [
          { label: 'Command Overview', href: '/dashboard/admin?adminTab=command&commandTab=summary', icon: Building2 },
          { label: 'Shortage Heat Map', href: '/dashboard/admin?adminTab=command&commandTab=heatmap', icon: MapPin },
          { label: 'AI Redistribution', href: '/dashboard/admin?adminTab=command&commandTab=redistribution', icon: Truck },
          { label: 'Emergency SOS Escalation', href: '/dashboard/admin?adminTab=command&commandTab=escalation', icon: ShieldAlert },
          { label: 'Surge Forecaster', href: '/dashboard/admin?adminTab=command&commandTab=federated', icon: Activity },
          { label: 'Logistics Manifest', href: '/dashboard/admin?adminTab=command&commandTab=manifest', icon: Truck },
        ],
      },
    ],
    secondary: [
      { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
      { label: 'Help', href: '/about', icon: CircleHelp },
    ],
  },
};

function getRoleFromPath(pathname: string, sessionRole?: string): string {
  if (sessionRole) return sessionRole;
  if (pathname.startsWith('/dashboard/patient')) return 'patient';
  if (pathname.startsWith('/dashboard/hospital') || pathname.startsWith('/dashboard/queue') || pathname.startsWith('/dashboard/verify')) return 'doctor';
  if (pathname.startsWith('/dashboard/admin')) return 'staff';
  return 'patient';
}

function checkActive(itemHref: string, pathname: string, searchParams?: URLSearchParams | null): boolean {
  if (itemHref.includes('?')) {
    const [base, query] = itemHref.split('?');
    if (pathname !== base) return false;
    if (!searchParams) return false;
    const itemParams = new URLSearchParams(query);
    let match = true;
    itemParams.forEach((val, key) => {
      if (searchParams.get(key) !== val) {
        match = false;
      }
    });
    return match;
  }
  if (itemHref === '/dashboard/patient' || itemHref === '/dashboard/hospital' || itemHref === '/dashboard/admin') {
    if (searchParams && searchParams.toString().length > 0) return false;
    return pathname === itemHref;
  }
  return pathname === itemHref || pathname.startsWith(itemHref + '/');
}

/**
 * Desktop Left Sidebar (`.workspace-tabs.desktop-sidebar`)
 * Rendered sticky on the left column in `.provider-shell`.
 */
export function DesktopSidebar({
  onToggleCollapse,
  isCollapsed,
}: {
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { role: sessionRole } = useSession();
  const logout = useAppStore((s) => s.logout);

  const role = getRoleFromPath(pathname, sessionRole);
  const config = SIDEBAR_ITEMS[role] || SIDEBAR_ITEMS.patient;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className="workspace-tabs desktop-sidebar" aria-label="Workspace navigation">
      {/* Header bar with collapse/expand toggle */}
      <div className="sidebar-header flex items-center justify-between px-1.5 pb-2 mb-1 border-b border-[var(--line)] w-full">
        <span className="sidebar-header-label text-[10px] font-extrabold tracking-wider uppercase text-[var(--muted)]">
          Navigation
        </span>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="sidebar-collapse-btn flex items-center justify-center w-7 h-7 rounded-lg text-[var(--muted)] hover:text-[var(--teal)] hover:bg-[var(--mint)] transition-colors cursor-pointer"
          >
            {isCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>
        )}
      </div>

      {/* Sections (e.g. Module 1 vs Module 2 for Doctor) */}
      {config.sections.map((section, sIdx) => (
        <div key={sIdx} className="sidebar-section w-full">
          {section.title && (
            <div className="sidebar-section-header px-1.5 pt-2 pb-1 flex items-center justify-between">
              <span className="sidebar-section-title text-[9px] font-black uppercase tracking-wider text-[var(--teal)] truncate">
                {section.title}
              </span>
              {section.badge && (
                <span className="sidebar-section-badge text-[8px] font-extrabold uppercase px-1 py-0.5 rounded bg-[var(--teal)]/10 text-[var(--teal)]">
                  {section.badge}
                </span>
              )}
            </div>
          )}

          <div className="flex flex-col gap-0.5 w-full">
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = checkActive(item.href, pathname, searchParams);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={active ? 'active' : ''}
                  aria-current={active ? 'page' : undefined}
                  title={item.label}
                >
                  <Icon size={16} className="shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {sIdx < config.sections.length - 1 && <div className="nav-divider" />}
        </div>
      ))}

      {config.secondary.length > 0 && (
        <>
          <div className="nav-divider" />
          <div className="flex flex-col gap-0.5 w-full">
            {config.secondary.map((item) => {
              const Icon = item.icon;
              const active = checkActive(item.href, pathname, searchParams);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={active ? 'active' : ''}
                  aria-current={active ? 'page' : undefined}
                  title={item.label}
                >
                  <Icon size={16} className="shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </>
      )}

      <button
        type="button"
        onClick={handleLogout}
        className="signout-btn mt-auto"
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut size={16} className="shrink-0" />
        <span>Sign out</span>
      </button>
    </nav>
  );
}

/**
 * Mobile Drawer (`.workspace-tabs.mobile-drawer`)
 * Slides out on mobile viewports when the Topbar menu is clicked.
 */
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { role: sessionRole } = useSession();
  const logout = useAppStore((s) => s.logout);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const role = getRoleFromPath(pathname, sessionRole);
  const config = SIDEBAR_ITEMS[role] || SIDEBAR_ITEMS.patient;

  // Escape key handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handler);
      closeBtnRef.current?.focus();
    }
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleLogout = () => {
    onClose();
    logout();
    router.push('/');
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          aria-hidden="true"
          className="workspace-drawer-backdrop fixed inset-0 z-[99998] bg-black/50 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        aria-label="Mobile workspace navigation"
        className={cn(
          'workspace-tabs mobile-drawer',
          isOpen && 'drawer-open'
        )}
      >
        <div className="mobile-drawer-header">
          <Link href="/" className="brand-lockup flex items-center gap-2.5 no-underline" onClick={onClose}>
            <span
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{ background: 'var(--teal-dark)' }}
            >
              <HeartPulse size={19} />
            </span>
            <span className="font-extrabold text-[var(--text)] text-base">SmartCare</span>
          </Link>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Close navigation"
            className="mobile-drawer-close flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] text-[var(--text-muted)] hover:text-[var(--teal)] active:scale-95 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3 py-1 overflow-y-auto">
          {config.sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {section.title && (
                <div className="px-2 pt-1 pb-0.5 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[var(--teal)]">
                    {section.title}
                  </span>
                  {section.badge && (
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[var(--teal)]/10 text-[var(--teal)]">
                      {section.badge}
                    </span>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = checkActive(item.href, pathname, searchParams);
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 min-h-[48px] px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]',
                        active
                          ? 'bg-[var(--mint)] text-[var(--teal)] font-bold'
                          : 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text)]'
                      )}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon size={18} className="shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {sIdx < config.sections.length - 1 && <div className="nav-divider my-2" />}
            </div>
          ))}

          {config.secondary.length > 0 && (
            <>
              <div className="nav-divider my-1" />
              <div className="flex flex-col gap-1">
                {config.secondary.map((item) => {
                  const Icon = item.icon;
                  const active = checkActive(item.href, pathname, searchParams);
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 min-h-[48px] px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]',
                        active
                          ? 'bg-[var(--mint)] text-[var(--teal)] font-bold'
                          : 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text)]'
                      )}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon size={18} className="shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-[var(--line)]">
          <button
            type="button"
            onClick={handleLogout}
            className="signout-btn flex items-center gap-3 w-full min-h-[48px] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 active:scale-[0.98] transition-all cursor-pointer"
            aria-label="Sign out"
          >
            <LogOut size={18} className="shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
