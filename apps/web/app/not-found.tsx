import Link from 'next/link';
import type { Metadata } from 'next';
import {
  Home,
  SearchX,
  LogIn,
  Activity,
  Info,
  Droplets,
} from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { Footer } from '@/components/layout/Shell';

export const metadata: Metadata = {
  title: '404 · That page isn\'t on the care path | SmartCare',
  description: 'Page not found — SmartCare',
};

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-[var(--surface-sunken)] flex flex-col justify-between">
      {/* Topbar */}
      <Topbar variant="landing" />

      {/* Main 404 Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 my-auto">
        <div className="w-full max-w-2xl bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-12 shadow-md">
          {/* Icon Box */}
          <div className="w-16 h-16 rounded-2xl bg-[var(--mint)] text-[var(--teal)] flex items-center justify-center mb-6 shadow-xs">
            <SearchX size={36} strokeWidth={1.8} />
          </div>

          {/* Eyebrow */}
          <div className="eyebrow mb-3">
            <span className="eyebrow-dot" /> Error 404
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0a3b69] tracking-tight leading-tight mb-4">
            That page isn&apos;t on the care path.
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed mb-8 max-w-xl">
            We couldn&apos;t find the address you opened. It may have moved, been removed, or never existed. Return home or try one of the trusted care paths below.
          </p>

          {/* Primary & Back Actions */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl font-bold text-sm bg-[#0a3b69] text-white hover:bg-[#0f5ca8] transition-all shadow-sm no-underline"
            >
              <Home size={16} /> Return home
            </Link>
            <Link
              href="/dashboard/patient/apply/1"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl font-bold text-sm bg-[var(--mint)] text-[#0a3b69] hover:bg-[#d0e5f7] border border-[#b8d6f1] transition-all no-underline"
            >
              Book an appointment
            </Link>
          </div>

          {/* Divider */}
          <hr className="border-t border-[var(--line)] my-6" />

          {/* Suggestion Links */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
              Try one of these instead
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <Link
                href="/dashboard/patient"
                className="flex items-center gap-1.5 p-2.5 rounded-xl border border-[var(--line)] hover:border-[var(--teal)] text-[#0a3b69] font-bold transition-colors no-underline"
              >
                <LogIn size={14} className="text-[var(--teal)]" />
                <span>Patient portal</span>
              </Link>
              <Link
                href="/dashboard/hospital"
                className="flex items-center gap-1.5 p-2.5 rounded-xl border border-[var(--line)] hover:border-[var(--teal)] text-[#0a3b69] font-bold transition-colors no-underline"
              >
                <Activity size={14} className="text-[var(--teal)]" />
                <span>Hospital portal</span>
              </Link>
              <Link
                href="/donate"
                className="flex items-center gap-1.5 p-2.5 rounded-xl border border-[var(--line)] hover:border-[var(--teal)] text-[#0a3b69] font-bold transition-colors no-underline"
              >
                <Droplets size={14} className="text-[var(--teal)]" />
                <span>Donations</span>
              </Link>
              <Link
                href="/about"
                className="flex items-center gap-1.5 p-2.5 rounded-xl border border-[var(--line)] hover:border-[var(--teal)] text-[#0a3b69] font-bold transition-colors no-underline"
              >
                <Info size={14} className="text-[var(--teal)]" />
                <span>About us</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
