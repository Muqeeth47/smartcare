'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  UserRound,
  Hospital,
  Building2,
  Stethoscope,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  CheckCircle2,
  XCircle,
  Activity,
  KeyRound,
} from 'lucide-react';
import type { UserRole } from '@smartcare/types';
import { DemoDB } from '@/lib/db/demo-db';
import { useLoginThrottle } from './useLoginThrottle';

export type PortalKey = 'patient' | 'doctor' | 'cmo' | 'commander';
export type AuthMode = 'signin' | 'signup' | 'recovery';

export interface PortalProfile {
  key: PortalKey;
  label: string;
  role: UserRole;
  defaultEmail: string;
  defaultPassword: string;
  defaultFacility: string;
  defaultName: string;
  dest: string;
  signInDesc: string;
  signUpDesc: string;
  signInBtn: string;
  signUpBtn: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const PORTAL_PROFILES: Record<PortalKey, PortalProfile> = {
  patient: {
    key: 'patient',
    label: 'Patient',
    role: 'patient',
    defaultEmail: 'patient@smartcare.demo',
    defaultPassword: 'demo1234',
    defaultFacility: 'SmartCare Community Hospital',
    defaultName: 'Asha Rao',
    dest: '/dashboard/patient',
    signInDesc: 'See your appointments, queue ticket and prescriptions.',
    signUpDesc: 'Create a patient account to book visits and keep your records.',
    signInBtn: 'SIGN IN AS PATIENT',
    signUpBtn: 'CREATE PATIENT ACCOUNT',
    icon: UserRound,
  },
  doctor: {
    key: 'doctor',
    label: 'Doctor / PHC',
    role: 'doctor',
    defaultEmail: 'hospital@smartcare.demo',
    defaultPassword: 'demo1234',
    defaultFacility: 'SmartCare Community Hospital',
    defaultName: 'Dr. Arjun Rao',
    dest: '/dashboard/hospital?module=supply&supplyTab=inventory',
    signInDesc: 'Open your patient queue, ward beds and medicine stock.',
    signUpDesc: 'Set up a workspace for your health centre.',
    signInBtn: 'SIGN IN AS DOCTOR',
    signUpBtn: 'CREATE DOCTOR ACCOUNT',
    icon: Stethoscope,
  },
  cmo: {
    key: 'cmo',
    label: 'District CMO',
    role: 'staff',
    defaultEmail: 'cmo@district.gov.in',
    defaultPassword: 'demo1234',
    defaultFacility: 'Hyderabad District Health Directorate',
    defaultName: 'Dr. Rajeshwar Sharma',
    dest: '/dashboard/admin?adminTab=command&commandTab=summary',
    signInDesc: 'Watch district medicine stock and approve stock transfers.',
    signUpDesc: 'Set up an account for your district health office.',
    signInBtn: 'SIGN IN AS DISTRICT CMO',
    signUpBtn: 'CREATE CMO ACCOUNT',
    icon: ShieldCheck,
  },
  commander: {
    key: 'commander',
    label: 'State Command',
    role: 'staff',
    defaultEmail: 'commander@mohfw.gov.in',
    defaultPassword: 'demo1234',
    defaultFacility: 'MoHFW State Control Desk',
    defaultName: 'State Control Desk',
    dest: '/dashboard/admin?adminTab=command&commandTab=summary',
    signInDesc: 'See every district, spot shortages early and plan ahead.',
    signUpDesc: 'Set up an account for the state control desk.',
    signInBtn: 'SIGN IN TO STATE COMMAND',
    signUpBtn: 'CREATE STATE ACCOUNT',
    icon: Building2,
  },
};

export const PORTAL_KEYS: PortalKey[] = ['doctor', 'cmo', 'commander', 'patient'];

/**
 * Demo logins are filled in for presentations. They are written into the fields only after the page
 * has loaded in a browser (never into the server HTML), and a live site can turn them off completely
 * by setting NEXT_PUBLIC_DEMO_AUTOFILL=false.
 */
export const DEMO_AUTOFILL = process.env.NEXT_PUBLIC_DEMO_AUTOFILL !== 'false';

// A form submitted faster than a person could read it is almost certainly a script
const MIN_HUMAN_MS = 900;

const MORPH = 'all 600ms cubic-bezier(0.68, -0.15, 0.265, 1.15)';

const INPUT_CLASS =
  'w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0b1522] border border-slate-200 dark:border-[#223850] rounded-xl ' +
  'text-base sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 select-text min-h-[44px] ' +
  'focus:outline-none focus:ring-2 focus:ring-blue-500';

const PRIMARY_BTN =
  'w-full mt-1.5 py-3 sm:py-3.5 bg-gradient-to-r from-[#0a3b69] to-[#0f5ca8] hover:from-[#082e52] hover:to-[#0c4985] ' +
  'text-white font-extrabold text-xs uppercase tracking-wider rounded-full shadow-lg hover:shadow-xl transition-all ' +
  'active:scale-95 flex items-center justify-center gap-2 min-h-[48px] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed';

const OUTLINE_BTN =
  'px-8 py-3 rounded-full border-2 border-white text-white font-extrabold text-xs uppercase tracking-wider ' +
  'hover:bg-white hover:text-[#0a3b69] transition-all hover:-translate-y-0.5 shadow-md flex items-center gap-2 cursor-pointer min-h-[44px]';

// ─── Small building blocks (used by both forms) ──────────────────────────────

function Field({
  label,
  icon: Icon,
  trailing,
  ...input
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  trailing?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = React.useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-bold text-slate-700 dark:text-slate-300">
        {label} <span className="text-blue-600">*</span>
      </label>
      <div className="relative flex items-center">
        {Icon && <Icon className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />}
        <input id={id} required className={`${INPUT_CLASS} ${Icon ? 'pl-9' : ''} ${trailing ? 'pr-11' : ''}`} {...input} />
        {trailing}
      </div>
    </div>
  );
}

function PasswordField({
  label,
  visible,
  onToggle,
  ...input
}: {
  label: string;
  visible: boolean;
  onToggle: () => void;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field
      label={label}
      icon={Lock}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-0 h-full min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      }
      {...input}
    />
  );
}

