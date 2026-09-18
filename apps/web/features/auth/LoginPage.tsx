'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  UserRound,
  Hospital,
  Building2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HeartPulse,
  Mail,
  Lock,
  Sparkles,
  KeyRound,
  Activity,
  Stethoscope,
  TrendingUp,
  Cpu,
  Layers,
  Truck,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Topbar } from '@/components/layout/Topbar';
import { useAppStore } from '@/lib/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { DemoDB } from '@/lib/db/demo-db';
import type { UserRole } from '@smartcare/types';

type AuthMode = 'signin' | 'signup' | 'recovery';
type PortalKey = 'doctor' | 'cmo' | 'commander' | 'patient';

interface DemoProfile {
  email: string;
  password: string;
  role: UserRole;
  hospital: string;
  label: string;
  name: string;
  designation: string;
  idBadge: string;
  idBadgeType: string;
  badgeTone: string;
  features: string[];
  dest: string;
}

const DEMO_CREDENTIALS: Record<PortalKey, DemoProfile> = {
  patient: {
    email: 'patient@smartcare.demo',
    password: 'demo1234',
    role: 'patient',
    hospital: 'SmartCare Community Hospital',
    label: 'Citizen & Patient',
    name: 'Asha Rao',
    designation: 'Registered Citizen & Care Seeker',
    idBadge: '91-4829-1039-4821@abdm',
    idBadgeType: 'ABHA Digital Health ID (Ayushman Bharat)',
    badgeTone: 'from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    features: ['Live OPD Queue Window', 'Digital Prescriptions & Rx Refills', 'Instant Walk-in Booking'],
    dest: '/dashboard/patient',
  },
  doctor: {
    email: 'hospital@smartcare.demo',
    password: 'demo1234',
    role: 'doctor',
    hospital: 'SmartCare Community Hospital',
    label: 'Doctor / PHC Lead',
    name: 'Dr. Arjun Rao',
    designation: 'Senior Medical Officer & Clinical In-Charge',
    idBadge: 'NMC-TS-2018-84729',
    idBadgeType: 'NMC Registered Clinical License',
    badgeTone: 'from-sky-500/20 to-blue-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30',
    features: ['Live OPD Patient Triage', 'Ward Bed Allocation & Turnover', 'Daily Staff Attendance Console'],
    dest: '/dashboard/hospital?module=supply&supplyTab=inventory',
  },
  cmo: {
    email: 'cmo@district.gov.in',
    password: 'demo1234',
    role: 'staff',
    hospital: 'Hyderabad District Health Directorate',
    label: 'District CMO',
    name: 'Dr. Rajeshwar Sharma',
    designation: 'Chief Medical Officer & District Health Officer',
    idBadge: 'DHD-HYD-CMO-01',
    idBadgeType: 'Gazetted District Health Officer ID',
    badgeTone: 'from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
    features: ['District PHC Stock Shortage Matrix', 'Central Depot Rebalance Orders', 'Rapid Emergency SOS POs'],
    dest: '/dashboard/admin?adminTab=command&commandTab=summary',
  },
  commander: {
    email: 'commander@mohfw.gov.in',
    password: 'demo1234',
    role: 'staff',
    hospital: 'MoHFW State Control Desk',
    label: 'State Command & AI Mesh',
    name: 'MoHFW Central Medical Command Hub',
    designation: 'State Epidemiologist & Mesh Controller',
    idBadge: 'MOHFW-CMD-MESH-09',
    idBadgeType: 'National Health Mesh Authorization',
    badgeTone: 'from-indigo-500/20 to-purple-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    features: ['15-Minute Network Telemetry Loop', 'AI Epidemic Demand Forecaster', 'Multi-State Federated AI (FedAvg)'],
    dest: '/dashboard/admin?adminTab=command&commandTab=summary',
  },
};

