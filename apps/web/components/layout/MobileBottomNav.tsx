'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { useSession, useAppStore } from '@/lib/store/app-store';

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { role: sessionRole } = useSession();
  const logout = useAppStore((s) => s.logout);

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

  const handleSignOut = () => {
    logout();
    router.push('/');
  };

  if (role === 'patient') {
    const isOverview = pathname === '/dashboard/patient';
    const isBook = pathname.startsWith('/dashboard/patient/apply');
    const isHistory = pathname.startsWith('/dashboard/patient/history');
    const isVisits = pathname.startsWith('/dashboard/patient/visits');

    return (
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <Link
          href="/dashboard/patient"
          className={`mobile-nav-btn ${isOverview ? 'active' : ''}`}
          aria-label="Overview"
        >
          <LayoutDashboard size={20} />
          <span>Overview</span>
        </Link>
        <Link
          href="/dashboard/patient/apply/1"
          className={`mobile-nav-btn ${isBook ? 'active' : ''}`}
          aria-label="Book"
        >
          <CalendarPlus size={20} />
          <span>Book</span>
        </Link>
        <Link
          href="/dashboard/patient/history"
          className={`mobile-nav-btn ${isHistory ? 'active' : ''}`}
          aria-label="History"
        >
          <FileText size={20} />
          <span>History</span>
        </Link>
        <Link
          href="/dashboard/patient/visits"
          className={`mobile-nav-btn ${isVisits ? 'active' : ''}`}
          aria-label="Visits"
        >
          <ClipboardList size={20} />
          <span>Visits</span>
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="mobile-nav-btn"
          aria-label="Sign out"
        >
          <LogOut size={20} />
          <span>Sign out</span>
        </button>
      </nav>
    );
  }

  if (role === 'doctor') {
    const isOverview = pathname === '/dashboard/hospital';
    const isQueue = pathname.startsWith('/dashboard/queue');
    const isAnalytics = pathname.startsWith('/dashboard/analytics');
    const isDonations = pathname.startsWith('/dashboard/hospital/donations');

    return (
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <Link
          href="/dashboard/hospital"
          className={`mobile-nav-btn ${isOverview ? 'active' : ''}`}
          aria-label="Overview"
        >
          <LayoutDashboard size={20} />
          <span>Overview</span>
        </Link>
        <Link
          href="/dashboard/queue"
          className={`mobile-nav-btn ${isQueue ? 'active' : ''}`}
          aria-label="Queue"
        >
          <ListOrdered size={20} />
          <span>Queue</span>
        </Link>
        <Link
          href="/dashboard/analytics"
          className={`mobile-nav-btn ${isAnalytics ? 'active' : ''}`}
          aria-label="Analytics"
        >
          <BarChart3 size={20} />
          <span>Analytics</span>
        </Link>
        <Link
          href="/dashboard/hospital/donations"
          className={`mobile-nav-btn ${isDonations ? 'active' : ''}`}
          aria-label="Donations"
        >
          <HeartHandshake size={20} />
          <span>Donations</span>
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="mobile-nav-btn"
          aria-label="Sign out"
        >
          <LogOut size={20} />
          <span>Sign out</span>
        </button>
      </nav>
    );
  }

  // Staff / Admin
  const isOps = pathname === '/dashboard/admin';
  const isQueue = pathname.startsWith('/dashboard/queue');
  const isAnalytics = pathname.startsWith('/dashboard/analytics');
  const isDonations = pathname.startsWith('/dashboard/admin/donations');

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      <Link
        href="/dashboard/admin"
        className={`mobile-nav-btn ${isOps ? 'active' : ''}`}
        aria-label="Operations"
      >
        <LayoutDashboard size={20} />
        <span>Operations</span>
      </Link>
      <Link
        href="/dashboard/queue"
        className={`mobile-nav-btn ${isQueue ? 'active' : ''}`}
        aria-label="Queue"
      >
        <ListOrdered size={20} />
        <span>Queue</span>
      </Link>
      <Link
        href="/dashboard/analytics"
        className={`mobile-nav-btn ${isAnalytics ? 'active' : ''}`}
        aria-label="Analytics"
      >
        <BarChart3 size={20} />
        <span>Analytics</span>
      </Link>
      <Link
        href="/dashboard/admin/donations"
        className={`mobile-nav-btn ${isDonations ? 'active' : ''}`}
        aria-label="Donations"
      >
        <HeartHandshake size={20} />
        <span>Donations</span>
      </Link>
      <button
        type="button"
        onClick={handleSignOut}
        className="mobile-nav-btn"
        aria-label="Sign out"
      >
        <LogOut size={20} />
        <span>Sign out</span>
      </button>
    </nav>
  );
}
