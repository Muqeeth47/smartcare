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

  /** Shared SOS button appended to every nav */
  const SosTab = (
    <Link
      href="/ambulance"
      className="mobile-nav-btn mobile-nav-btn-sos"
      aria-label="SOS Ambulance"
    >
      <Siren size={20} className="animate-pulse" />
      <span>SOS</span>
    </Link>
  );

  if (role === 'patient') {
    return (
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <Link
          href="/dashboard/patient"
          className={`mobile-nav-btn ${pathname === '/dashboard/patient' ? 'active' : ''}`}
          aria-label="Overview"
          aria-current={pathname === '/dashboard/patient' ? 'page' : undefined}
        >
          <LayoutDashboard size={20} />
          <span>Overview</span>
        </Link>
        <Link
          href="/dashboard/patient/apply/1"
          className={`mobile-nav-btn ${pathname.startsWith('/dashboard/patient/apply') ? 'active' : ''}`}
          aria-label="Book"
          aria-current={pathname.startsWith('/dashboard/patient/apply') ? 'page' : undefined}
        >
          <CalendarPlus size={20} />
          <span>Book</span>
        </Link>
        <Link
          href="/dashboard/patient/history"
          className={`mobile-nav-btn ${pathname.startsWith('/dashboard/patient/history') ? 'active' : ''}`}
          aria-label="History"
          aria-current={pathname.startsWith('/dashboard/patient/history') ? 'page' : undefined}
        >
          <FileText size={20} />
          <span>History</span>
        </Link>
        <Link
          href="/dashboard/patient/visits"
          className={`mobile-nav-btn ${pathname.startsWith('/dashboard/patient/visits') ? 'active' : ''}`}
          aria-label="Visits"
          aria-current={pathname.startsWith('/dashboard/patient/visits') ? 'page' : undefined}
        >
          <ClipboardList size={20} />
          <span>Visits</span>
        </Link>
        {SosTab}
      </nav>
    );
  }

  if (role === 'doctor') {
    return (
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <Link
          href="/dashboard/hospital"
          className={`mobile-nav-btn ${pathname === '/dashboard/hospital' ? 'active' : ''}`}
          aria-label="Overview"
          aria-current={pathname === '/dashboard/hospital' ? 'page' : undefined}
        >
          <LayoutDashboard size={20} />
          <span>Overview</span>
        </Link>
        <Link
          href="/dashboard/queue"
          className={`mobile-nav-btn ${pathname.startsWith('/dashboard/queue') ? 'active' : ''}`}
          aria-label="Queue"
          aria-current={pathname.startsWith('/dashboard/queue') ? 'page' : undefined}
        >
          <ListOrdered size={20} />
          <span>Queue</span>
        </Link>
        <Link
          href="/dashboard/analytics"
          className={`mobile-nav-btn ${pathname.startsWith('/dashboard/analytics') ? 'active' : ''}`}
          aria-label="Analytics"
          aria-current={pathname.startsWith('/dashboard/analytics') ? 'page' : undefined}
        >
          <BarChart3 size={20} />
          <span>Analytics</span>
        </Link>
        <Link
          href="/dashboard/hospital/donations"
          className={`mobile-nav-btn ${pathname.startsWith('/dashboard/hospital/donations') ? 'active' : ''}`}
          aria-label="Donations"
          aria-current={pathname.startsWith('/dashboard/hospital/donations') ? 'page' : undefined}
        >
          <HeartHandshake size={20} />
          <span>Donations</span>
        </Link>
        {SosTab}
      </nav>
    );
  }

  // Staff / Admin
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      <Link
        href="/dashboard/admin"
        className={`mobile-nav-btn ${pathname === '/dashboard/admin' ? 'active' : ''}`}
        aria-label="Operations"
        aria-current={pathname === '/dashboard/admin' ? 'page' : undefined}
      >
        <LayoutDashboard size={20} />
        <span>Ops</span>
      </Link>
      <Link
        href="/dashboard/queue"
        className={`mobile-nav-btn ${pathname.startsWith('/dashboard/queue') ? 'active' : ''}`}
        aria-label="Queue"
        aria-current={pathname.startsWith('/dashboard/queue') ? 'page' : undefined}
      >
        <ListOrdered size={20} />
        <span>Queue</span>
      </Link>
      <Link
        href="/dashboard/analytics"
        className={`mobile-nav-btn ${pathname.startsWith('/dashboard/analytics') ? 'active' : ''}`}
        aria-label="Analytics"
        aria-current={pathname.startsWith('/dashboard/analytics') ? 'page' : undefined}
      >
        <BarChart3 size={20} />
        <span>Analytics</span>
      </Link>
      <Link
        href="/dashboard/admin/donations"
        className={`mobile-nav-btn ${pathname.startsWith('/dashboard/admin/donations') ? 'active' : ''}`}
        aria-label="Donations"
        aria-current={pathname.startsWith('/dashboard/admin/donations') ? 'page' : undefined}
      >
        <HeartHandshake size={20} />
        <span>Donations</span>
      </Link>
      {SosTab}
    </nav>
  );
}