const PORTAL_INFO: Record<PortalKey, {
  label: string;
  role: UserRole;
  badge: string;
  desc: string;
  icon: typeof UserRound;
  defaultFacility: string;
  defaultEmail: string;
}> = {
  doctor: {
    label: 'Doctor / PHC',
    role: 'doctor',
    badge: 'Clinical + Supply',
    desc: 'OPD queue triage, e-prescriptions, daily personnel attendance, and bed capacity telemetry.',
    icon: Stethoscope,
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
    desc: 'National health telemetry mesh, 15m live cycle, epidemic forecasting, and federated learning.',
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
  const { login, setAuthTarget, showToast } = useAppStore(
    useShallow((s) => ({
      login: s.login,
      setAuthTarget: s.setAuthTarget,
      showToast: s.showToast,
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
  const [launchingKey, setLaunchingKey] = useState<PortalKey | null>(null);
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
      const dest = u.role === 'patient'
        ? '/dashboard/patient'
        : u.role === 'doctor'
        ? '/dashboard/hospital?module=supply'
        : '/dashboard/admin?adminTab=command&commandTab=summary';
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
        const dest = u.role === 'patient'
          ? '/dashboard/patient'
          : u.role === 'doctor'
          ? '/dashboard/hospital?module=supply'
          : '/dashboard/admin?adminTab=command&commandTab=summary';
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

  const handleFastDemoLaunch = async (demoKey: PortalKey) => {
    const creds = DEMO_CREDENTIALS[demoKey];
    setLaunchingKey(demoKey);
    setLoading(true);
    setMessage('');
    try {
      const result = await DemoDB.checkCredentials(creds.hospital, creds.email, creds.password, creds.role);
      if (result.success && result.user) {
        const u = result.user;
        login(u.email, u.role as UserRole, {
          hospital: u.hospital || '',
          country: u.country || 'India',
          state: u.state || 'Telangana',
          city: u.city || 'Hyderabad',
        });
        showToast(`Authenticated as ${creds.name}`, 'success');
        router.push(creds.dest);
      } else {
        setMessage(result.error || 'Demo sign in failed.');
        setMessageType('error');
      }
    } catch {
      setMessage('Authentication error. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
      setLaunchingKey(null);
    }
  };

  const activeCreds = DEMO_CREDENTIALS[portalKey];

  return (
    <div className="min-h-dvh bg-[var(--canvas)] flex flex-col justify-between text-[var(--text)] transition-colors">
      <Topbar variant="landing" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 animate-pulse" />
            National Health Mesh Authentication Gateway
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Unified Public Health Sign-In
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Secure, role-aware access for Citizens, Primary Health Centres, District Health Directorates, and State Command.
          </p>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Instant 1-Click Role Launchers (Desktop 5 cols, Mobile full) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Instant 1-Click Demo Launchers
              </h2>
              <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                Direct Bypass
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {(['doctor', 'commander', 'cmo', 'patient'] as const).map((pk) => {
                const creds = DEMO_CREDENTIALS[pk];
                const info = PORTAL_INFO[pk];
                const Icon = info.icon;
                const isLaunching = launchingKey === pk;

                return (
                  <div
                    key={pk}
                    className={cn(
                      'p-4 rounded-2xl border transition-all duration-200 bg-[var(--surface)] hover:shadow-lg flex flex-col justify-between group relative overflow-hidden',
                      portalKey === pk
                        ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-md'
                        : 'border-[var(--line)] hover:border-slate-300 dark:hover:border-slate-700'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center font-bold border', creds.badgeTone)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                              {creds.label}
                            </h3>
                            {portalKey === pk && (
                              <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {creds.name}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hidden sm:inline-block">
                        {creds.idBadge.split('@')[0]}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 mb-3 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      {creds.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3 text-teal-500 shrink-0" />
                          <span className="truncate">{f}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleFastDemoLaunch(pk)}
                        disabled={loading}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 h-10 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm',
                          pk === 'commander'
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : pk === 'doctor'
                            ? 'bg-sky-600 hover:bg-sky-700 text-white'
                            : pk === 'cmo'
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        )}
                      >
                        {isLaunching ? (
                          <>
                            <Activity className="h-3.5 w-3.5 animate-spin" />
                            <span>Launching {creds.label}…</span>
                          </>
                        ) : (
                          <>
                            <span>Launch as {creds.label}</span>
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePortalChange(pk)}
                        title="Load into form"
                        className="px-2.5 h-10 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Interactive Form & ID Badge Console (Desktop 7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-teal-500 via-sky-500 to-indigo-600" />

              {/* Mode Switcher */}
              <div className="flex p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => handleModeChange('signin')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer',
                    mode === 'signin'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('signup')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer',
                    mode === 'signup'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Register Account</span>
                </button>
              </div>

              {/* Portal Selector Grid */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                  <span>Selected Operational Portal</span>
                  <span className="text-teal-600 dark:text-teal-400 font-mono text-[11px]">4 Tiers Available</span>
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
                          'flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border text-center transition-all cursor-pointer min-h-[64px]',
                          isSelected
                            ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-700 dark:text-teal-300 font-bold shadow-sm ring-1 ring-teal-500/30'
                            : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                      >
                        <Icon className={cn('h-5 w-5 mb-1', isSelected ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500')} />
                        <span className="text-xs font-bold leading-tight">{info.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interactive ID Badge Preview Card */}
              <div className="mb-6 p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-gradient-to-r from-slate-50 via-slate-100/40 to-slate-50 dark:from-slate-900/60 dark:via-slate-800/40 dark:to-slate-900/60 relative">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                      {activeCreds.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white">{activeCreds.name}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400">
                          Verified
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {activeCreds.designation}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    ID CARD
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{activeCreds.idBadgeType}</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{activeCreds.idBadge}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Facility / Hub</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{activeCreds.hospital}</span>
                  </div>
                </div>
              </div>

              {/* Feedback Message */}
              {message && (
                <div
                  role="alert"
                  className={cn(
                    'text-xs px-4 py-3 rounded-xl mb-4 border flex items-center gap-2',
                    messageType === 'error'
                      ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400'
                      : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                  )}
                >
                  {messageType === 'error' ? <XCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
                  <span>{message}</span>
                </div>
              )}

              {/* Form: Sign In */}
              {mode === 'signin' && (
                <form onSubmit={handleSignIn} className="flex flex-col gap-4" noValidate>
                  {/* Email */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="auth-email" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>{isPatient ? 'Email Address' : 'Official Work Email'}</span>
                      {touched.email && (emailValid ? (
                        <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold"><CheckCircle2 className="h-3 w-3" /> Valid</span>
                      ) : (
                        <span className="text-[11px] text-red-600 flex items-center gap-1 font-semibold"><XCircle className="h-3 w-3" /> Invalid email</span>
                      ))}
                    </label>
                    <div className="relative">
                      <Mail className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        id="auth-email"
                        type="email"
                        autoComplete="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => markTouched('email')}
                        placeholder={isPatient ? 'you@example.com' : 'officer@gov.in'}
                        required
                        className={cn(
                          'w-full h-11 pl-10 pr-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2',
                          touched.email && !emailValid
                            ? 'border-red-400 bg-red-500/5 focus:ring-red-400/20'
                            : touched.email && emailValid
                            ? 'border-emerald-400 bg-emerald-500/5 focus:ring-emerald-400/20'
                            : 'border-[var(--line)] bg-[var(--surface)] focus:border-teal-500 focus:ring-teal-500/20'
                        )}
                      />
                    </div>
                  </div>

                  {/* Care Centre / Facility for Professionals */}
                  {!isPatient && (
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="auth-facility" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>Facility / Health Directorate</span>
                        {touched.facility && !facilityValid && (
                          <span className="text-[11px] text-red-600 flex items-center gap-1 font-semibold"><XCircle className="h-3 w-3" /> Required</span>
                        )}
                      </label>
                      <div className="relative">
                        <Hospital className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
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
                              : 'border-[var(--line)] bg-[var(--surface)] focus:border-teal-500 focus:ring-teal-500/20'
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {/* Password */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="auth-password" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setMode('recovery')}
                        className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        id="auth-password"
                        type={passwordVisible ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => markTouched('password')}
                        placeholder="Enter password"
                        required
                        className="w-full h-11 pl-10 pr-10 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-sm transition-all focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setPasswordVisible(!passwordVisible)}
                        aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                      >
                        {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex items-center justify-center gap-2 min-h-[48px] h-12 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-extrabold text-sm transition-all disabled:opacity-60 shadow-md cursor-pointer"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Activity className="h-4 w-4 animate-spin" />
                        Authenticating Gateway…
                      </span>
                    ) : (
                      <>
                        <span>Sign In as {PORTAL_INFO[portalKey].label}</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Form: Register */}
              {mode === 'signup' && (
                <form onSubmit={handleSignUp} className="flex flex-col gap-3.5" noValidate>
                  {isPatient && (
                    <div className="flex flex-col gap-1">
                      <label htmlFor="auth-name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Full Citizen Name
                      </label>
                      <input
                        id="auth-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Asha Rao"
                        required
                        className="w-full h-11 px-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-sm focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  )}

                  {!isPatient && (
                    <div className="flex flex-col gap-1">
                      <label htmlFor="auth-facility-reg" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Hospital / Health Directorate
                      </label>
                      <input
                        id="auth-facility-reg"
                        value={facility}
                        onChange={(e) => setFacility(e.target.value)}
                        placeholder="Registered Care Centre"
                        required
                        className="w-full h-11 px-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-sm focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <label htmlFor="auth-email-reg" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Work Email
                    </label>
                    <input
                      id="auth-email-reg"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.org"
                      required
                      className="w-full h-11 px-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-sm focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="auth-pass-reg" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Password (≥8 chars)
                      </label>
                      <input
                        id="auth-pass-reg"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        required
                        className="w-full h-11 px-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-sm focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label htmlFor="auth-confirm-reg" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Confirm Password
                      </label>
                      <input
                        id="auth-confirm-reg"
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Confirm password"
                        required
                        className="w-full h-11 px-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-sm focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex items-center justify-center gap-2 min-h-[48px] h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm transition-all shadow-md cursor-pointer"
                  >
                    {loading ? 'Creating Profile…' : `Register ${PORTAL_INFO[portalKey].label} Account`}
                  </button>
                </form>
              )}

              {/* Form: Recovery */}
              {mode === 'recovery' && (
                <div className="text-center py-6">
                  <KeyRound className="h-10 w-10 text-teal-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                    Password Reset Simulation
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                    In this evaluation environment, passwords for all 4 public health portals are preset to <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold">demo1234</code>.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700"
                  >
                    Return to Sign In
                  </button>
                </div>
              )}

              {/* Compliance Badges */}
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
                  ABDM & DPDP Act 2023 Compliant
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                  256-bit TLS Encrypted Mesh
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-[var(--text-muted)] border-t border-[var(--line)] bg-[var(--surface)]">
        <p>SmartCare National Public Health Resilience Infrastructure · MoHFW Telemetry Mesh</p>
      </footer>
    </div>
  );
}
