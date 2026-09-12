'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  UserRound,
  Hospital,
  Building2,
  ListChecks,
  ShieldCheck,
  Clock3,
  CheckCircle2,
  XCircle,
  HeartPulse,
  Mail,
  Lock,
  Sparkles,
  Sun,
  Moon,
  KeyRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Topbar } from '@/components/layout/Topbar';
import { useAppStore } from '@/lib/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { DemoDB } from '@/lib/db/demo-db';
import type { UserRole } from '@smartcare/types';

type AuthMode = 'signin' | 'signup' | 'recovery';

const DEMO_CREDENTIALS: Record<string, { email: string; password: string; role: UserRole; hospital: string; label: string; name: string }> = {
  patient: {
    email: 'patient@smartcare.demo',
    password: 'demo1234',
    role: 'patient',
    hospital: 'SmartCare Community Hospital',
    label: 'Patient Portal',
    name: 'Asha Rao (Citizen)',
  },
  doctor: {
    email: 'hospital@smartcare.demo',
    password: 'demo1234',
    role: 'doctor',
    hospital: 'SmartCare Community Hospital',
    label: 'Doctor / PHC',
    name: 'Dr. Arjun Rao (Clinical)',
  },
  cmo: {
    email: 'cmo@district.gov.in',
    password: 'demo1234',
    role: 'staff',
    hospital: 'Hyderabad District Health Directorate',
    label: 'District CMO',
    name: 'Dr. Rajeshwar Sharma (District CMO)',
  },
  staff: {
    email: 'commander@mohfw.gov.in',
    password: 'demo1234',
    role: 'staff',
    hospital: 'MoHFW State Control Desk',
    label: 'State Command',
    name: 'MoHFW Central Medical Command Hub',
  },
};

type PortalKey = 'doctor' | 'cmo' | 'commander' | 'patient';

const PORTAL_INFO: Record<PortalKey, { label: string; role: UserRole; badge: string; desc: string; icon: typeof UserRound; defaultFacility: string; defaultEmail: string }> = {
  doctor: {
    label: 'Doctor / PHC',
    role: 'doctor',
    badge: 'Clinical + Supply',
    desc: 'OPD queue triage, e-prescriptions, and AushadhiNet medicine shortage reporting.',
    icon: Hospital,
    defaultFacility: 'SmartCare Community Hospital',
    defaultEmail: 'hospital@smartcare.demo',
  },
  cmo: {
    label: 'District CMO',
    role: 'staff',
    badge: 'District Health Hub',
    desc: 'District warehouse replenishment, local PHC shortage aggregation, and rebalance approvals.',
    icon: ShieldCheck,
    defaultFacility: 'Hyderabad District Health Directorate',
    defaultEmail: 'cmo@district.gov.in',
  },
  commander: {
    label: 'State Command',
    role: 'staff',
    badge: 'MoHFW Central Command',
    desc: 'Inter-district health mesh, lack-of-medicine GIS heat map, and federated surge forecasting.',
    icon: Building2,
    defaultFacility: 'MoHFW State Control Desk',
    defaultEmail: 'commander@mohfw.gov.in',
  },
  patient: {
    label: 'Patient Portal',
    role: 'patient',
    badge: 'Citizen Access',
    desc: 'Book appointments, track queues live, and access digital prescriptions & emergency care.',
    icon: UserRound,
    defaultFacility: 'SmartCare Community Hospital',
    defaultEmail: 'patient@smartcare.demo',
  },
};

