'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  HeartPulse,
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
  ArrowLeft,
  KeyRound,
} from 'lucide-react';
import type { UserRole } from '@smartcare/types';
import { DemoDB } from '@/lib/db/demo-db';

export type PortalKey = 'patient' | 'doctor' | 'cmo' | 'commander';
export type AuthMode = 'signin' | 'signup' | 'recovery';

export interface PortalProfile {
  key: PortalKey;
  label: string;
  role: UserRole;
  badge: string;
  idBadge: string;
  idBadgeType: string;
  defaultEmail: string;
  defaultPassword: string;
  defaultFacility: string;
  defaultName: string;
  designation: string;
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
    badge: 'Citizen Access',
    idBadge: '91-4829-1039-4821@abdm',
    idBadgeType: 'ABHA Health ID (Ayushman Bharat)',
    defaultEmail: 'patient@smartcare.demo',
    defaultPassword: 'demo1234',
    defaultFacility: 'SmartCare Community Hospital',
    defaultName: 'Asha Rao',
    designation: 'Registered Citizen & Care Seeker',
    dest: '/dashboard/patient',
    signInDesc: 'Access your digital health passport, OPD queue tickets, and prescriptions.',
    signUpDesc: 'Register as a citizen for personal health tracking and live queue triage.',
    signInBtn: 'SIGN IN AS PATIENT',
    signUpBtn: 'CREATE PATIENT ACCOUNT',
    icon: UserRound,
  },
  doctor: {
    key: 'doctor',
    label: 'Doctor / PHC',
    role: 'doctor',
    badge: 'Clinical + Supply',
    idBadge: 'NMC-TS-2018-84729',
    idBadgeType: 'NMC Registered Clinical License',
    defaultEmail: 'hospital@smartcare.demo',
    defaultPassword: 'demo1234',
    defaultFacility: 'SmartCare Community Hospital',
    defaultName: 'Dr. Arjun Rao',
    designation: 'Senior Medical Officer & Clinical In-Charge',
    dest: '/dashboard/hospital?module=supply&supplyTab=inventory',
    signInDesc: 'Access clinician care workspace, ward beds, and essential medicine stocks.',
    signUpDesc: 'Register your primary health centre clinician & supply workspace.',
    signInBtn: 'SIGN IN TO HOSPITAL',
    signUpBtn: 'REGISTER DOCTOR WORKSPACE',
    icon: Stethoscope,
  },
  cmo: {
    key: 'cmo',
    label: 'District CMO',
    role: 'staff',
    badge: 'District Directorate',
    idBadge: 'DHD-HYD-CMO-01',
    idBadgeType: 'Gazetted District Health Officer ID',
    defaultEmail: 'cmo@district.gov.in',
    defaultPassword: 'demo1234',
    defaultFacility: 'Hyderabad District Health Directorate',
    defaultName: 'Dr. Rajeshwar Sharma',
    designation: 'Chief Medical Officer & District Health Officer',
    dest: '/dashboard/admin?adminTab=command&commandTab=summary',
    signInDesc: 'Access district shortage matrix, depot rebalancing, and emergency PO desk.',
    signUpDesc: 'Register your district health directorate monitoring & logistics console.',
    signInBtn: 'SIGN IN AS DISTRICT CMO',
    signUpBtn: 'REGISTER DISTRICT CMO ACCOUNT',
    icon: ShieldCheck,
  },
  commander: {
    key: 'commander',
    label: 'State Command',
    role: 'staff',
    badge: 'MoHFW Central Hub',
    idBadge: 'MOHFW-CMD-MESH-09',
    idBadgeType: 'National Health Mesh Authorization',
    defaultEmail: 'commander@mohfw.gov.in',
    defaultPassword: 'demo1234',
    defaultFacility: 'MoHFW State Control Desk',
    defaultName: 'MoHFW Central Medical Command Hub',
    designation: 'State Epidemiologist & Mesh Controller',
    dest: '/dashboard/admin?adminTab=command&commandTab=summary',
    signInDesc: 'Access 15m network telemetry, epidemic surge forecasting, and federated AI.',
    signUpDesc: 'Register state command node and multi-state federated learning mesh.',
    signInBtn: 'SIGN IN TO STATE COMMAND',
    signUpBtn: 'REGISTER STATE COMMAND NODE',
    icon: Building2,
  },
};

