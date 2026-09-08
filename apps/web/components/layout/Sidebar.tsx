'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  X,
  PanelLeftClose,
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
  DoorOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession, useAppStore } from '@/lib/store/app-store';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const SIDEBAR_ITEMS: Record<string, { main: SidebarItem[]; secondary: SidebarItem[] }> = {
  patient: {
    main: [
      { label: 'Overview', href: '/dashboard/patient', icon: LayoutDashboard },
      { label: 'Book appointment', href: '/dashboard/patient/apply/1', icon: CalendarPlus },
      { label: 'Medical History', href: '/dashboard/patient/history', icon: FileText },
      { label: 'Previous visits', href: '/dashboard/patient/visits', icon: ClipboardCheck },
      { label: 'Profile', href: '/dashboard/patient?tab=profile', icon: UserRound },
    ],
    secondary: [
      { label: 'Donations', href: '/dashboard/patient/donations', icon: HeartHandshake },
      { label: 'Help', href: '/about', icon: CircleHelp },
    ],
  },
  doctor: {
    main: [
      { label: 'Overview', href: '/dashboard/hospital', icon: LayoutDashboard },
      { label: 'Queue', href: '/dashboard/queue', icon: ListOrdered },
      { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    ],
    secondary: [
      { label: 'Donations', href: '/dashboard/hospital/donations', icon: HeartHandshake },
      { label: 'Help', href: '/about', icon: CircleHelp },
    ],
  },
  staff: {
    main: [
      { label: 'Operations', href: '/dashboard/admin', icon: LayoutDashboard },
      { label: 'Rooms', href: '/dashboard/admin?tab=rooms', icon: DoorOpen },
      { label: 'Queue', href: '/dashboard/queue', icon: ListOrdered },
      { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    ],
    secondary: [
      { label: 'Donations', href: '/dashboard/admin/donations', icon: HeartHandshake },
      { label: 'Help', href: '/about', icon: CircleHelp },
    ],
  },
};

function getRoleFromPath(pathname: string, sessionRole?: string): string {
  if (sessionRole) return sessionRole;
  if (pathname.startsWith('/dashboard/patient')) return 'patient';
  if (pathname.startsWith('/dashboard/hospital')) return 'doctor';
  if (pathname.startsWith('/dashboard/admin')) return 'staff';
  return 'patient';
}

function checkActive(itemHref: string, pathname: string): boolean {
  if (itemHref.includes('?tab=')) {
    return false;
  }
  if (itemHref === '/dashboard/patient' || itemHref === '/dashboard/hospital' || itemHref === '/dashboard/admin') {
    return pathname === itemHref;
  }
  return pathname.startsWith(itemHref);
}

/**
 * Desktop Left Sidebar (`.workspace-tabs.desktop-sidebar`)
 * Rendered sticky on the left column in `.provider-shell`.
 */
export function DesktopSidebar({ onToggleCollapse }: { onToggleCollapse?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role: sessionRole } = useSession();
  const logout = useAppStore((s) => s.logout);

  const role = getRoleFromPath(pathname, sessionRole);
  const items = SIDEBAR_ITEMS[role] || SIDEBAR_ITEMS.patient;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className="workspace-tabs desktop-sidebar" aria-label="Workspace navigation">
      <div className="flex items-center justify-between px-1.5 pb-2 mb-1 border-b border-[var(--line)]">
        <span className="text-[10px] font-extrabold tracking-wider uppercase text-[var(--muted)]">Navigation</span>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
            className="flex items-center justify-center w-6 h-6 rounded text-[var(--muted)] hover:text-[var(--teal)] hover:bg-[var(--mint)] transition-colors cursor-pointer"
          >
            <PanelLeftClose size={14} />
          </button>
        )}
      </div>
      {items.main.map((item) => {
        const Icon = item.icon;
        const active = checkActive(item.href, pathname);
        return (
          <Link
            key={item.label}
            href={item.href}
            className={active ? 'active' : ''}
            aria-current={active ? 'page' : undefined}
            title={item.label}
          >
            <Icon size={16} />
            <span>{item.label}</span>
          </Link>
        );
      })}

      <div className="nav-divider" />

      {items.secondary.map((item) => {
        const Icon = item.icon;
        const active = checkActive(item.href, pathname);
        return (
          <Link
            key={item.label}
            href={item.href}
            className={active ? 'active' : ''}
            aria-current={active ? 'page' : undefined}
            title={item.label}
          >
            <Icon size={16} />
            <span>{item.label}</span>
          </Link>
        );
      })}

      <button type="button" onClick={handleLogout} className="signout-btn" aria-label="Sign out" title="Sign out">
        <LogOut size={16} />
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
  const router = useRouter();
  const { role: sessionRole } = useSession();
  const logout = useAppStore((s) => s.logout);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const role = getRoleFromPath(pathname, sessionRole);
  const items = SIDEBAR_ITEMS[role] || SIDEBAR_ITEMS.patient;

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
          className="workspace-drawer-backdrop fixed inset-0 z-[399] bg-black/40 backdrop-blur-xs transition-opacity"
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
          <Link href="/" className="brand-lockup flex items-center gap-2 no-underline" onClick={onClose}>
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ background: 'var(--teal-dark)' }}
            >
              <HeartPulse size={17} />
            </span>
            <span className="font-extrabold text-[var(--text)] text-sm">SmartCare</span>
          </Link>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Close navigation"
            className="mobile-drawer-close"
          >
            <X size={16} />
          </button>
        </div>

        {items.main.map((item) => {
          const Icon = item.icon;
          const active = checkActive(item.href, pathname);
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className={active ? 'active' : ''}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="nav-divider" />

        {items.secondary.map((item) => {
          const Icon = item.icon;
          const active = checkActive(item.href, pathname);
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className={active ? 'active' : ''}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <button type="button" onClick={handleLogout} className="signout-btn" aria-label="Sign out">
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </aside>
    </>
  );
}
