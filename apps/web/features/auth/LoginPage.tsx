'use client';

import { Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Lock, Sparkles } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { useAppStore } from '@/lib/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import type { UserRole } from '@smartcare/types';
import {
  MorphingAuthCard,
  PORTAL_PROFILES,
  type PortalKey,
  type AuthMode,
} from './MorphingAuthCard';

export function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, setAuthTarget, showToast } = useAppStore(
    useShallow((s) => ({
      login: s.login,
      setAuthTarget: s.setAuthTarget,
      showToast: s.showToast,
    }))
  );

  const portalParam = searchParams.get('portal') as PortalKey | null;
  const roleParam = searchParams.get('role');
  const modeParam = searchParams.get('mode') as AuthMode | null;

  const initialPortal: PortalKey =
    portalParam && PORTAL_PROFILES[portalParam]
      ? portalParam
      : roleParam === 'patient'
      ? 'patient'
      : roleParam === 'staff'
      ? 'cmo'
      : 'doctor';

  const initialMode: AuthMode = modeParam === 'signup' ? 'signup' : 'signin';

  const handlePortalChange = useCallback(
    (newPortal: PortalKey) => {
      const prof = PORTAL_PROFILES[newPortal];
      setAuthTarget(prof.role);
      const params = new URLSearchParams(searchParams.toString());
      params.set('portal', newPortal);
      params.set('role', prof.role);
      router.replace(`/login?${params.toString()}`, { scroll: false });
    },
    [setAuthTarget, searchParams, router]
  );

  const handleModeChange = useCallback(
    (newMode: AuthMode) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('mode', newMode);
      router.replace(`/login?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  const handleAuthSuccess = useCallback(
    (user: { email: string; role: UserRole; facility?: string; dest: string }) => {
      login(user.email, user.role, {
        hospital: user.facility || '',
        country: 'India',
        state: 'Telangana',
        city: 'Hyderabad',
      });
      showToast('Signed in successfully', 'success');
      router.push(user.dest);
    },
    [login, showToast, router]
  );

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-[#09121d] flex flex-col justify-between text-slate-800 dark:text-slate-100 transition-colors">
      <Topbar variant="landing" />

      <main className="flex-1 flex flex-col items-center justify-center w-full px-4 py-8 sm:py-12">
        {/* Page Subtitle Header */}
        <div className="text-center max-w-2xl mx-auto mb-6">
          <div className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 mb-1.5 flex items-center justify-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            <span>National Health Mesh · Authentication Gateway</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            Unified Public Health Sign-In
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Secure, role-aware access for Citizens, Primary Health Centres, District Health Directorates, and State Command.
          </p>
        </div>

        {/* Double-Slider Morphing Card */}
        <MorphingAuthCard
          initialPortal={initialPortal}
          initialMode={initialMode}
          onPortalChange={handlePortalChange}
          onModeChange={handleModeChange}
          onSuccess={handleAuthSuccess}
          onBackHome={() => router.push('/')}
        />

        {/* Evaluation & Security Footer Strip */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 max-w-2xl text-center">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
            <span>ABDM & DPDP Act 2023 Compliant</span>
          </span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-slate-400" />
            <span>256-bit TLS Encrypted Mesh</span>
          </span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span>
            Preset evaluation passwords: <code className="font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-bold text-slate-800 dark:text-slate-200">demo1234</code>
          </span>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-[#223850] bg-white/50 dark:bg-[#0a1523]/50">
        <p>SmartCare National Public Health Resilience Infrastructure · MoHFW Telemetry Mesh</p>
      </footer>
    </div>
  );
}

export default LoginPage;