export function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, auth, setAuthTarget, showToast, theme, setTheme, fontScale, setFontScale } = useAppStore(
    useShallow((s) => ({
      login: s.login,
      auth: s.auth,
      setAuthTarget: s.setAuthTarget,
      showToast: s.showToast,
      theme: s.theme,
      setTheme: s.setTheme,
      fontScale: s.fontScale,
      setFontScale: s.setFontScale,
    }))
  );

  const [portalKey, setPortalKey] = useState<PortalKey>(() => {
    const p = searchParams.get('portal') as PortalKey;
    if (p && PORTAL_INFO[p]) return p;
    const r = searchParams.get('role');
    if (r === 'patient') return 'patient';
    if (r === 'staff') return 'cmo';
    return 'doctor';
  });

  const [role, setRole] = useState<UserRole>(PORTAL_INFO[portalKey]?.role || 'doctor');
  const [mode, setMode] = useState<AuthMode>((searchParams.get('mode') as AuthMode) || 'signin');
  const [email, setEmail] = useState(PORTAL_INFO[portalKey]?.defaultEmail || '');
  const [password, setPassword] = useState('demo1234');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [facility, setFacility] = useState(PORTAL_INFO[portalKey]?.defaultFacility || '');
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

  const handlePortalChange = useCallback((newPortal: PortalKey) => {
    const info = PORTAL_INFO[newPortal];
    setPortalKey(newPortal);
    setRole(info.role);
    setAuthTarget(info.role);
    setEmail(info.defaultEmail);
    setPassword('demo1234');
    if (info.role !== 'patient') {
      setFacility(info.defaultFacility);
    }
    setMessage('');
    setTouched({});
    const params = new URLSearchParams(searchParams.toString());
    params.set('portal', newPortal);
    params.set('role', info.role);
    router.replace(`/login?${params.toString()}`, { scroll: false });
  }, [setAuthTarget, searchParams, router]);

  const handleRoleChange = useCallback((newRole: UserRole) => {
    const pk: PortalKey = newRole === 'doctor' ? 'doctor' : newRole === 'staff' ? 'cmo' : 'patient';
    handlePortalChange(pk);
  }, [handlePortalChange]);

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
      if (!result.success) { setMessage(result.error || 'Sign in failed. Check your credentials.'); setMessageType('error'); return; }
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

  const handleDemoLogin = async (demoKey: 'patient' | 'doctor' | 'cmo' | 'staff') => {
    const creds = DEMO_CREDENTIALS[demoKey];
    setLoading(true);
    try {
      const result = await DemoDB.checkCredentials(creds.hospital, creds.email, creds.password, creds.role);
      if (result.success && result.user) {
        const u = result.user;
        login(u.email, u.role as UserRole, { hospital: u.hospital || '', country: u.country || 'India', state: u.state || '', city: u.city || '' });
        showToast(`Signed in as ${creds.label} demo`, 'success');
        const dest = u.role === 'patient' ? '/dashboard/patient' : u.role === 'doctor' ? '/dashboard/hospital' : '/dashboard/admin';
        router.push(dest);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAutofill = (demoKey: 'patient' | 'doctor' | 'cmo' | 'staff') => {
    const creds = DEMO_CREDENTIALS[demoKey];
    const targetPortal: PortalKey = demoKey === 'staff' ? 'commander' : (demoKey as PortalKey);
    setPortalKey(targetPortal);
    setRole(creds.role);
    setEmail(creds.email);
    setPassword(creds.password);
    if (creds.role !== 'patient') setFacility(creds.hospital);
    setTouched({ email: true, password: true, facility: true });
    setMode('signin');
    setMessage(`Autofilled demo credentials for ${creds.label} (${creds.name}). Click "Sign In" below to enter.`);
    setMessageType('success');
  };

  const ThemeIcon = theme === 'dark' ? Moon : Sun;

  return (
    <div className="min-h-dvh bg-[var(--canvas)] flex flex-col justify-between text-[var(--text)]">
      {/* ── Brand Topbar (Consistent with Landing Page) ────────────────────── */}
      <Topbar variant="landing" />

      {/* ── Main Auth Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-md mx-auto">
          {/* Card Container */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-black/5 relative overflow-hidden">
            {/* Top decorative accent line */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[var(--teal)] via-blue-500 to-[var(--teal-dark)]" />

            {/* 1. Mode Switcher (Sign In vs Sign Up) */}
            <div className="flex p-1 bg-[var(--surface-sunken)] border border-[var(--line)] rounded-xl mb-5">
              <button
                type="button"
                onClick={() => handleModeChange('signin')}
                aria-selected={mode === 'signin'}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all active:scale-[0.98] cursor-pointer',
                  mode === 'signin'
                    ? 'bg-[var(--teal)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                )}
              >
                <LogIn size={15} />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('signup')}
                aria-selected={mode === 'signup'}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all active:scale-[0.98] cursor-pointer',
                  mode === 'signup'
                    ? 'bg-[var(--teal)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                )}
              >
                <UserPlus size={15} />
                <span>Sign Up</span>
              </button>
            </div>

            {/* 2. Portal Selector (Doctor, District CMO, State Command, Patient) */}
            <div className="mb-5">
              <div className="text-[11px] font-black uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center justify-between">
                <span>Select Portal</span>
                <span className="text-[10px] font-semibold text-[var(--teal)]">4 Public Health Tiers</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="tablist">
                {(['doctor', 'cmo', 'commander', 'patient'] as const).map((pk) => {
                  const info = PORTAL_INFO[pk];
                  const Icon = info.icon;
                  const isSelected = portalKey === pk;
                  return (
                    <button
                      key={pk}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => handlePortalChange(pk)}
                      className={cn(
                        'flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all cursor-pointer min-h-[58px]',
                        isSelected
                          ? 'bg-[var(--mint)] border-[var(--teal)] text-[var(--teal)] font-black shadow-xs ring-1 ring-[var(--teal)]/30'
                          : 'bg-[var(--surface)] border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text)]'
                      )}
                    >
                      <Icon size={18} className={cn('mb-1', isSelected ? 'text-[var(--teal)]' : 'text-[var(--text-muted)]')} />
                      <span className="text-[11px] font-extrabold leading-tight">{info.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Role Summary Banner */}
            {(() => {
              const currentInfo = PORTAL_INFO[portalKey];
              const RoleIcon = currentInfo.icon;
              return (
                <div className="p-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] mb-5 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[var(--mint)] text-[var(--teal)] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    <RoleIcon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <strong className="text-xs font-black text-[var(--text)]">{currentInfo.label}</strong>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[var(--teal)]/10 text-[var(--teal)]">
                        {currentInfo.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">
                      {currentInfo.desc}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* 4. Demo Autofill (4 Personas: Doctor, District CMO, State Commander, Patient) */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-[var(--mint)] to-blue-50/70 dark:to-blue-950/30 border border-[var(--teal)]/25 mb-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-[var(--teal)] flex items-center gap-1">
                  <Sparkles size={13} />
                  Instant Demo Access &bull; 4 Tiers
                </span>
                <span className="text-[10px] font-semibold text-[var(--text-muted)]">
                  Tap to autofill
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'doctor' as const, label: 'Doctor / PHC', icon: Hospital, desc: 'Clinical & SOS Stock' },
                  { key: 'cmo' as const, label: 'District CMO', icon: ShieldCheck, desc: 'District Mesh & Depot' },
                  { key: 'staff' as const, label: 'State Command', icon: Building2, desc: 'MoHFW & Heat Map' },
                  { key: 'patient' as const, label: 'Patient Portal', icon: UserRound, desc: 'Queue & Digital Rx' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isCurrent = email === DEMO_CREDENTIALS[item.key].email;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleAutofill(item.key)}
                      className={cn(
                        'flex flex-col items-start p-2.5 rounded-xl text-left transition-all cursor-pointer border min-h-[48px]',
                        isCurrent
                          ? 'bg-[var(--teal)] text-white border-[var(--teal)] shadow-sm'
                          : 'bg-[var(--surface)] text-[var(--teal-dark)] border-[var(--line)] hover:bg-[var(--mint)] hover:border-[var(--teal)]/40'
                      )}
                    >
                      <div className="flex items-center gap-1.5 font-extrabold text-xs">
                        <Icon size={14} className={isCurrent ? 'text-white' : 'text-[var(--teal)]'} />
                        <span>{item.label}</span>
                      </div>
                      <span className={cn('text-[10px] mt-0.5 leading-none', isCurrent ? 'text-white/85' : 'text-[var(--text-muted)]')}>
                        {item.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feedback Message */}
            {message && (
              <div
                role="alert"
                className={cn(
                  'text-xs px-3.5 py-2.5 rounded-xl mb-4 border flex items-center gap-2',
                  messageType === 'error'
                    ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400'
                    : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                )}
              >
                {messageType === 'error' ? <XCircle size={15} className="shrink-0" /> : <CheckCircle2 size={15} className="shrink-0" />}
                <span>{message}</span>
              </div>
            )}

            {/* ── Form: Sign In ────────────────────────────────────────────── */}
            {mode === 'signin' && (
              <form onSubmit={handleSignIn} className="flex flex-col gap-3.5" noValidate>
                {/* Email Input */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="auth-email" className="text-xs font-bold text-[var(--text)] flex items-center justify-between">
                    <span>{isPatient ? 'Email Address' : 'Work Email'}</span>
                    {touched.email && (emailValid ? (
                      <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold"><CheckCircle2 size={11} /> Valid</span>
                    ) : (
                      <span className="text-[11px] text-red-600 flex items-center gap-1 font-semibold"><XCircle size={11} /> Invalid</span>
                    ))}
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                    <input
                      id="auth-email"
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => markTouched('email')}
                      placeholder={isPatient ? 'you@example.com' : 'clinician@hospital.org'}
                      required
                      className={cn(
                        'w-full h-11 pl-10 pr-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2',
                        touched.email && !emailValid
                          ? 'border-red-400 bg-red-500/5 focus:ring-red-400/20'
                          : touched.email && emailValid
                          ? 'border-emerald-400 bg-emerald-500/5 focus:ring-emerald-400/20'
                          : 'border-[var(--line)] bg-[var(--surface)] focus:border-[var(--teal)] focus:ring-[var(--teal)]/20'
                      )}
                    />
                  </div>
                </div>

                {/* Care Centre Input (Doctor & Staff) */}
                {!isPatient && (
                  <div className="flex flex-col gap-1">
                    <label htmlFor="auth-facility" className="text-xs font-bold text-[var(--text)] flex items-center justify-between">
                      <span>Care Centre / Hospital</span>
                      {touched.facility && !facilityValid && (
                        <span className="text-[11px] text-red-600 flex items-center gap-1 font-semibold"><XCircle size={11} /> Required</span>
                      )}
                    </label>
                    <div className="relative">
                      <Hospital size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                      <input
                        id="auth-facility"
                        value={facility}
                        onChange={(e) => setFacility(e.target.value)}
                        onBlur={() => markTouched('facility')}
                        placeholder="e.g. SmartCare Community Hospital"
                        required
                        className={cn(
                          'w-full h-11 pl-10 pr-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2',
                          touched.facility && !facilityValid
                            ? 'border-red-400 bg-red-500/5 focus:ring-red-400/20'
                            : 'border-[var(--line)] bg-[var(--surface)] focus:border-[var(--teal)] focus:ring-[var(--teal)]/20'
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Password Input */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="auth-password" className="text-xs font-bold text-[var(--text)]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode('recovery')}
                      className="text-xs text-[var(--teal)] hover:underline font-semibold"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
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
                        'w-full h-11 pl-10 pr-10 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2',
                        touched.password && !passwordValid
                          ? 'border-red-400 bg-red-500/5 focus:ring-red-400/20'
                          : 'border-[var(--line)] bg-[var(--surface)] focus:border-[var(--teal)] focus:ring-[var(--teal)]/20'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible(!passwordVisible)}
                      aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] p-1"
                    >
                      {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 flex items-center justify-center gap-2 min-h-[48px] h-12 rounded-xl bg-[var(--teal)] text-white font-extrabold text-sm hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-60 shadow-md cursor-pointer"
                >
                  {loading ? (
                    'Authenticating…'
                  ) : (
                    <>
                      <span>Sign In to {PORTAL_INFO[portalKey].label}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ── Form: Sign Up ────────────────────────────────────────────── */}
            {mode === 'signup' && (
              <form onSubmit={handleSignUp} className="flex flex-col gap-3.5" noValidate>
                {/* Full Name for Patient */}
                {isPatient && (
                  <div className="flex flex-col gap-1">
                    <label htmlFor="auth-name" className="text-xs font-bold text-[var(--text)] flex items-center justify-between">
                      <span>Full Name</span>
                      {touched.name && !nameValid && (
                        <span className="text-[11px] text-red-600 flex items-center gap-1 font-semibold"><XCircle size={11} /> Required</span>
                      )}
                    </label>
                    <div className="relative">
                      <UserRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                      <input
                        id="auth-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={() => markTouched('name')}
                        placeholder="e.g. Asha Rao"
                        required
                        className={cn(
                          'w-full h-11 pl-10 pr-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2',
                          touched.name && !nameValid
                            ? 'border-red-400 bg-red-500/5 focus:ring-red-400/20'
                            : 'border-[var(--line)] bg-[var(--surface)] focus:border-[var(--teal)] focus:ring-[var(--teal)]/20'
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Care Centre for Doctor & Staff */}
                {!isPatient && (
                  <div className="flex flex-col gap-1">
                    <label htmlFor="auth-facility-signup" className="text-xs font-bold text-[var(--text)] flex items-center justify-between">
                      <span>Care Centre / Hospital</span>
                      {touched.facility && !facilityValid && (
                        <span className="text-[11px] text-red-600 flex items-center gap-1 font-semibold"><XCircle size={11} /> Required</span>
                      )}
                    </label>
                    <div className="relative">
                      <Hospital size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                      <input
                        id="auth-facility-signup"
                        value={facility}
                        onChange={(e) => setFacility(e.target.value)}
                        onBlur={() => markTouched('facility')}
                        placeholder="Your registered care centre"
                        required
                        className={cn(
                          'w-full h-11 pl-10 pr-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2',
                          touched.facility && !facilityValid
                            ? 'border-red-400 bg-red-500/5 focus:ring-red-400/20'
                            : 'border-[var(--line)] bg-[var(--surface)] focus:border-[var(--teal)] focus:ring-[var(--teal)]/20'
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="auth-email-signup" className="text-xs font-bold text-[var(--text)] flex items-center justify-between">
                    <span>{isPatient ? 'Email Address' : 'Work Email'}</span>
                    {touched.email && (emailValid ? (
                      <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold"><CheckCircle2 size={11} /> Valid</span>
                    ) : (
                      <span className="text-[11px] text-red-600 flex items-center gap-1 font-semibold"><XCircle size={11} /> Invalid</span>
                    ))}
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                    <input
                      id="auth-email-signup"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => markTouched('email')}
                      placeholder={isPatient ? 'you@example.com' : 'clinician@hospital.org'}
                      required
                      className={cn(
                        'w-full h-11 pl-10 pr-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2',
                        touched.email && !emailValid
                          ? 'border-red-400 bg-red-500/5 focus:ring-red-400/20'
                          : 'border-[var(--line)] bg-[var(--surface)] focus:border-[var(--teal)] focus:ring-[var(--teal)]/20'
                      )}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="auth-password-signup" className="text-xs font-bold text-[var(--text)] flex items-center justify-between">
                    <span>Create Password</span>
                    {touched.password && (passwordValid ? (
                      <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold"><CheckCircle2 size={11} /> ≥8 chars</span>
                    ) : (
                      <span className="text-[11px] text-red-600 flex items-center gap-1 font-semibold"><XCircle size={11} /> Min 8 chars</span>
                    ))}
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                    <input
                      id="auth-password-signup"
                      type={passwordVisible ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => markTouched('password')}
                      placeholder="At least 8 characters"
                      required
                      className={cn(
                        'w-full h-11 pl-10 pr-10 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2',
                        touched.password && !passwordValid
                          ? 'border-red-400 bg-red-500/5 focus:ring-red-400/20'
                          : 'border-[var(--line)] bg-[var(--surface)] focus:border-[var(--teal)] focus:ring-[var(--teal)]/20'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible(!passwordVisible)}
                      aria-label="Toggle password visibility"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] p-1"
                    >
                      {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="auth-confirm-signup" className="text-xs font-bold text-[var(--text)] flex items-center justify-between">
                    <span>Confirm Password</span>
                    {touched.confirm && (confirmValid ? (
                      <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold"><CheckCircle2 size={11} /> Matches</span>
                    ) : (
                      <span className="text-[11px] text-red-600 flex items-center gap-1 font-semibold"><XCircle size={11} /> Mismatch</span>
                    ))}
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                    <input
                      id="auth-confirm-signup"
                      type="password"
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      onBlur={() => markTouched('confirm')}
                      placeholder="Re-enter your password"
                      required
                      className={cn(
                        'w-full h-11 pl-10 pr-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2',
                        touched.confirm && !confirmValid
                          ? 'border-red-400 bg-red-500/5 focus:ring-red-400/20'
                          : 'border-[var(--line)] bg-[var(--surface)] focus:border-[var(--teal)] focus:ring-[var(--teal)]/20'
                      )}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 flex items-center justify-center gap-2 min-h-[48px] h-12 rounded-xl bg-[var(--teal)] text-white font-extrabold text-sm hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-60 shadow-md cursor-pointer"
                >
                  {loading ? (
                    'Creating Account…'
                  ) : (
                    <>
                      <span>Create {PORTAL_INFO[portalKey].label} Account</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ── Form: Password Recovery ───────────────────────────────────── */}
            {mode === 'recovery' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setMessageType('error');
                  setMessage('Password recovery is simulated in local demo mode. Use the Instant Demo Access buttons above.');
                }}
                className="flex flex-col gap-3.5"
                noValidate
              >
                <div className="flex flex-col gap-1">
                  <label htmlFor="auth-recovery-email" className="text-xs font-bold text-[var(--text)]">
                    Account Email Address
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                    <input
                      id="auth-recovery-email"
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-sm focus:outline-none focus:border-[var(--teal)]"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="h-11 rounded-xl bg-[var(--teal)] text-white font-bold text-sm hover:opacity-95 transition-opacity"
                >
                  Send Reset Link
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--teal)] text-center font-bold"
                >
                  ← Return to Sign In
                </button>
              </form>
            )}

            {/* Footer switcher note */}
            <div className="mt-5 pt-4 border-t border-[var(--line)] text-center">
              {mode === 'signin' ? (
                <p className="text-xs text-[var(--text-muted)]">
                  Need a new demo profile?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setTouched({}); }}
                    className="text-[var(--teal)] font-bold hover:underline"
                  >
                    Create Account
                  </button>
                </p>
              ) : (
                <p className="text-xs text-[var(--text-muted)]">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setTouched({}); }}
                    className="text-[var(--teal)] font-bold hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              )}
            </div>
          </div>


        </div>
      </main>

      {/* ── Minimal Footer ────────────────────────────────────────────────────── */}
      <footer className="py-4 text-center text-xs text-[var(--text-muted)] border-t border-[var(--line)] bg-[var(--surface)]">
        <p>SmartCare Digital Health Access · Presentation Demo Environment</p>
      </footer>
    </div>
  );
}
