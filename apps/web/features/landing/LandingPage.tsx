'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  Clock3,
  Accessibility,
  LocateFixed,
  ListChecks,
  Activity,
  MapPin,
  LockKeyhole,
  Users,
  Stethoscope,
  Building2,
  Hospital as HospitalIcon,
  CheckCircle2,
  Clock,
  UserRound,
  Cpu,
  Sparkles,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { Footer } from '@/components/layout/Shell';
import { DemoDB } from '@/lib/db/demo-db';

export function LandingPage() {
  const [selectedHospital, setSelectedHospital] = useState<'SmartCare Community Hospital' | 'CityCare Trauma Centre'>('SmartCare Community Hospital');

  // Live system health status (reads from DemoDB)
  const [criticalAlerts, setCriticalAlerts] = useState(0);
  const [facilitiesCount, setFacilitiesCount] = useState(0);

  useEffect(() => {
    const loadStatus = () => {
      try {
        const profiles = DemoDB.getAllSupplyProfiles();
        const crit = profiles.reduce((sum, fp) => sum + fp.medicines.filter((m) => m.status === 'critical').length, 0);
        setCriticalAlerts(crit);
        setFacilitiesCount(profiles.length);
      } catch { /* silently ignore if not available */ }
    };
    loadStatus();
    window.addEventListener('smartcare:supply-updated', loadStatus);
    window.addEventListener('smartcare:telemetry-15m-sync', loadStatus);
    return () => {
      window.removeEventListener('smartcare:supply-updated', loadStatus);
      window.removeEventListener('smartcare:telemetry-15m-sync', loadStatus);
    };
  }, []);

  const HOSPITALS = [
    {
      id: 'SmartCare Community Hospital' as const,
      name: 'SmartCare Community Hospital',
      area: 'Gachibowli',
      distance: '2.1 km',
      icuBeds: 4,
      waitMins: 12,
      waitColor: 'green',
      Icon: HospitalIcon,
    },
    {
      id: 'CityCare Trauma Centre' as const,
      name: 'CityCare Trauma Centre',
      area: 'Financial District',
      distance: '3.8 km',
      icuBeds: 2,
      waitMins: 24,
      waitColor: 'yellow',
      Icon: Activity,
    },
  ];

  const selectedHosp = HOSPITALS.find((h) => h.id === selectedHospital)!;
  const bookHref = `/dashboard/patient/apply/1?hospital=${encodeURIComponent(selectedHospital)}`;

  return (
    <div className="min-h-dvh bg-[var(--canvas)] flex flex-col" data-section="landing-page">
      <Topbar variant="landing" />

      <main id="top" className="flex-1 overflow-x-hidden">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section
          id="hero"
          data-section="hero"
          aria-labelledby="hero-title"
          className="max-w-7xl mx-auto px-3 sm:px-6 pt-3 sm:pt-6"
        >
          <div
            className="hero-frame relative overflow-hidden rounded-2xl sm:rounded-[1.7rem] grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-6 lg:gap-8 p-4 sm:p-8 lg:p-12 text-white shadow-2xl"
            style={{
              background: 'var(--teal-dark)',
              boxShadow: '0 22px 70px rgba(10, 59, 105, .20)',
            }}
          >
            {/* Polygon overlay */}
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ background: '#2b74be', clipPath: 'polygon(0 0, 60% 0, 38% 100%, 0 100%)' }}
            />

            {/* ── Left: copy ─────────────────────────────────────────────── */}
            <div className="hero-copy relative z-10 flex flex-col justify-center min-w-0">
              {/* Eyebrow */}
              <div
                className="eyebrow flex items-center gap-2 mb-2"
                style={{ color: '#c5ddf3', textTransform: 'uppercase', letterSpacing: '.14em', fontSize: '.7rem', fontWeight: 800 }}
              >
                <span
                  className="eyebrow-dot"
                  style={{ width: '.45rem', height: '.45rem', borderRadius: '50%', background: '#a9d4f6', boxShadow: '0 0 0 .35rem rgba(169,212,246,.12)', display: 'inline-block' }}
                />
                Digital health access network
              </div>

              {/* H1 */}
              <h1
                id="hero-title"
                className="font-black tracking-tight"
                style={{
                  maxWidth: 680,
                  margin: '1.2rem 0 1rem',
                  fontSize: 'clamp(2rem, 5vw, 4.8rem)',
                  lineHeight: 1.06,
                  letterSpacing: '-.04em',
                }}
              >
                Care that starts <span style={{ color: '#b9dcf8' }}>before</span> you arrive.
              </h1>

              {/* Subtext */}
              <p
                className="text-blue-100/90"
                style={{ maxWidth: 590, margin: 0, fontSize: 'clamp(0.95rem, 1.8vw, 1.15rem)', lineHeight: 1.6 }}
              >
                Find the right care nearby, see the queue before you leave home, and reserve your place in a few calm, clear steps.
              </p>

              {/* CTAs */}
              <div className="hero-ctas flex flex-col sm:flex-row gap-3 mt-6 sm:mt-8">
                <Link
                  id="hero-explore-roles"
                  href="/login"
                  className="btn-hero-pop inline-flex items-center justify-center gap-2.5 font-extrabold text-sm sm:text-base no-underline"
                  style={{
                    minHeight: '3.1rem',
                    padding: '.82rem 1.8rem',
                    borderRadius: '.75rem',
                    background: '#fff',
                    color: 'var(--teal-dark)',
                    border: '1.5px solid rgba(255,255,255,.9)',
                    boxShadow: '0 6px 22px rgba(10,59,105,.28)',
                    cursor: 'pointer',
                    transition: 'transform .18s ease, box-shadow .2s ease',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
                >
                  <Users size={19} />
                  <span>Explore the roles</span>
                  <ArrowRight size={18} />
                </Link>
              </div>

              {/* Hero meta */}
              <div
                className="hero-meta flex flex-wrap gap-x-5 gap-y-2 mt-6 sm:mt-8"
                style={{ color: '#bdd8f1', fontSize: '.76rem', fontWeight: 700 }}
              >
                <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> Role-specific workspaces</span>
                <span className="flex items-center gap-1.5"><Clock3 size={14} /> Queue status preview</span>
                <span className="flex items-center gap-1.5"><Accessibility size={14} /> Mobile-first controls</span>
              </div>

              {/* Live health system status pill */}
              {criticalAlerts > 0 && (
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mt-6"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)' }}
                >
                  <ShieldAlert size={13} style={{ color: '#fca5a5' }} />
                  <span style={{ color: '#fca5a5', fontSize: '.68rem', fontWeight: 800, letterSpacing: '.08em' }}>
                    {criticalAlerts} critical stock shortages active across {facilitiesCount} facilities
                  </span>
                  <span
                    style={{ display: 'inline-block', width: '.4rem', height: '.4rem', borderRadius: '50%', background: '#f87171', animation: 'pulse 1.5s ease-in-out infinite' }}
                  />
                </div>
              )}

              {/* Hero facts */}
              <div
                className="hero-facts mt-8 pt-4 grid grid-cols-3 gap-2 sm:gap-3"
                style={{ borderTop: '1px solid rgba(255,255,255,.2)' }}
              >
                {[
                  { stat: '4 steps', label: 'patient booking flow' },
                  { stat: `${facilitiesCount || 3} PHCs`,  label: 'monitored live' },
                  { stat: '1 profile', label: 'portable medical history' },
                ].map((f) => (
                  <div key={f.stat} className="flex flex-col gap-0.5 min-w-0">
                    <strong style={{ color: '#fff', fontSize: '1.05rem', lineHeight: 1 }}>{f.stat}</strong>
                    <span style={{ color: '#bdd8f1', fontSize: '.65rem', lineHeight: 1.25 }}>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: Interactive Live Care Network Panel ──────────── */}
            <div className="hero-side relative z-10 flex items-center justify-center w-full min-w-0">
              <div
                className="care-panel w-full"
                style={{
                  maxWidth: 520,
                  padding: '1.15rem',
                  border: '1px solid rgba(255,255,255,.18)',
                  borderRadius: '1.35rem',
                  background: '#0e4d86',
                }}
              >
                {/* Panel head */}
                <div className="care-panel-head flex justify-between gap-2 sm:gap-4 items-start" style={{ padding: '.25rem .25rem .9rem' }}>
                  <div>
                    <span
                      className="care-tag flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-1"
                      style={{ color: '#b8daf5', letterSpacing: '.12em' }}
                    >
                      <MapPin size={12} style={{ color: '#b8daf5' }} /> Live Care Network
                    </span>
                    <p className="care-panel-title m-0 font-extrabold" style={{ fontSize: '1rem', color: '#fff' }}>Verified Care Centres</p>
                  </div>
                  <span
                    className="status-eyebrow flex items-center gap-1.5 shrink-0"
                    style={{ color: '#b8daf5', fontSize: '.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.12em', whiteSpace: 'nowrap' }}
                  >
                    <span style={{ display: 'inline-block', width: '.45rem', height: '.45rem', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 0 .25rem rgba(74,222,128,.2)', animation: 'pulse 2s ease-in-out infinite' }} />
                    Live queue
                  </span>
                </div>

                {/* Hospital Cards — clickable toggle */}
                <div className="care-panel-body flex flex-col gap-2.5">
                  {HOSPITALS.map((h) => {
                    const isActive = selectedHospital === h.id;
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => setSelectedHospital(h.id)}
                        className="care-hosp-preview w-full text-left flex items-center gap-2.5 sm:gap-3 transition-all"
                        style={{
                          padding: '0.75rem 0.85rem sm:0.85rem 1rem',
                          borderRadius: '0.9rem',
                          border: isActive ? '2px solid rgba(255,255,255,0.55)' : '1.5px solid rgba(255,255,255,0.14)',
                          background: isActive ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.07)',
                          cursor: 'pointer',
                          boxShadow: isActive ? '0 4px 18px rgba(0,0,0,0.18)' : 'none',
                          transform: isActive ? 'translateY(-1px)' : 'none',
                          transition: 'all 0.18s ease',
                        }}
                        aria-pressed={isActive}
                      >
                        {/* Icon */}
                        <span style={{
                          width: '2.2rem', height: '2.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isActive ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)',
                          borderRadius: '0.65rem', flexShrink: 0, color: '#fff',
                        }}>
                          <h.Icon size={16} />
                        </span>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <strong className="block text-xs sm:text-sm font-extrabold truncate" style={{ color: '#fff', lineHeight: 1.3 }}>
                            {h.name}
                          </strong>
                          <span className="block text-[11px] sm:text-xs mt-0.5 truncate" style={{ color: '#c2dcf3' }}>
                            {h.area} · {h.icuBeds} ICU beds · {h.distance}
                          </span>
                        </div>

                        {/* Wait badge */}
                        <span
                          className="shrink-0 text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 rounded-full"
                          style={{
                            background: h.waitColor === 'green' ? 'rgba(74,222,128,0.2)' : 'rgba(251,191,36,0.2)',
                            color: h.waitColor === 'green' ? '#86efac' : '#fde68a',
                            border: h.waitColor === 'green' ? '1px solid rgba(74,222,128,0.35)' : '1px solid rgba(251,191,36,0.35)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          ~{h.waitMins}m wait
                        </span>

                        {/* Selected check */}
                        {isActive && (
                          <CheckCircle2 size={16} style={{ color: '#86efac', flexShrink: 0 }} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Panel footer — selected hospital + Book Visit */}
                <div
                  className="care-panel-foot flex items-center justify-between gap-2 sm:gap-3 mt-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '0.85rem' }}
                >
                  <div className="min-w-0 flex-1">
                    <small style={{ color: '#b8daf5', fontSize: '.65rem', display: 'block', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 700 }}>Selected hospital</small>
                    <strong className="block truncate" style={{ color: '#fff', fontSize: '.8rem', maxWidth: '100%' }}>
                      {selectedHospital}
                    </strong>
                    <span className="flex items-center gap-1 mt-0.5 truncate" style={{ color: '#b8daf5', fontSize: '.65rem' }}>
                      <Clock size={10} className="shrink-0" /> ~{selectedHosp.waitMins}m wait · {selectedHosp.distance}
                    </span>
                  </div>
                  <Link
                    href={bookHref}
                    className="shrink-0 inline-flex items-center gap-1.5 font-extrabold no-underline"
                    style={{
                      background: '#fff',
                      color: '#0a3b69',
                      fontSize: '.78rem',
                      fontWeight: 800,
                      padding: '.55rem .95rem',
                      borderRadius: '.55rem',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
                      minHeight: '2.3rem',
                    }}
                  >
                    Book Visit <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stat strip ─────────────────────────────────────────────────── */}
        <section
          aria-label="SmartCare programme facts"
          data-section="programme-facts"
          className="max-w-7xl mx-auto mt-4 grid grid-cols-1 sm:grid-cols-3 border border-[var(--line)] bg-[var(--surface)] divide-y sm:divide-y-0 sm:divide-x divide-[var(--line)]"
        >
          {[
            { num: '01', text: 'Use your location or search manually' },
            { num: '02', text: 'Choose a centre with queue visibility' },
            { num: '03', text: 'Keep the next step in one place' },
          ].map((s) => (
            <div
              key={s.num}
              className="flex items-center sm:items-baseline gap-2.5 py-3 sm:py-4 px-4"
            >
              <strong style={{ color: 'var(--teal)', fontSize: '.78rem', letterSpacing: '.12em' }}>{s.num}</strong>
              <span style={{ color: 'var(--muted)', fontSize: '.78rem' }}>{s.text}</span>
            </div>
          ))}
        </section>

        {/* ── How it works ───────────────────────────────────────────────── */}
        <section
          id="how-it-works"
          data-section="how-it-works"
          className="max-w-7xl mx-auto mt-4 border border-[var(--line)] p-4 sm:p-8 lg:p-12 bg-[var(--surface)]"
        >
          <div className="section-heading mb-8">
            <div
              className="eyebrow-dark flex items-center gap-2"
              style={{ color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '.14em', fontSize: '.7rem', fontWeight: 800 }}
            >
              <span style={{ width: '.45rem', height: '.45rem', borderRadius: '50%', background: 'var(--teal)', boxShadow: '0 0 0 .35rem rgba(15,92,168,.12)', display: 'inline-block' }} />
              A clear path to care
            </div>
            <h2 style={{ maxWidth: '20ch', margin: '.65rem 0 .75rem', color: 'var(--teal-dark)', fontSize: 'clamp(1.6rem, 3.5vw, 3rem)', lineHeight: 1.05, letterSpacing: '-.05em', fontWeight: 800 }}>
              Less time searching. More time getting seen.
            </h2>
            <p style={{ maxWidth: '60ch', margin: 0, color: 'var(--muted)', lineHeight: 1.6, fontSize: '0.9rem' }}>
              SmartCare connects your location, care centre, application, and queue status in one calm flow.
            </p>
          </div>

          <div className="journey-grid grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {[
              { num: '01', Icon: LocateFixed, title: 'Locate', desc: 'Use device location or search by city or neighbourhood.', href: '/dashboard/patient/apply/1', cta: 'Find care' },
              { num: '02', Icon: ListChecks, title: 'Apply', desc: 'Share only the details your care team needs before you arrive.', href: '/dashboard/patient/apply/1', cta: 'Start simply' },
              { num: '03', Icon: Activity, title: 'Follow through', desc: 'Keep your reservation reference, queue window, and centre details visible.', href: '/login?role=patient', cta: 'See the portal' },
            ].map((item) => (
              <article key={item.num} className="border border-[var(--line)] rounded-xl p-5 sm:p-6 relative hover:shadow-lg transition-shadow bg-[var(--surface)]">
                <span className="journey-number absolute top-4 right-5 text-5xl font-black opacity-[0.07]" style={{ color: 'var(--teal-dark)' }}>{item.num}</span>
                <span className="journey-icon mb-4 w-10 h-10 flex items-center justify-center rounded-xl" style={{ background: 'var(--mint)', color: 'var(--teal)' }}>
                  <item.Icon size={20} />
                </span>
                <h3 className="text-base font-bold mb-2" style={{ color: 'var(--teal-dark)' }}>{item.title}</h3>
                <p className="text-xs leading-relaxed mb-4 text-[var(--muted)]">{item.desc}</p>
                <Link href={item.href} className="text-link text-link-dark flex items-center gap-1 text-xs font-bold no-underline hover:gap-2 transition-all" style={{ color: 'var(--teal-dark)' }}>
                  {item.cta} <ArrowRight size={13} />
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* ── 4-Tier Public Health Mesh Portals ──────────────────────────── */}
        <section
          id="for-providers"
          aria-label="National Health Mesh Portals"
          data-section="provider-portals"
          className="max-w-7xl mx-auto mt-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
            <div>
              <div className="eyebrow-dark flex items-center gap-2" style={{ color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '.14em', fontSize: '.72rem', fontWeight: 800 }}>
                <span style={{ width: '.45rem', height: '.45rem', borderRadius: '50%', background: 'var(--teal)', display: 'inline-block' }} />
                National Health Mesh Infrastructure
              </div>
              <h2 style={{ margin: '.3rem 0 0', color: 'var(--teal-dark)', fontSize: 'clamp(1.4rem, 2.5vw, 2.2rem)', letterSpacing: '-.04em', fontWeight: 800 }}>
                Role-Aware Portals for Every Tier
              </h2>
            </div>
            <Link
              href="/login"
              className="text-xs font-bold text-[var(--teal)] hover:underline flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-[var(--surface-sunken)] border border-[var(--line)]"
            >
              <span>Explore All Sign-In Options</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Citizen / Patient */}
            <article className="border border-[var(--line)] rounded-2xl p-5 flex flex-col justify-between hover:shadow-xl hover:-translate-y-0.5 transition-all bg-[var(--surface)] group">
              <div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <UserRound size={20} />
                </div>
                <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                  Citizen Portal
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2 leading-snug">
                  Live Queues & ABHA Rx
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
                  Check live consultation wait times, reserve your token from home, and access tamper-proof digital prescriptions.
                </p>
              </div>
              <Link
                id="open-patient-portal"
                href="/login?portal=patient"
                className="mt-auto flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all no-underline"
              >
                <span>Enter Citizen Portal</span>
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </article>

            {/* 2. Doctor / PHC In-Charge */}
            <article className="border border-[var(--line)] rounded-2xl p-5 flex flex-col justify-between hover:shadow-xl hover:-translate-y-0.5 transition-all bg-[var(--surface)] group">
              <div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                  <Stethoscope size={20} />
                </div>
                <div className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-1">
                  PHC Clinical Hub
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2 leading-snug">
                  OPD Triage & Telemetry
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
                  Triage walk-in patients, update ward bed allocations in real time, and log medical personnel shift attendance.
                </p>
              </div>
              <Link
                id="open-doctor-portal"
                href="/login?portal=doctor"
                className="mt-auto flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-all no-underline"
              >
                <span>Open Doctor Sign-In</span>
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </article>

            {/* 3. District CMO */}
            <article className="border border-[var(--line)] rounded-2xl p-5 flex flex-col justify-between hover:shadow-xl hover:-translate-y-0.5 transition-all bg-[var(--surface)] group">
              <div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <ShieldCheck size={20} />
                </div>
                <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                  District Health Hub
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2 leading-snug">
                  Shortages & Rebalancing
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
                  Aggregate stockout risks across local PHCs, authorize central depot replenishment, and issue emergency POs.
                </p>
              </div>
              <Link
                id="open-cmo-portal"
                href="/login?portal=cmo"
                className="mt-auto flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all no-underline"
              >
                <span>Open CMO Sign-In</span>
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </article>

            {/* 4. State Command & AI Mesh */}
            <article className="border border-[var(--line)] rounded-2xl p-5 flex flex-col justify-between hover:shadow-xl hover:-translate-y-0.5 transition-all bg-[var(--surface)] group">
              <div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <Cpu size={20} />
                </div>
                <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                  MoHFW State Mesh
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2 leading-snug">
                  15m Telemetry & FedAI
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
                  National 15-minute telemetry sync, AI epidemic demand forecasting, and cross-state federated learning rounds.
                </p>
              </div>
              <Link
                id="open-commander-portal"
                href="/login?portal=commander"
                className="mt-auto flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all no-underline"
              >
                <span>Open State Command</span>
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </article>
          </div>
        </section>

        {/* ── Trust row ──────────────────────────────────────────────────── */}
        <section
          id="trust"
          aria-label="Why SmartCare"
          data-section="trust"
          className="trust-row max-w-7xl mx-auto mt-4 grid grid-cols-1 sm:grid-cols-3 border border-[var(--line)] bg-[var(--surface)] divide-y sm:divide-y-0 sm:divide-x divide-[var(--line)]"
        >
          {[
            { Icon: ShieldCheck, title: 'Clear by design', desc: 'Readable states and calm next actions.' },
            { Icon: MapPin,       title: 'Location aware',  desc: 'Use precise device coordinates when you choose.' },
            { Icon: LockKeyhole,  title: 'Privacy minded',  desc: 'Location is requested only for the care search.' },
          ].map((card) => (
            <div
              key={card.title}
              className="trust-card flex items-center gap-3 py-4 sm:py-5 px-4"
              style={{ minHeight: '4.2rem' }}
            >
              <span className="trust-icon flex items-center justify-center w-9 h-9 rounded-lg shrink-0" style={{ background: 'var(--mint)', color: 'var(--teal)' }}>
                <card.Icon size={17} />
              </span>
              <div className="trust-copy">
                <strong className="block text-sm" style={{ color: 'var(--teal-dark)' }}>{card.title}</strong>
                <span className="text-xs text-[var(--muted)]">{card.desc}</span>
              </div>
            </div>
          ))}
        </section>

        {/* Spacer */}
        <div className="h-12" />
      </main>

      <Footer />
    </div>
  );
}
