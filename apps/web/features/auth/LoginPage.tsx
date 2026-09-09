'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Eye, EyeOff, LogIn, UserPlus, UserRound, Hospital, Building2, ListChecks, ShieldCheck, Clock3, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { DemoDB } from '@/lib/db/demo-db';
import type { UserRole } from '@smartcare/types';

type AuthMode = 'signin' | 'signup' | 'recovery';

const DEMO_CREDENTIALS = {
  patient: { email: 'patient@smartcare.demo', password: 'demo1234', role: 'patient' as UserRole, hospital: 'SmartCare Community Hospital' },
  doctor: { email: 'hospital@smartcare.demo', password: 'demo1234', role: 'doctor' as UserRole, hospital: 'SmartCare Community Hospital' },
  staff: { email: 'admin@smartcare.demo', password: 'demo1234', role: 'staff' as UserRole, hospital: 'SmartCare Community Hospital' },
};

const ROLE_LABELS: Record<UserRole, string> = {
  patient: 'Patient portal',
  doctor: 'Hospital care workspace',
  staff: 'Hospital Operations portal',
};

export function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, auth, setAuthTarget, showToast } = useAppStore(useShallow((s) => ({
    login: s.login,
    auth: s.auth,
    setAuthTarget: s.setAuthTarget,
    showToast: s.showToast,
  })));

  const [role, setRole] = useState<UserRole>((searchParams.get('role') as UserRole) || auth.targetRole || 'patient');
  const [mode, setMode] = useState<AuthMode>((searchParams.get('mode') as AuthMode) || 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [facility, setFacility] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const isPatient = role === 'patient';

  const markTouched = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordValid = mode === 'signup' ? password.length >= 8 : password.length > 0;
  const confirmValid = mode === 'signup' ? confirm.length > 0 && confirm === password : true;
  const nameValid = isPatient && mode === 'signup' ? name.trim().length > 0 : true;
  const facilityValid = !isPatient ? facility.trim().length > 0 : true;

  const handleRoleChange = useCallback((newRole: UserRole) => {
    setRole(newRole);
    setAuthTarget(newRole);
    setMessage('');
    setTouched({});
    const params = new URLSearchParams(searchParams.toString());
    params.set('role', newRole);
    router.replace(`/login?${params.toString()}`, { scroll: false });
  }, [setAuthTarget, searchParams, router]);

  const handleModeChange = useCallback((newMode: AuthMode) => {
    setMode(newMode);
    setMessage('');
    const params = new URLSearchParams(searchParams.toString());
    params.set('mode', newMode);
    router.replace(`/login?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true, facility: true });
    if (!emailValid) { setMessage('Please enter a valid email address.'); setMessageType('error'); return; }
    if (!password) { setMessage('Please enter your password.'); setMessageType('error'); return; }
    if (!isPatient && !facilityValid) { setMessage('Please enter your care centre name.'); setMessageType('error'); return; }
    setLoading(true);
    setMessage('');
    try {
      const result = await DemoDB.checkCredentials(isPatient ? '' : facility, email, password, role);
      if (!result.success) { setMessage(result.error || 'Sign in failed.'); setMessageType('error'); return; }
      const u = result.user!;
      login(u.email, u.role as UserRole, { hospital: u.hospital || '', country: u.country || 'India', state: u.state || '', city: u.city || '' });
      showToast('Signed in successfully', 'success');
      const dest = u.role === 'patient' ? '/dashboard/patient' : u.role === 'doctor' ? '/dashboard/hospital' : '/dashboard/admin';
      router.push(dest);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true, confirm: true, name: true, facility: true });
    if (!emailValid) { setMessage('Please enter a valid email address.'); setMessageType('error'); return; }
    if (isPatient && !nameValid) { setMessage('Please enter your full name.'); setMessageType('error'); return; }
    if (!isPatient && !facilityValid) { setMessage('Please enter your care centre name.'); setMessageType('error'); return; }
    if (password.length < 8) { setMessage('Password must be at least 8 characters.'); setMessageType('error'); return; }
    if (password !== confirm) { setMessage('Passwords do not match.'); setMessageType('error'); return; }
    setLoading(true);
    setMessage('');
    try {
      let result;
      if (isPatient) {
        result = await DemoDB.registerPatient({ email, password, name });
      } else {
        result = await DemoDB.registerProfessional({ email, password, role, hospital: facility });
      }
      if (!result.success) { setMessage(result.error || 'Registration failed.'); setMessageType('error'); return; }
      if (result.user) {
        const u = result.user;
        login(u.email, u.role as UserRole, {
          hospital: u.hospital || (isPatient ? 'SmartCare Community Hospital' : facility),
          country: u.country || 'India',
          state: u.state || 'Telangana',
          city: u.city || 'Hyderabad',
        });
        showToast('Account created! Signed in successfully.', 'success');
        const dest = u.role === 'patient' ? '/dashboard/patient' : u.role === 'doctor' ? '/dashboard/hospital' : '/dashboard/admin';
        router.push(dest);
        return;
      }
      setMessageType('success');
      setMessage('Account created. You can now sign in.');
      setMode('signin');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoRole: 'patient' | 'doctor' | 'staff') => {
    const creds = DEMO_CREDENTIALS[demoRole];
    setLoading(true);
    try {
      const result = await DemoDB.checkCredentials(creds.hospital, creds.email, creds.password, creds.role);
      if (result.success && result.user) {
        const u = result.user;
        login(u.email, u.role as UserRole, { hospital: u.hospital || '', country: u.country || 'India', state: u.state || '', city: u.city || '' });
        showToast(`Signed in as ${demoRole} demo`, 'success');
        const dest = u.role === 'patient' ? '/dashboard/patient' : u.role === 'doctor' ? '/dashboard/hospital' : '/dashboard/admin';
        router.push(dest);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[var(--surface-sunken)] flex">
      {/* Aside panel (desktop) */}
      <aside className="hidden lg:flex lg:w-96 bg-gradient-to-br from-[var(--teal)] to-[var(--teal-dark)] text-white flex-col justify-center p-10 gap-8">
        <div>
          <div className="eyebrow mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-white/70 inline-block mr-1.5" />
            Role-based access
          </div>
          <h1 className="text-3xl font-extrabold mb-4">Keep care moving.</h1>
          <p className="text-white/80 leading-relaxed">Use SmartCare to see the queue clearly, prepare the next visit, and keep patients informed.</p>
        </div>
        <ul className="flex flex-col gap-3">
          {[['list-checks', 'Live queue visibility'], ['shield-check', 'Secure role separation'], ['clock-3', 'Fewer desk handoffs']].map(([_, label]) => (
            <li key={label} className="flex items-center gap-3 text-sm text-white/90">
              <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center shrink-0">
                <ListChecks size={13} />
              </div>
              {label}
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-6 border-t border-white/20">
          <p className="text-xs text-white/60">SmartCare Demo Environment · Data is browser-local only.</p>
        </div>
      </aside>

      {/* Main auth panel */}
      <main
        className="flex-1 flex items-center justify-center p-3 sm:p-5 py-6 sm:py-10"
        data-section="portal-login"
        aria-labelledby="auth-title"
      >
        <div className="w-full max-w-md">
          {/* Mode tabs */}
          <div className="flex gap-1.5 p-1 bg-[var(--surface)] border border-[var(--line)] rounded-full mb-5">
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleModeChange(m)}
                aria-selected={mode === m}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 min-h-[44px] rounded-full text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer',
                  mode === m
                    ? 'bg-[var(--teal)] text-white shadow-xs'
                    : 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)]'
                )}
              >
                {m === 'signin' ? <><LogIn size={15} /> Sign In</> : <><UserPlus size={15} /> Sign Up</>}
              </button>
            ))}
          </div>

          {/* Role tabs */}
          <div className="flex gap-1.5 sm:gap-2 mb-6" role="tablist" aria-label="Choose portal">
            {(['patient', 'doctor', 'staff'] as const).map((r) => {
              const Icon = r === 'patient' ? UserRound : r === 'doctor' ? Hospital : Building2;
              const labels = { patient: 'Patient', doctor: 'Hospital', staff: 'Staff' };
              return (
                <button
                  key={r}
                  type="button"
                  role="tab"
                  aria-selected={role === r}
                  onClick={() => handleRoleChange(r)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1 sm:gap-1.5 min-h-[44px] px-2 rounded-xl text-xs font-semibold transition-all border active:scale-95 cursor-pointer',
                    role === r
                      ? 'bg-[var(--mint)] border-[var(--teal)]/40 text-[var(--teal)] font-bold shadow-xs'
                      : 'bg-[var(--surface)] border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--surface-sunken)]'
                  )}
                >
                  <Icon size={14} className="shrink-0" />
                  <span className="truncate">{labels[r]}</span>
                </button>
              );
            })}
          </div>

          {/* Panel header */}
          <div className="mb-5">
            <div className="eyebrow mb-2">
              <span className="eyebrow-dot" />
              {ROLE_LABELS[role]}
            </div>
            <h2 id="auth-title" className="text-xl font-bold">
              {mode === 'signin' ? 'Sign in to your workspace' : mode === 'signup' ? (isPatient ? 'Create a patient account' : 'Create a hospital account') : 'Recover your access'}
            </h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {mode === 'signin'
                ? (isPatient ? 'Use your email and password to continue.' : 'Use your work email and care centre details to continue.')
                : isPatient
                ? 'Create an account that persists in this browser for repeat demo visits.'
                : 'Create a hospital account that persists in this browser for presentation testing.'}
            </p>
          </div>

          {/* Message */}
          {message && (
            <div
              role="alert"
              className={cn(
                'text-sm px-4 py-3 rounded-[var(--radius)] mb-4 border',
                messageType === 'error' ? 'bg-[var(--red-bg)] border-[var(--red)] text-[var(--red)]' : 'bg-[var(--green-bg)] border-[var(--green)] text-[var(--green)]'
              )}
            >
              {message}
            </div>
          )}

          {/* Sign in form */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="flex flex-col gap-4" noValidate>
              {/* Quick Demo Autofill Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-[var(--radius)] bg-[var(--mint)] border border-[var(--teal)]/20 text-xs text-[var(--teal)]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-bold shrink-0">Demo:</span>
                  <span className="font-mono text-[11px] bg-white/80 dark:bg-black/30 px-1.5 py-0.5 rounded truncate">
                    {DEMO_CREDENTIALS[role].email}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const creds = DEMO_CREDENTIALS[role];
                      setEmail(creds.email);
                      setPassword(creds.password);
                      if (role !== 'patient') setFacility(creds.hospital);
                      setTouched({ email: true, password: true });
                    }}
                    className="font-bold underline hover:opacity-80"
                  >
                    Auto-fill
                  </button>
                  <span className="text-[var(--line-strong)]">·</span>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleDemoLogin(role)}
                    className="font-bold bg-[var(--teal)] text-white px-2 py-0.5 rounded shadow-sm hover:bg-[var(--teal-dark)] transition-colors"
                  >
                    1-Click In
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="auth-email" className="text-sm font-medium flex items-center justify-between">
                  <span>{isPatient ? 'Email address' : 'Work email'} <span className="text-[var(--red)]">*</span></span>
                  {touched.email && (emailValid ? (
                    <span className="text-xs text-[var(--green)] flex items-center gap-1 font-normal"><CheckCircle2 size={12} /> Valid</span>
                  ) : (
                    <span className="text-xs text-[var(--red)] flex items-center gap-1 font-normal"><XCircle size={12} /> Invalid email</span>
                  ))}
                </label>
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => markTouched('email')}
                  placeholder={isPatient ? 'you@example.com' : 'name@carecentre.org'}
                  required
                  className={cn(
                    'h-11 px-3 rounded-[var(--radius)] border text-sm transition-colors focus:outline-none focus:ring-1',
                    touched.email && !emailValid
                      ? 'border-[var(--red)] bg-red-500/5 focus:border-[var(--red)] focus:ring-[var(--red)]/20'
                      : touched.email && emailValid
                      ? 'border-[var(--green)] bg-emerald-500/5 focus:border-[var(--green)] focus:ring-[var(--green)]/20'
                      : 'border-[var(--line)] bg-[var(--surface)] focus:border-[var(--teal)] focus:ring-[var(--teal)]/20'
                  )}
                />
              </div>
              {!isPatient && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="auth-facility" className="text-sm font-medium flex items-center justify-between">
                    <span>Care centre <span className="text-[var(--red)]">*</span></span>
                    {touched.facility && !facilityValid && (
                      <span className="text-xs text-[var(--red)] flex items-center gap-1 font-normal"><XCircle size={12} /> Required</span>
                    )}
                  </label>
                  <input
                    id="auth-facility"
                    value={facility}
                    onChange={(e) => setFacility(e.target.value)}
                    onBlur={() => markTouched('facility')}
                    placeholder="e.g. SmartCare Community Hospital"
                    required
                    className={cn(
                      'h-11 px-3 rounded-[var(--radius)] border text-sm transition-colors focus:outline-none focus:ring-1',
                      touched.facility && !facilityValid
                        ? 'border-[var(--red)] bg-red-500/5 focus:border-[var(--red)] focus:ring-[var(--red)]/20'
                        : 'border-[var(--line)] bg-[var(--surface)] focus:border-[var(--teal)] focus:ring-[var(--teal)]/20'
                    )}
                  />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="auth-password" className="text-sm font-medium flex items-center justify-between">
                  <span>Password <span className="text-[var(--red)]">*</span></span>
                  {touched.password && !passwordValid && (
                    <span className="text-xs text-[var(--red)] flex items-center gap-1 font-normal"><XCircle size={12} /> Required</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    id="auth-password"
                    type={passwordVisible ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => markTouched('password')}
                    placeholder="Enter your password"
                    required
                    className={cn(
                      'w-full h-11 pl-3 pr-10 rounded-[var(--radius)] border text-sm transition-colors focus:outline-none focus:ring-1',
                      touched.password && !passwordValid
                        ? 'border-[var(--red)] bg-red-500/5 focus:border-[var(--red)] focus:ring-[var(--red)]/20'
                        : 'border-[var(--line)] bg-[var(--surface)] focus:border-[var(--teal)] focus:ring-[var(--teal)]/20'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
                  >
                    {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => setMode('recovery')} className="text-xs text-[var(--teal)] hover:underline">
                  Forgot password?
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 min-h-[48px] h-12 rounded-xl bg-[var(--teal)] text-white font-bold text-sm hover:bg-[var(--teal-dark)] active:scale-[0.98] transition-all disabled:opacity-60 shadow-sm"
              >
                {loading ? 'Signing in…' : (isPatient ? 'Continue to patient portal' : `Sign in to ${role === 'doctor' ? 'hospital' : 'admin'} portal`)}
                {!loading && <ArrowRight size={15} />}
              </button>
              <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
                <span>{isPatient ? 'Part of a hospital team?' : 'New hospital user?'}</span>
                <button type="button" onClick={() => { setMode('signup'); setTouched({}); }} className="text-[var(--teal)] font-semibold hover:underline">
                  {isPatient ? 'Open hospital access' : 'Create an account'}
                </button>
              </div>
            </form>
          )}

          {/* Sign up form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="flex flex-col gap-4" noValidate>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="auth-email" className="text-sm font-medium flex items-center justify-between">
                  <span>{isPatient ? 'Email address' : 'Work email'} <span className="text-[var(--red)]">*</span></span>
                  {touched.email && (emailValid ? (
                    <span className="text-xs text-[var(--green)] flex items-center gap-1 font-normal"><CheckCircle2 size={12} /> Valid</span>
                  ) : (
                    <span className="text-xs text-[var(--red)] flex items-center gap-1 font-normal"><XCircle size={12} /> Invalid email</span>
                  ))}
                </label>
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => markTouched('email')}
                  placeholder={isPatient ? 'you@example.com' : 'name@carecentre.org'}
                  required
                  className={cn(
                    'h-11 px-3 rounded-[var(--radius)] border text-sm transition-colors focus:outline-none focus:ring-1',
                    touched.email && !emailValid
                      ? 'border-[var(--red)] bg-red-500/5 focus:border-[var(--red)] focus:ring-[var(--red)]/20'
                      : touched.email && emailValid
                      ? 'border-[var(--green)] bg-emerald-500/5 focus:border-[var(--green)] focus:ring-[var(--green)]/20'
                      : 'border-[var(--line)] bg-[var(--surface)] focus:border-[var(--teal)] focus:ring-[var(--teal)]/20'
                  )}
                />
              </div>
              {isPatient ? (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="auth-name" className="text-sm font-medium flex items-center justify-between">
                    <span>Full name <span className="text-[var(--red)]">*</span></span>
                    {touched.name && !nameValid && (
                      <span className="text-xs text-[var(--red)] flex items-center gap-1 font-normal"><XCircle size={12} /> Required</span>
                    )}
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => markTouched('name')}
                    placeholder="e.g. Asha Rao"
                    required
                    className={cn(
                      'h-11 px-3 rounded-[var(--radius)] border text-sm transition-colors focus:outline-none focus:ring-1',
                      touched.name && !nameValid
                        ? 'border-[var(--red)] bg-red-500/5 focus:border-[var(--red)] focus:ring-[var(--red)]/20'
                        : 'border-[var(--line)] bg-[var(--surface)] focus:border-[var(--teal)] focus:ring-[var(--teal)]/20'
                    )}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="auth-facility" className="text-sm font-medium flex items-center justify-between">
                    <span>Care centre name <span className="text-[var(--red)]">*</span></span>
                    {touched.facility && !facilityValid && (
                      <span className="text-xs text-[var(--red)] flex items-center gap-1 font-normal"><XCircle size={12} /> Required</span>
                    )}
                  </label>
                  <input
                    id="auth-facility"
                    value={facility}
                    onChange={(e) => setFacility(e.target.value)}
                    onBlur={() => markTouched('facility')}
                    placeholder="Your registered care centre"
                    required
                    className={cn(
                      'h-11 px-3 rounded-[var(--radius)] border text-sm transition-colors focus:outline-none focus:ring-1',
                      touched.facility && !facilityValid
                        ? 'border-[var(--red)] bg-red-500/5 focus:border-[var(--red)] focus:ring-[var(--red)]/20'
                        : 'border-[var(--line)] bg-[var(--surface)] focus:border-[var(--teal)] focus:ring-[var(--teal)]/20'
                    )}
                  />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="auth-password" className="text-sm font-medium flex items-center justify-between">
                  <span>Create password <span className="text-[var(--red)]">*</span></span>
                  {touched.password && (passwordValid ? (
                    <span className="text-xs text-[var(--green)] flex items-center gap-1 font-normal"><CheckCircle2 size={12} /> ≥8 chars</span>
                  ) : (
                    <span className="text-xs text-[var(--red)] flex items-center gap-1 font-normal"><XCircle size={12} /> Min 8 chars</span>
                  ))}
                </label>
                <div className="relative">
                  <input
                    id="auth-password"
                    type={passwordVisible ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => markTouched('password')}
                    placeholder="At least 8 characters"
                    required
                    className={cn(
                      'w-full h-11 pl-3 pr-10 rounded-[var(--radius)] border text-sm transition-colors focus:outline-none focus:ring-1',
                      touched.password && !passwordValid
                        ? 'border-[var(--red)] bg-red-500/5 focus:border-[var(--red)] focus:ring-[var(--red)]/20'
                        : touched.password && passwordValid
                        ? 'border-[var(--green)] bg-emerald-500/5 focus:border-[var(--green)] focus:ring-[var(--green)]/20'
                        : 'border-[var(--line)] bg-[var(--surface)] focus:border-[var(--teal)] focus:ring-[var(--teal)]/20'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    aria-label="Toggle password"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                  >
                    {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="auth-confirm" className="text-sm font-medium flex items-center justify-between">
                  <span>Confirm password <span className="text-[var(--red)]">*</span></span>
                  {touched.confirm && (confirmValid ? (
                    <span className="text-xs text-[var(--green)] flex items-center gap-1 font-normal"><CheckCircle2 size={12} /> Matches</span>
                  ) : (
                    <span className="text-xs text-[var(--red)] flex items-center gap-1 font-normal"><XCircle size={12} /> Does not match</span>
                  ))}
                </label>
                <input
                  id="auth-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onBlur={() => markTouched('confirm')}
                  placeholder="Repeat your password"
                  required
                  className={cn(
                    'h-11 px-3 rounded-[var(--radius)] border text-sm transition-colors focus:outline-none focus:ring-1',
                    touched.confirm && !confirmValid
                      ? 'border-[var(--red)] bg-red-500/5 focus:border-[var(--red)] focus:ring-[var(--red)]/20'
                      : touched.confirm && confirmValid && confirm.length > 0
                      ? 'border-[var(--green)] bg-emerald-500/5 focus:border-[var(--green)] focus:ring-[var(--green)]/20'
                      : 'border-[var(--line)] bg-[var(--surface)] focus:border-[var(--teal)] focus:ring-[var(--teal)]/20'
                  )}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 min-h-[48px] h-12 rounded-xl bg-[var(--teal)] text-white font-bold text-sm hover:bg-[var(--teal-dark)] active:scale-[0.98] disabled:opacity-60 transition-all shadow-sm"
              >
                {loading ? 'Creating account…' : (isPatient ? 'Create patient account' : 'Create hospital account')}
                {!loading && <ArrowRight size={15} />}
              </button>
              <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
                <span>Already registered?</span>
                <button type="button" onClick={() => { setMode('signin'); setTouched({}); }} className="text-[var(--teal)] font-semibold hover:underline">Return to sign in</button>
              </div>
            </form>
          )}

          {/* Recovery form */}
          {mode === 'recovery' && (
            <form onSubmit={(e) => { e.preventDefault(); setMessageType('error'); setMessage('Password recovery is unavailable in local demo mode.'); }} className="flex flex-col gap-4" noValidate>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="auth-email" className="text-sm font-medium">Account email <span className="text-[var(--red)]">*</span></label>
                <input id="auth-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@carecentre.org" required className="h-11 px-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] text-sm focus:outline-none focus:border-[var(--teal)]" />
              </div>
              <button type="submit" className="h-11 rounded-[var(--radius)] bg-[var(--teal)] text-white font-bold text-sm hover:bg-[var(--teal-dark)] transition-colors">Send reset link</button>
              <button type="button" onClick={() => setMode('signin')} className="text-sm text-[var(--text-muted)] hover:text-[var(--teal)]">← Back to sign in</button>
            </form>
          )}

          {/* Quick Demo */}
          <div className="mt-6 pt-5 border-t border-[var(--line)]">
            <div className="eyebrow mb-2">
              <span className="eyebrow-dot" />
              Quick Demo Sign-In
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-3">Open a ready-to-use workspace instantly for evaluation &amp; presentation.</p>
            <div className="flex flex-wrap gap-2">
              {(['patient', 'doctor', 'staff'] as const).map((r) => {
                const Icon = r === 'patient' ? UserRound : r === 'doctor' ? Hospital : Building2;
                const labels = { patient: 'Patient demo', doctor: 'Hospital demo', staff: 'Hospital Ops demo' };
                return (
                  <button
                    key={r}
                    type="button"
                    disabled={loading}
                    onClick={() => handleDemoLogin(r)}
                    className="flex items-center gap-1.5 min-h-[38px] px-3.5 rounded-full text-xs font-semibold border border-[var(--line)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--mint)] hover:text-[var(--teal)] hover:border-[var(--teal)]/30 active:scale-95 transition-all disabled:opacity-60"
                  >
                    <Icon size={13} /> {labels[r]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-xs text-[var(--text-muted)] hover:text-[var(--teal)] transition-colors no-underline">
              ← Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