function RoleSwitcher({ value, onChange }: { value: PortalKey; onChange: (key: PortalKey) => void }) {
  return (
    <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-[#0d1825] rounded-xl border border-slate-200 dark:border-[#223850] w-full" role="radiogroup" aria-label="I am a">
      {PORTAL_KEYS.map((key) => {
        const { label, icon: Icon } = PORTAL_PROFILES[key];
        const selected = value === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(key)}
            className={`py-2 px-1.5 text-[11px] sm:text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all min-h-[44px] min-w-0 cursor-pointer ${
              selected
                ? 'bg-white dark:bg-[#182b40] text-blue-700 dark:text-blue-400 shadow-sm ring-1 ring-blue-500/20'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function FormMessage({ message }: { message: { text: string; type: 'error' | 'success' } | null }) {
  if (!message) return null;
  const isError = message.type === 'error';
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
        isError
          ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900'
          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
      }`}
    >
      {isError ? <XCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
      <span>{message.text}</span>
    </div>
  );
}

/** A field only bots see: it is off-screen, skipped by Tab and hidden from screen readers. */
function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden">
      <label>
        Leave this empty
        <input type="text" name="contact_fax" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}

/** Takes the hidden panel out of Tab order and away from screen readers (it only stays in the page for the slide animation). */
function inactiveProps(inactive: boolean): Record<string, unknown> {
  return inactive ? { 'aria-hidden': true, inert: '' } : {};
}

function SkeletonCard() {
  return (
    <div className="w-full max-w-[890px] min-h-0 md:min-h-[610px] bg-white dark:bg-[#101e30] border border-slate-200 dark:border-[#223850] rounded-2xl sm:rounded-[30px] shadow-xl p-6 md:p-12 animate-pulse" aria-busy="true" aria-label="Loading sign in">
      <div className="h-8 w-40 rounded-lg bg-slate-200 dark:bg-slate-700 mb-6" />
      <div className="h-11 rounded-xl bg-slate-200 dark:bg-slate-700 mb-4" />
      <div className="h-11 rounded-xl bg-slate-200 dark:bg-slate-700 mb-4" />
      <div className="h-11 rounded-xl bg-slate-200 dark:bg-slate-700 mb-6" />
      <div className="h-12 rounded-full bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}

// ─── The card ────────────────────────────────────────────────────────────────

export interface MorphingAuthCardProps {
  initialPortal?: PortalKey;
  initialMode?: AuthMode;
  onPortalChange?: (portal: PortalKey) => void;
  onModeChange?: (mode: AuthMode) => void;
  onSuccess?: (user: { email: string; role: UserRole; facility?: string; dest: string }) => void;
}

export const MorphingAuthCard: React.FC<MorphingAuthCardProps> = ({
  initialPortal = 'doctor',
  initialMode = 'signin',
  onPortalChange,
  onModeChange,
  onSuccess,
}) => {
  // The form is built in the browser only, so a plain page download (no JavaScript) gets an empty shell
  const [ready, setReady] = useState(false);
  const shownAt = useRef(0);

  const [portalKey, setPortalKey] = useState<PortalKey>(initialPortal);
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [isRecovering, setIsRecovering] = useState(initialMode === 'recovery');

  const activePortal = PORTAL_PROFILES[portalKey];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [facility, setFacility] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSignInPwd, setShowSignInPwd] = useState(false);
  const [showSignUpPwd, setShowSignUpPwd] = useState(false);

  const throttle = useLoginThrottle();

  const fillDemo = useCallback((key: PortalKey) => {
    const p = PORTAL_PROFILES[key];
    setEmail(DEMO_AUTOFILL ? p.defaultEmail : '');
    setPassword(DEMO_AUTOFILL ? p.defaultPassword : '');
    setConfirmPassword(DEMO_AUTOFILL ? p.defaultPassword : '');
    setFacility(p.role === 'patient' ? '' : DEMO_AUTOFILL ? p.defaultFacility : '');
    setName(DEMO_AUTOFILL ? p.defaultName : '');
    setMessage(null);
  }, []);

  useEffect(() => {
    fillDemo(initialPortal);
    shownAt.current = Date.now();
    setReady(true);
    // Clear anything typed when leaving the page
    return () => {
      setPassword('');
      setConfirmPassword('');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follow the address bar if it changes (for example the back button)
  useEffect(() => {
    if (PORTAL_PROFILES[initialPortal] && initialPortal !== portalKey) {
      setPortalKey(initialPortal);
      fillDemo(initialPortal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPortal]);

  useEffect(() => {
    setIsSignUp(initialMode === 'signup');
    setIsRecovering(initialMode === 'recovery');
  }, [initialMode]);

  const handlePortalSelect = (key: PortalKey) => {
    setPortalKey(key);
    fillDemo(key);
    shownAt.current = Date.now();
    throttle.reset();
    onPortalChange?.(key);
  };

  const showMode = (signUp: boolean) => {
    setIsSignUp(signUp);
    setIsRecovering(false);
    setMessage(null);
    onModeChange?.(signUp ? 'signup' : 'signin');
  };

  /** True only when a bot filled the hidden honeypot field. */
  const looksAutomated = (form: HTMLFormElement) => {
    const trap = form.elements.namedItem('contact_fax') as HTMLInputElement | null;
    return Boolean(trap?.value && trap.value.trim().length > 0);
  };

  const blockedMessage = 'Something went wrong. Please wait a moment and try again.';

  const handleSignInSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (throttle.lockedFor > 0) return;
    if (looksAutomated(e.currentTarget)) {
      setMessage({ text: blockedMessage, type: 'error' });
      return;
    }
    if (!email || !password || (activePortal.role !== 'patient' && !facility)) {
      setMessage({ text: 'Please fill in every field.', type: 'error' });
      return;
    }
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await DemoDB.checkCredentials(
        activePortal.role === 'patient' ? '' : facility,
        email,
        password,
        activePortal.role
      );

      if (!result.success) {
        throttle.recordFailure();
        setMessage({ text: 'We could not sign you in. Check your email, password and role, then try again.', type: 'error' });
        return;
      }

      throttle.reset();
      const u = result.user!;
      const targetDest =
        u.role === 'patient'
          ? '/dashboard/patient'
          : u.role === 'doctor'
          ? '/dashboard/hospital?module=supply&supplyTab=inventory'
          : '/dashboard/admin?adminTab=command&commandTab=summary';

      onSuccess?.({
        email: u.email,
        role: u.role as UserRole,
        facility: u.hospital || facility,
        dest: targetDest,
      });
    } catch {
      setMessage({ text: 'Could not reach the server. Please check your connection and try again.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (looksAutomated(e.currentTarget)) {
      setMessage({ text: blockedMessage, type: 'error' });
      return;
    }
    if (!email || !name || (activePortal.role !== 'patient' && !facility)) {
      setMessage({ text: 'Please fill in every field.', type: 'error' });
      return;
    }
    if (password.length < 8) {
      setMessage({ text: 'Your password needs at least 8 characters.', type: 'error' });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ text: 'The two passwords do not match.', type: 'error' });
      return;
    }
    setIsLoading(true);
    setMessage(null);

    try {
      const result =
        activePortal.role === 'patient'
          ? await DemoDB.registerPatient({ email, password, name })
          : await DemoDB.registerProfessional({ email, password, role: activePortal.role, hospital: facility });

      if (!result.success) {
        setMessage({ text: result.error || 'We could not create the account. Please try again.', type: 'error' });
        return;
      }

      if (result.user) {
        const u = result.user;
        onSuccess?.({
          email: u.email,
          role: u.role as UserRole,
          facility: u.hospital || (activePortal.role === 'patient' ? 'SmartCare Community Hospital' : facility),
          dest: activePortal.dest,
        });
        return;
      }

      showMode(false);
      setMessage({ text: 'Account created. Please sign in.', type: 'success' });
    } catch {
      setMessage({ text: 'Could not create the account. Please try again.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (looksAutomated(e.currentTarget)) return;
    // Same answer whether or not the email has an account
    setIsRecovering(false);
    setMessage({ text: 'If that email has an account, a reset link is on its way.', type: 'success' });
  };

  if (!ready) return <SkeletonCard />;

  const signInLocked = throttle.lockedFor > 0;

  return (
    <div className="relative w-full max-w-[890px] min-h-0 md:min-h-[610px] bg-white dark:bg-[#101e30] border border-slate-200 dark:border-[#223850] rounded-2xl sm:rounded-[30px] shadow-xl md:shadow-2xl overflow-hidden flex flex-col md:block">
      {/* Phone tabs */}
      <div className="flex md:hidden bg-slate-100 dark:bg-[#0d1825] p-1.5 border-b border-slate-200 dark:border-[#223850] w-full shrink-0 sticky top-0 z-10">
        {([false, true] as const).map((signUp) => {
          const active = isSignUp === signUp && !isRecovering;
          return (
            <button
              key={String(signUp)}
              type="button"
              onClick={() => showMode(signUp)}
              className={`flex-1 py-2.5 rounded-full text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all min-h-[44px] cursor-pointer ${
                active ? 'bg-[#0a3b69] text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {signUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              {signUp ? 'Sign Up' : 'Sign In'}
            </button>
          );
        })}
      </div>

      {/* ── Sign up ── */}
      <div
        style={{ transition: MORPH }}
        className={`w-full md:w-1/2 md:absolute md:top-0 md:h-full p-4 sm:p-6 md:p-12 flex-col justify-center ${
          isSignUp ? 'flex md:translate-x-full md:opacity-100 md:z-10' : 'hidden md:flex md:translate-x-0 md:opacity-0 md:pointer-events-none md:z-0'
        }`}
        {...inactiveProps(!isSignUp)}
      >
        <form onSubmit={handleSignUpSubmit} className="relative w-full flex flex-col gap-3.5 sm:gap-4" noValidate autoComplete="off">
          <Honeypot />
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">Create account</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">{activePortal.signUpDesc}</p>
          </div>

          <RoleSwitcher value={portalKey} onChange={handlePortalSelect} />
          {isSignUp && <FormMessage message={message} />}

          <div className="flex flex-col gap-2.5 sm:gap-3">
            <Field
              label={activePortal.role === 'patient' ? 'Full name' : 'Name of person in charge'}
              type="text"
              name="fullname"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Asha Rao"
            />
            {activePortal.role !== 'patient' && (
              <Field
                label="Hospital or health office"
                icon={Hospital}
                type="text"
                name="organization"
                autoComplete="organization"
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
                placeholder="e.g. SmartCare Community Hospital"
              />
            )}
            <Field
              label="Email"
              icon={Mail}
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="off"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <PasswordField
              label="Create password"
              name="new-password"
              autoComplete="new-password"
              visible={showSignUpPwd}
              onToggle={() => setShowSignUpPwd((v) => !v)}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
            <PasswordField
              label="Confirm password"
              name="confirm-password"
              autoComplete="new-password"
              visible={showSignUpPwd}
              onToggle={() => setShowSignUpPwd((v) => !v)}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Type it again"
            />
          </div>

          <button type="submit" disabled={isLoading} className={PRIMARY_BTN}>
            {isLoading ? (
              <>
                <Activity className="w-4 h-4 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <span>{activePortal.signUpBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="md:hidden text-center text-xs text-slate-500 mt-1">
            Already have an account?{' '}
            <button type="button" onClick={() => showMode(false)} className="font-bold text-blue-600 dark:text-blue-400 underline ml-1 py-2 cursor-pointer">
              Sign In
            </button>
          </p>
        </form>
      </div>

      {/* ── Sign in (and password reset) ── */}
      <div
        style={{ transition: MORPH }}
        className={`w-full md:w-1/2 md:absolute md:top-0 md:left-0 md:h-full p-4 sm:p-6 md:p-12 flex-col justify-center ${
          isSignUp ? 'hidden md:flex md:translate-x-full md:opacity-0 md:pointer-events-none md:z-0' : 'flex md:translate-x-0 md:opacity-100 md:z-10'
        }`}
        {...inactiveProps(isSignUp)}
      >
        {isRecovering ? (
          <form onSubmit={handleRecoverySubmit} className="relative w-full flex flex-col gap-4" autoComplete="off">
            <Honeypot />
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                <KeyRound className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Reset password</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Enter your email and we will send you a link to choose a new password.</p>
            </div>
            <Field
              label="Email"
              icon={Mail}
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="off"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <button type="submit" className={PRIMARY_BTN}>
              <Mail className="w-4 h-4" /> Send reset link
            </button>
            <button type="button" onClick={() => setIsRecovering(false)} className="text-xs font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 self-center py-3 cursor-pointer transition-colors">
              Back to sign in
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignInSubmit} className="relative w-full flex flex-col gap-3.5 sm:gap-4" noValidate autoComplete="on">
            <Honeypot />
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">Sign in</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">{activePortal.signInDesc}</p>
            </div>

            <RoleSwitcher value={portalKey} onChange={handlePortalSelect} />
            {!isSignUp && <FormMessage message={message} />}
            {signInLocked && (
              <div className="flex flex-col gap-1.5">
                <FormMessage
                  message={{ text: `Too many tries. You can try again in ${throttle.lockedFor} seconds.`, type: 'error' }}
                />
                <button
                  type="button"
                  onClick={() => throttle.reset()}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer self-center py-1"
                >
                  Clear lock &amp; use demo login
                </button>
              </div>
            )}

            <div className="flex flex-col gap-2.5 sm:gap-3">
              <Field
                label="Email"
                icon={Mail}
                type="email"
                name="username"
                autoComplete="username"
                inputMode="email"
                autoCapitalize="off"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
              {activePortal.role !== 'patient' && (
                <Field
                  label="Hospital or health office"
                  icon={Hospital}
                  type="text"
                  name="organization"
                  autoComplete="organization"
                  value={facility}
                  onChange={(e) => setFacility(e.target.value)}
                  placeholder="SmartCare Community Hospital"
                />
              )}
              <PasswordField
                label="Password"
                name="password"
                autoComplete="current-password"
                visible={showSignInPwd}
                onToggle={() => setShowSignInPwd((v) => !v)}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setIsRecovering(true);
                setMessage(null);
              }}
              className="self-end text-xs font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2 cursor-pointer"
            >
              Forgot your password?
            </button>

            <button type="submit" disabled={isLoading || signInLocked} className={PRIMARY_BTN}>
              {isLoading ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>{activePortal.signInBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="md:hidden text-center text-xs text-slate-500 mt-1">
              New here?{' '}
              <button type="button" onClick={() => showMode(true)} className="font-bold text-blue-600 dark:text-blue-400 underline ml-1 py-2 cursor-pointer">
                Create an account
              </button>
            </p>
          </form>
        )}
      </div>

      {/* ── Sliding panel (desktop only) ── */}
      <div
        style={{ transition: MORPH }}
        className={`hidden md:block absolute top-0 left-1/2 w-1/2 h-full overflow-hidden z-30 ${
          isSignUp ? '-translate-x-full rounded-[0px_150px_100px_0px]' : 'translate-x-0 rounded-[150px_0px_0px_100px]'
        }`}
      >
        <div
          style={{ transition: MORPH }}
          className={`relative -left-full w-[200%] h-full bg-gradient-to-br from-[#0f5ca8] to-[#0a3b69] text-white shadow-inner ${
            isSignUp ? 'translate-x-1/2' : 'translate-x-0'
          }`}
        >
          <div
            style={{ transition: MORPH }}
            className={`absolute top-0 left-0 w-1/2 h-full flex flex-col items-center justify-center p-8 lg:p-12 text-center ${
              isSignUp ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center mb-4 shadow-lg">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2 leading-tight">Welcome back</h2>
            <p className="text-xs text-blue-100/90 leading-relaxed max-w-[260px] mb-8">Already have an account? Sign in to pick up where you left off.</p>
            <button type="button" onClick={() => showMode(false)} className={OUTLINE_BTN}>
              <LogIn className="w-4 h-4" /> SIGN IN
            </button>
          </div>

          <div
            style={{ transition: MORPH }}
            className={`absolute top-0 right-0 w-1/2 h-full flex flex-col items-center justify-center p-8 lg:p-12 text-center ${
              isSignUp ? 'translate-x-full' : 'translate-x-0'
            }`}
          >
            <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center mb-4 shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2 leading-tight">New to SmartCare?</h2>
            <p className="text-xs text-blue-100/90 leading-relaxed max-w-[260px] mb-8">Create an account in a minute and skip the waiting-room queue.</p>
            <button type="button" onClick={() => showMode(true)} className={OUTLINE_BTN}>
              <UserPlus className="w-4 h-4" /> SIGN UP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MorphingAuthCard;
