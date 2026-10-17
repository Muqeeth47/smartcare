'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, HeartPulse } from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import type { UserRole } from '@smartcare/types';
import { MorphingAuthCard, PORTAL_PROFILES, type PortalKey, type AuthMode } from './MorphingAuthCard';
import { useAntiScrape } from './useAntiScrape';

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

  useAntiScrape();

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

  // Where to go after signing in, when a dashboard sent the visitor here. Only our own dashboard paths are allowed.
  const nextParam = searchParams.get('next');
  const safeNext = nextParam && /^\/dashboard(\/|$)/.test(nextParam) && !nextParam.includes('//') ? nextParam : null;

  const handlePortalChange = useCallback(
    (newPortal: PortalKey) => {
      const profile = PORTAL_PROFILES[newPortal];
      setAuthTarget(profile.role);
      const params = new URLSearchParams(searchParams.toString());
      params.set('portal', newPortal);
      params.set('role', profile.role);
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
      router.push(safeNext ?? user.dest);
    },
    [login, showToast, router, safeNext]
  );

  return (
    <div className="min-h-[100dvh] w-full bg-slate-50 dark:bg-[#09121d] text-slate-800 dark:text-slate-100 flex flex-col justify-between py-3 px-3 sm:py-6 sm:px-4 select-none overflow-x-hidden">
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between mb-3 sm:mb-4 gap-2">
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 min-w-0 no-underline text-inherit">
          <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#0f5ca8] to-[#0a3b69] flex items-center justify-center text-white shadow-md shrink-0">
            <HeartPulse className="w-4 h-4 sm:w-5 sm:h-5" />
          </span>
          <span className="min-w-0">
            <span className="font-extrabold text-base sm:text-lg tracking-tight block leading-none truncate">SmartCare</span>
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate block">Sign in to your workspace</span>
          </span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors shrink-0 min-h-[44px] px-2 rounded-lg no-underline"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Back home</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center w-full py-2">
        <MorphingAuthCard
          initialPortal={initialPortal}
          initialMode={initialMode}
          onPortalChange={handlePortalChange}
          onModeChange={handleModeChange}
          onSuccess={handleAuthSuccess}
        />
      </main>

      <footer className="max-w-5xl w-full mx-auto text-center text-[11px] sm:text-xs text-slate-400 mt-2 sm:mt-4">
        &copy; {new Date().getFullYear()} SmartCare &middot; Demo environment
      </footer>
    </div>
  );
}

export default LoginPage;