export const PORTAL_KEYS: PortalKey[] = ['doctor', 'cmo', 'commander', 'patient'];

export interface MorphingAuthCardProps {
  initialPortal?: PortalKey;
  initialMode?: AuthMode;
  onPortalChange?: (portal: PortalKey) => void;
  onModeChange?: (mode: AuthMode) => void;
  onSuccess?: (user: { email: string; role: UserRole; facility?: string; dest: string }) => void;
  onBackHome?: () => void;
}

export const MorphingAuthCard: React.FC<MorphingAuthCardProps> = ({
  initialPortal = 'doctor',
  initialMode = 'signin',
  onPortalChange,
  onModeChange,
  onSuccess,
  onBackHome,
}) => {
  const [portalKey, setPortalKey] = useState<PortalKey>(initialPortal);
  const [isSignUp, setIsSignUp] = useState<boolean>(initialMode === 'signup');
  const [recoveryState, setRecoveryState] = useState<'none' | 'recovery'>(
    initialMode === 'recovery' ? 'recovery' : 'none'
  );

  const activePortal = PORTAL_PROFILES[portalKey];

  // Form field state
  const [email, setEmail] = useState(activePortal.defaultEmail);
  const [password, setPassword] = useState(activePortal.defaultPassword);
  const [facility, setFacility] = useState(activePortal.defaultFacility);
  const [name, setName] = useState(activePortal.defaultName);
  const [confirmPassword, setConfirmPassword] = useState(activePortal.defaultPassword);

  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Password visibility toggles
  const [showSignInPwd, setShowSignInPwd] = useState(false);
  const [showSignUpPwd, setShowSignUpPwd] = useState(false);

  // Sync state if initial props change
  useEffect(() => {
    if (initialPortal && PORTAL_PROFILES[initialPortal]) {
      setPortalKey(initialPortal);
    }
  }, [initialPortal]);

  useEffect(() => {
    setIsSignUp(initialMode === 'signup');
    setRecoveryState(initialMode === 'recovery' ? 'recovery' : 'none');
  }, [initialMode]);

  // Apply default credentials on portal select
  const applyPortalDefaults = useCallback((pk: PortalKey) => {
    const prof = PORTAL_PROFILES[pk];
    setEmail(prof.defaultEmail);
    setPassword(prof.defaultPassword);
    setFacility(prof.defaultFacility);
    setName(prof.defaultName);
    setConfirmPassword(prof.defaultPassword);
    setMessage(null);
  }, []);

  const handlePortalSelect = (pk: PortalKey) => {
    setPortalKey(pk);
    applyPortalDefaults(pk);
    onPortalChange?.(pk);
  };

  const toggleMode = (signUp: boolean) => {
    setIsSignUp(signUp);
    setRecoveryState('none');
    setMessage(null);
    onModeChange?.(signUp ? 'signup' : 'signin');
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (activePortal.role !== 'patient' && !facility)) {
      setMessage({ text: 'Please fill in all required fields.', type: 'error' });
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
        setMessage({
          text: result.error || 'Authentication failed. Check your portal or credentials.',
          type: 'error',
        });
        return;
      }

      const u = result.user!;
      onSuccess?.({
        email: u.email,
        role: u.role as UserRole,
        facility: u.hospital || facility,
        dest: activePortal.dest,
      });
    } catch {
      setMessage({ text: 'Network or authentication error. Please try again.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || password.length < 4 || (activePortal.role !== 'patient' && !facility)) {
      setMessage({
        text: 'Please complete all required fields (password min 4 characters).',
        type: 'error',
      });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ text: 'Passwords do not match.', type: 'error' });
      return;
    }
    setIsLoading(true);
    setMessage(null);

    try {
      let result;
      if (activePortal.role === 'patient') {
        result = await DemoDB.registerPatient({ email, password, name });
      } else {
        result = await DemoDB.registerProfessional({
          email,
          password,
          role: activePortal.role,
          hospital: facility,
        });
      }

      if (!result.success) {
        setMessage({ text: result.error || 'Account registration failed.', type: 'error' });
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

      setMessage({ text: 'Account created successfully! Please sign in.', type: 'success' });
      toggleMode(false);
    } catch {
      setMessage({ text: 'Registration error occurred. Please try again.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Shared cubic-bezier morph transition style
  const morphTransition = {
    transition: 'all 600ms cubic-bezier(0.68, -0.15, 0.265, 1.15)',
  };

  return (
    <div className="w-full max-w-[940px] flex flex-col items-center">
      {/* Main Slider Morphing Container */}
      <div className="relative w-full min-h-[660px] bg-white dark:bg-[#101e30] border border-slate-200 dark:border-[#223850] rounded-[30px] shadow-2xl overflow-hidden flex flex-col md:block">
        
        {/* Mobile Top Tabs (Visible <= 768px) */}
        <div className="flex md:hidden bg-slate-100 dark:bg-[#0d1825] p-1.5 border-b border-slate-200 dark:border-[#223850] w-full">
          <button
            type="button"
            onClick={() => toggleMode(false)}
            className={`flex-1 py-2.5 rounded-full text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              !isSignUp
                ? 'bg-[#0a3b69] text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" /> Sign In
          </button>
          <button
            type="button"
            onClick={() => toggleMode(true)}
            className={`flex-1 py-2.5 rounded-full text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isSignUp
                ? 'bg-[#0a3b69] text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" /> Sign Up
          </button>
        </div>

        {/* =================================================================== */}
        {/* SIGN-UP FORM (Slides into place on desktop when isSignUp === true)  */}
        {/* =================================================================== */}
        <div
          style={morphTransition}
          className={`
            w-full md:w-1/2 md:absolute md:top-0 md:h-full p-6 sm:p-8 md:p-10 flex flex-col justify-center
            ${isSignUp ? 'md:translate-x-full md:opacity-100 md:z-10' : 'md:translate-x-0 md:opacity-0 md:pointer-events-none md:z-0'}
            ${!isSignUp ? 'hidden md:flex' : 'flex'}
          `}
        >
          <form onSubmit={handleSignUpSubmit} className="w-full flex flex-col gap-3.5" noValidate>
            <div>
              <div className="text-[11px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                <span>Portal Registration</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Create Account
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                {activePortal.signUpDesc}
              </p>
            </div>

            {/* 4-Role Segmented Switcher */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Select Operational Role
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-[#0d1825] rounded-xl border border-slate-200 dark:border-[#223850]">
                {PORTAL_KEYS.map((pk) => {
                  const prof = PORTAL_PROFILES[pk];
                  const Icon = prof.icon;
                  const isSelected = portalKey === pk;
                  return (
                    <button
                      key={pk}
                      type="button"
                      onClick={() => handlePortalSelect(pk)}
                      className={`py-2 px-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white dark:bg-[#182b40] text-blue-700 dark:text-blue-400 shadow-sm ring-1 ring-blue-500/20'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="whitespace-nowrap">{prof.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* ID Badge Pill */}
              <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0b1522] border border-slate-200/80 dark:border-[#223850]/80 text-slate-600 dark:text-slate-400">
                <span className="font-medium truncate">{activePortal.idBadgeType}:</span>
                <span className="font-mono font-bold text-blue-700 dark:text-blue-400 ml-1.5 shrink-0">
                  {activePortal.idBadge}
                </span>
              </div>
            </div>

            {/* Inline Message */}
            {message && isSignUp && (
              <div
                className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  message.type === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                }`}
              >
                {message.type === 'error' ? <XCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                <span>{message.text}</span>
              </div>
            )}

            {/* Input Fields */}
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {activePortal.role === 'patient' ? 'Citizen Full Name' : 'In-Charge / Official Name'}{' '}
                  <span className="text-blue-600">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Asha Rao"
                  required
                  className="px-3 py-2 bg-slate-50 dark:bg-[#0b1522] border border-slate-200 dark:border-[#223850] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              {activePortal.role !== 'patient' && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Hospital / Health Directorate <span className="text-blue-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={facility}
                    onChange={(e) => setFacility(e.target.value)}
                    placeholder="e.g. SmartCare Community Hospital"
                    required
                    className="px-3 py-2 bg-slate-50 dark:bg-[#0b1522] border border-slate-200 dark:border-[#223850] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {activePortal.role === 'patient' ? 'Email Address' : 'Official Work Email'}{' '}
                  <span className="text-blue-600">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@health.gov.in"
                  required
                  className="px-3 py-2 bg-slate-50 dark:bg-[#0b1522] border border-slate-200 dark:border-[#223850] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Password <span className="text-blue-600">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showSignUpPwd ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 4 chars"
                      required
                      className="w-full px-3 py-2 pr-9 bg-slate-50 dark:bg-[#0b1522] border border-slate-200 dark:border-[#223850] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPwd(!showSignUpPwd)}
                      className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showSignUpPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Confirm Password <span className="text-blue-600">*</span>
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b1522] border border-slate-200 dark:border-[#223850] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-1.5 py-3 bg-gradient-to-r from-[#0a3b69] to-[#0f5ca8] hover:from-[#082e52] hover:to-[#0c4985] text-white font-black text-xs uppercase tracking-wider rounded-full shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <span>{activePortal.signUpBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="md:hidden text-center text-xs text-slate-500 mt-1">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => toggleMode(false)}
                className="font-bold text-blue-600 underline ml-1 cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </form>
        </div>

        {/* =================================================================== */}
        {/* SIGN-IN FORM (Default left position on desktop)                     */}
        {/* =================================================================== */}
        <div
          style={morphTransition}
          className={`
            w-full md:w-1/2 md:absolute md:top-0 md:left-0 md:h-full p-6 sm:p-8 md:p-10 flex flex-col justify-center
            ${isSignUp ? 'md:translate-x-full md:opacity-0 md:pointer-events-none md:z-0' : 'md:translate-x-0 md:opacity-100 md:z-10'}
            ${isSignUp ? 'hidden md:flex' : 'flex'}
          `}
        >
          {recoveryState === 'recovery' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setMessage({
                  text: 'Password recovery email sent. Preset evaluation passwords remain demo1234.',
                  type: 'success',
                });
                setRecoveryState('none');
              }}
              className="w-full flex flex-col gap-4"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  Reset Password
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enter your email address to receive password reset instructions.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Account Email</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="user@smartcare.demo"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-[#0b1522] border border-slate-200 dark:border-[#223850] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="py-3 bg-gradient-to-r from-[#0a3b69] to-[#0f5ca8] text-white font-extrabold text-xs uppercase rounded-full shadow-lg flex items-center justify-center gap-2 cursor-pointer hover:shadow-xl transition-all"
              >
                <Mail className="w-4 h-4" /> Send Reset Link
              </button>

              <button
                type="button"
                onClick={() => setRecoveryState('none')}
                className="text-xs font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 self-center cursor-pointer transition-colors"
              >
                Return to Sign In
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignInSubmit} className="w-full flex flex-col gap-3.5" noValidate>
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
                  <span>Public Health Gateway</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  Sign In
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  {activePortal.signInDesc}
                </p>
              </div>

              {/* 4-Role Segmented Switcher */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span>Selected Operational Portal</span>
                  <span className="text-teal-600 dark:text-teal-400 font-mono text-[10px]">Autofill Active</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-[#0d1825] rounded-xl border border-slate-200 dark:border-[#223850]">
                  {PORTAL_KEYS.map((pk) => {
                    const prof = PORTAL_PROFILES[pk];
                    const Icon = prof.icon;
                    const isSelected = portalKey === pk;
                    return (
                      <button
                        key={pk}
                        type="button"
                        onClick={() => handlePortalSelect(pk)}
                        className={`py-2 px-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white dark:bg-[#182b40] text-blue-700 dark:text-blue-400 shadow-sm ring-1 ring-blue-500/20'
                            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="whitespace-nowrap">{prof.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* ID Badge Pill */}
                <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0b1522] border border-slate-200/80 dark:border-[#223850]/80 text-slate-600 dark:text-slate-400">
                  <span className="font-medium truncate">{activePortal.idBadgeType}:</span>
                  <span className="font-mono font-bold text-blue-700 dark:text-blue-400 ml-1.5 shrink-0">
                    {activePortal.idBadge}
                  </span>
                </div>
              </div>

              {/* Inline Message */}
              {message && !isSignUp && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    message.type === 'error'
                      ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                  }`}
                >
                  {message.type === 'error' ? <XCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  <span>{message.text}</span>
                </div>
              )}

              {/* Input Fields */}
              <div className="flex flex-col gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {activePortal.role === 'patient' ? 'Email Address' : 'Official Work Email'}{' '}
                    <span className="text-blue-600">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="officer@health.gov.in"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#0b1522] border border-slate-200 dark:border-[#223850] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {activePortal.role !== 'patient' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Facility / Health Directorate <span className="text-blue-600">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <Hospital className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={facility}
                        onChange={(e) => setFacility(e.target.value)}
                        placeholder="SmartCare Community Hospital"
                        required
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#0b1522] border border-slate-200 dark:border-[#223850] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Password <span className="text-blue-600">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setRecoveryState('recovery')}
                      className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
                    <input
                      type={showSignInPwd ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                      className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-[#0b1522] border border-slate-200 dark:border-[#223850] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPwd(!showSignInPwd)}
                      className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showSignInPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-1.5 py-3 bg-gradient-to-r from-[#0a3b69] to-[#0f5ca8] hover:from-[#082e52] hover:to-[#0c4985] text-white font-black text-xs uppercase tracking-wider rounded-full shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>Authenticating Gateway...</span>
                  </>
                ) : (
                  <>
                    <span>{activePortal.signInBtn}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="md:hidden text-center text-xs text-slate-500 mt-1">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => toggleMode(true)}
                  className="font-bold text-blue-600 underline ml-1 cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            </form>
          )}
        </div>

        {/* =================================================================== */}
        {/* SLIDING MORPH OVERLAY (Desktop Only >= 768px)                       */}
        {/* =================================================================== */}
        <div
          style={morphTransition}
          className={`
            hidden md:block absolute top-0 left-1/2 w-1/2 h-full overflow-hidden z-30
            ${isSignUp ? '-translate-x-full rounded-[0px_150px_100px_0px]' : 'translate-x-0 rounded-[150px_0px_0px_100px]'}
          `}
        >
          {/* Inner Double-Width Track (200% width) */}
          <div
            style={morphTransition}
            className={`
              relative -left-full w-[200%] h-full bg-gradient-to-br from-[#0f5ca8] to-[#0a3b69] text-white shadow-inner
              ${isSignUp ? 'translate-x-1/2' : 'translate-x-0'}
            `}
          >
            {/* Left Panel (Visible when viewing Sign-Up -> Invites to Sign-In) */}
            <div
              style={morphTransition}
              className={`
                absolute top-0 left-0 w-1/2 h-full flex flex-col items-center justify-center p-8 lg:p-12 text-center
                ${isSignUp ? 'translate-x-0' : '-translate-x-full'}
              `}
            >
              <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center mb-4 shadow-lg">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-white mb-2 leading-tight">
                Welcome Back!
              </h2>
              <p className="text-xs text-blue-100/90 leading-relaxed max-w-[280px] mb-8">
                Enter your credentials to continue access to your SmartCare health workspace and district telemetry.
              </p>
              <button
                type="button"
                onClick={() => toggleMode(false)}
                className="px-8 py-3 rounded-full border-2 border-white text-white font-black text-xs uppercase tracking-wider hover:bg-white hover:text-[#0a3b69] transition-all transform hover:-translate-y-0.5 shadow-md flex items-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" /> SIGN IN
              </button>
            </div>

            {/* Right Panel (Visible when viewing Sign-In -> Invites to Sign-Up) */}
            <div
              style={morphTransition}
              className={`
                absolute top-0 right-0 w-1/2 h-full flex flex-col items-center justify-center p-8 lg:p-12 text-center
                ${isSignUp ? 'translate-x-full' : 'translate-x-0'}
              `}
            >
              <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center mb-4 shadow-lg">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-white mb-2 leading-tight">
                Hello, Friend!
              </h2>
              <p className="text-xs text-blue-100/90 leading-relaxed max-w-[280px] mb-8">
                Register with your health credentials to connect with India's national health mesh and OPD triage.
              </p>
              <button
                type="button"
                onClick={() => toggleMode(true)}
                className="px-8 py-3 rounded-full border-2 border-white text-white font-black text-xs uppercase tracking-wider hover:bg-white hover:text-[#0a3b69] transition-all transform hover:-translate-y-0.5 shadow-md flex items-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> SIGN UP
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MorphingAuthCard;
