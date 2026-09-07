'use client';

import { useState, useEffect } from 'react';
import { Topbar } from './Topbar';
import { DesktopSidebar, Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface WorkspaceShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  /** Custom back link. Defaults to "/" */
  backHref?: string;
  backLabel?: string;
  className?: string;
}

export function WorkspaceShell({
  children,
  title,
  subtitle,
  backHref = '/',
  backLabel = 'Back to home',
  className,
}: WorkspaceShellProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('smartcare.sidebarCollapsed');
      if (saved !== null) setIsSidebarCollapsed(saved === 'true');
    } catch {}
  }, []);

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileDrawerOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsed((prev) => {
        const next = !prev;
        try { localStorage.setItem('smartcare.sidebarCollapsed', String(next)); } catch {}
        return next;
      });
    }
  };

  return (
    <div className="min-h-dvh bg-[var(--surface-sunken)] flex flex-col">
      <Topbar
        variant="workspace"
        title={title}
        subtitle={subtitle}
        backHref={backHref}
        backLabel={backLabel}
        isSidebarCollapsed={isSidebarCollapsed}
        onMenuClick={handleToggleSidebar}
      />

      {/* provider-shell sticks flush to the left screen edge with 0 negative space */}
      <div className={cn('provider-shell w-full flex-1', isSidebarCollapsed && 'sidebar-collapsed')}>
        {/* Left Sidebar on Desktop */}
        <DesktopSidebar onToggleCollapse={handleToggleSidebar} />

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <main
            className={cn(
              'workspace-content flex-1 min-w-0 pb-20 md:pb-8',
              className
            )}
          >
            {children}
          </main>
          {/* Footer pinned at bottom of viewport */}
          <Footer />
        </div>
      </div>

      {/* Slide-out Mobile Drawer */}
      <Sidebar isOpen={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} />

      {/* Fixed Bottom Nav on Mobile (≤ 768px) - ALWAYS pinned at bottom */}
      <MobileBottomNav />
    </div>
  );
}

interface PatientShellProps {
  children: React.ReactNode;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  className?: string;
}

export function PatientShell({
  children,
  subtitle = 'Patient portal',
  backHref = '/',
  backLabel = 'Back to home',
  className,
}: PatientShellProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('smartcare.sidebarCollapsed');
      if (saved !== null) setIsSidebarCollapsed(saved === 'true');
    } catch {}
  }, []);

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileDrawerOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsed((prev) => {
        const next = !prev;
        try { localStorage.setItem('smartcare.sidebarCollapsed', String(next)); } catch {}
        return next;
      });
    }
  };

  return (
    <div className="min-h-dvh bg-[var(--surface-sunken)] flex flex-col">
      <Topbar
        variant="patient"
        subtitle={subtitle}
        backHref={backHref}
        backLabel={backLabel}
        isSidebarCollapsed={isSidebarCollapsed}
        onMenuClick={handleToggleSidebar}
      />

      {/* provider-shell sticks flush to the left screen edge with 0 negative space */}
      <div className={cn('provider-shell w-full flex-1', isSidebarCollapsed && 'sidebar-collapsed')}>
        {/* Left Sidebar on Desktop */}
        <DesktopSidebar onToggleCollapse={handleToggleSidebar} />

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <main
            className={cn(
              'workspace-content flex-1 min-w-0 pb-20 md:pb-8',
              className
            )}
          >
            {children}
          </main>
          {/* Footer pinned at bottom of viewport */}
          <Footer />
        </div>
      </div>

      {/* Slide-out Mobile Drawer */}
      <Sidebar isOpen={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} />

      {/* Fixed Bottom Nav on Mobile (≤ 768px) - ALWAYS pinned at bottom */}
      <MobileBottomNav />
    </div>
  );
}

export function Footer() {
  return (
    <footer className="site-footer bg-[var(--surface)] border-t border-[var(--line)] mt-auto">
      <div className="w-full px-5 py-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 bg-[var(--mint)] rounded-lg flex items-center justify-center text-[var(--teal)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              </span>
              <span className="font-extrabold text-[var(--text)]">SmartCare</span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">Digital queue access for patients, hospitals, and care teams.</p>
          </div>
          <div className="flex gap-12">
            <div>
              <p className="text-xs font-semibold text-[var(--text)] uppercase tracking-wide mb-3">Explore</p>
              <div className="flex flex-col gap-2">
                <Link href="/about" className="text-xs text-[var(--text-muted)] hover:text-[var(--teal)] transition-colors no-underline">About us</Link>
                <Link href="/dashboard/patient/apply/1" className="text-xs text-[var(--text-muted)] hover:text-[var(--teal)] transition-colors no-underline">Patient portal</Link>
                <Link href="/login" className="text-xs text-[var(--text-muted)] hover:text-[var(--teal)] transition-colors no-underline">Hospital portal</Link>
                <Link href="/donate" className="text-xs text-[var(--text-muted)] hover:text-[var(--teal)] transition-colors no-underline">Community donation</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text)] uppercase tracking-wide mb-3">Policies</p>
              <div className="flex flex-col gap-2">
                <Link href="/terms" className="text-xs text-[var(--text-muted)] hover:text-[var(--teal)] transition-colors no-underline">Terms &amp; conditions</Link>
                <Link href="/privacy" className="text-xs text-[var(--text-muted)] hover:text-[var(--teal)] transition-colors no-underline">Privacy notice</Link>
                <a href="mailto:support@smartcare.demo" className="text-xs text-[var(--text-muted)] hover:text-[var(--teal)] transition-colors">Contact support</a>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-[var(--line)] flex flex-col sm:flex-row justify-between gap-2 text-[11px] text-[var(--text-muted)]">
          <span>© 2026 SmartCare Systems · Demo environment</span>
          <span>Last updated: September 2026</span>
        </div>
      </div>
    </footer>
  );
}
