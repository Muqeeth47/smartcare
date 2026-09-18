import Link from 'next/link';
import type { Metadata } from 'next';
import {
  Home,
  SearchX,
  LogIn,
  Activity,
  Info,
  Droplets,
  CalendarPlus,
  ShieldAlert,
  Compass,
  PhoneCall,
} from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { Footer } from '@/components/layout/Shell';

export const metadata: Metadata = {
  title: '404 · Page Not Found | SmartCare',
  description: 'The requested healthcare page could not be located. Access care pathways and emergency services.',
};

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-[var(--surface-sunken)] flex flex-col justify-between selection:bg-[var(--mint)] selection:text-[var(--teal)]">
      {/* Brand Topbar */}
      <Topbar variant="landing" />

      {/* Main 404 Hero Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-16 my-auto">
        <div className="w-full max-w-2xl bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-12 shadow-xl relative overflow-hidden">
          {/* Subtle Ambient Radial Glow */}
          <div
            className="absolute -right-20 -top-20 w-64 h-64 rounded-full pointer-events-none opacity-20 blur-3xl"
            style={{ background: 'var(--teal)' }}
            aria-hidden="true"
          />

          {/* Badge & Icon Row */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[var(--mint)] text-[var(--teal)] flex items-center justify-center shadow-xs border border-[var(--line)]">
              <SearchX size={34} strokeWidth={2} />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-extrabold uppercase tracking-wider bg-[var(--mint)] text-[var(--teal)] border border-[#a5d2f6]">
              Error 404 · Route Missing
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[var(--text)] tracking-tight leading-snug mb-3">
            That page isn&apos;t on the care path.
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed mb-8 max-w-xl">
            We couldn&apos;t locate the address you navigated to. It may have been moved, updated, or does not exist on the network. Use the verified health pathways below to get back on track.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <Link
              href="/"
              className="btn-primary inline-flex items-center gap-2 h-11 px-5 rounded-xl font-bold text-sm text-white no-underline shadow-md hover:brightness-105 transition-all"
            >
              <Home size={16} /> Return to Home
            </Link>
            <Link
              href="/dashboard/patient/apply/1"
              className="btn-secondary inline-flex items-center gap-2 h-11 px-5 rounded-xl font-bold text-sm no-underline border border-[var(--line)] transition-all"
            >
              <CalendarPlus size={16} /> Book an Appointment
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs mb-8">
            <div className="flex items-center gap-2.5">
              <ShieldAlert size={18} className="shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="font-medium">
                Medical emergency? Call <strong>108</strong> or <strong>112</strong> immediately.
              </span>
            </div>
            <a
              href="tel:108"
              className="inline-flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300 underline hover:no-underline shrink-0 text-xs self-end sm:self-auto"
            >
              <PhoneCall size={13} /> Call 108
            </a>
          </div>

          {/* Divider */}
          <div className="border-t border-[var(--line)] pt-6">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
              <Compass size={14} /> Quick Pathways
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <Link
                href="/dashboard/patient"
                className="flex items-center gap-2 p-3 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] hover:border-[var(--teal)] text-[var(--text)] font-bold transition-all no-underline hover:-translate-y-0.5"
              >
                <LogIn size={15} className="text-[var(--teal)] shrink-0" />
                <span className="truncate">Patient Portal</span>
              </Link>
              <Link
                href="/dashboard/hospital"
                className="flex items-center gap-2 p-3 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] hover:border-[var(--teal)] text-[var(--text)] font-bold transition-all no-underline hover:-translate-y-0.5"
              >
                <Activity size={15} className="text-[var(--teal)] shrink-0" />
                <span className="truncate">Hospital Portal</span>
              </Link>
              <Link
                href="/dashboard/patient/donations"
                className="flex items-center gap-2 p-3 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] hover:border-[var(--teal)] text-[var(--text)] font-bold transition-all no-underline hover:-translate-y-0.5"
              >
                <Droplets size={15} className="text-red-500 shrink-0" />
                <span className="truncate">Blood Finder</span>
              </Link>
              <Link
                href="/about"
                className="flex items-center gap-2 p-3 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] hover:border-[var(--teal)] text-[var(--text)] font-bold transition-all no-underline hover:-translate-y-0.5"
              >
                <Info size={15} className="text-[var(--teal)] shrink-0" />
                <span className="truncate">About Us</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Brand Footer */}
      <Footer />
    </div>
  );
}
