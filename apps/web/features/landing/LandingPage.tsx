'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { Footer } from '@/components/layout/Shell';

export function LandingPage() {
  const [selectedHospital, setSelectedHospital] = useState<'SmartCare Community Hospital' | 'CityCare Trauma Centre'>('SmartCare Community Hospital');

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
                  id="hero-login"
                  href="/login?mode=signin&role=patient"
                  className="btn-hero-pop inline-flex items-center justify-center gap-2 font-extrabold text-sm no-underline"
                  style={{
                    minHeight: '2.9rem',
                    padding: '.76rem 1.4rem',
                    borderRadius: '.65rem',
                    background: '#fff',
                    color: 'var(--teal-dark)',
                    border: '1.5px solid rgba(255,255,255,.85)',
                    boxShadow: '0 4px 18px rgba(10,59,105,.25)',
                    cursor: 'pointer',
                    transition: 'transform .18s ease, box-shadow .2s ease',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
                >
                  Open patient portal <ArrowRight size={18} />
                </Link>

                <Link
                  id="hero-demo"
                  href="/login?mode=signin"
                  className="btn-secondary inline-flex items-center justify-center gap-2 font-extrabold text-sm no-underline"
                  style={{
                    minHeight: '2.9rem',
                    padding: '.76rem 1.2rem',
                    borderRadius: '.65rem',
                    background: 'rgba(255,255,255,.12)',
                    color: '#fff',
                    border: '1.5px solid rgba(255,255,255,.35)',
                    cursor: 'pointer',
                    transition: 'transform .18s ease, background .18s ease',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.2)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.12)'; (e.currentTarget as HTMLElement).style.transform = ''; }}
                >
                  Explore demo roles <Users size={17} />
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

              {/* Hero facts */}
              <div
                className="hero-facts mt-8 pt-4 grid grid-cols-3 gap-2 sm:gap-3"
                style={{ borderTop: '1px solid rgba(255,255,255,.2)' }}
              >
                {[
                  { stat: '4 steps', label: 'patient booking flow' },
                  { stat: '3 roles',  label: 'ready for demo' },
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

        {/* ── For providers ──────────────────────────────────────────────── */}
        <section
          id="for-providers"
          aria-label="Hospital portals"
          data-section="provider-portals"
          className="portal-split max-w-7xl mx-auto mt-4 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Doctor */}
          <article className="portal-panel border border-[var(--line)] rounded-xl p-6 sm:p-8 flex flex-col gap-5 hover:shadow-xl transition-shadow bg-[var(--surface)]">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'var(--mint)', color: 'var(--teal)' }}>
              <Stethoscope size={22} />
            </div>
            <div>
              <div
                className="eyebrow-dark flex items-center gap-2 mb-2"
                style={{ color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '.14em', fontSize: '.7rem', fontWeight: 800 }}
              >
                <span style={{ width: '.45rem', height: '.45rem', borderRadius: '50%', background: 'var(--teal)', display: 'inline-block' }} />
                Hospital care team
              </div>
              <h2 style={{ maxWidth: '15ch', margin: '.7rem 0 .75rem', color: 'var(--teal-dark)', fontSize: 'clamp(1.5rem, 3vw, 2.4rem)', lineHeight: 1.05, letterSpacing: '-.05em', fontWeight: 800 }}>
                Move each clinical handoff forward.
              </h2>
              <p style={{ color: 'var(--muted)', lineHeight: 1.6, fontSize: '.88rem' }}>
                Review the assigned queue, call the next patient, scan tickets, and follow visits through consultation.
              </p>
            </div>
            <Link
              id="open-doctor-portal"
              href="/login?role=doctor"
              className="btn-primary mt-auto inline-flex items-center justify-center gap-2 font-extrabold text-sm text-white no-underline"
              style={{ minHeight: '2.8rem', padding: '.76rem 1.1rem', borderRadius: '.65rem', background: 'var(--teal)', border: '1px solid var(--teal)', boxShadow: '0 4px 12px rgba(15,92,168,.28)', cursor: 'pointer' }}
            >
              Open doctor sign-in <ArrowRight size={16} />
            </Link>
          </article>

          {/* Ops */}
          <article className="portal-panel border border-[var(--line)] rounded-xl p-6 sm:p-8 flex flex-col gap-5 hover:shadow-xl transition-shadow bg-[var(--surface)]">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'var(--saffron-bg)', color: 'var(--saffron)' }}>
              <Building2 size={22} />
            </div>
            <div>
              <div
                className="flex items-center gap-2 mb-2"
                style={{ color: 'var(--saffron)', textTransform: 'uppercase', letterSpacing: '.14em', fontSize: '.7rem', fontWeight: 800 }}
              >
                <span style={{ width: '.45rem', height: '.45rem', borderRadius: '50%', background: 'var(--saffron)', display: 'inline-block' }} />
                Hospital Operations
              </div>
              <h2 style={{ maxWidth: '15ch', margin: '.7rem 0 .75rem', color: 'var(--teal-dark)', fontSize: 'clamp(1.5rem, 3vw, 2.4rem)', lineHeight: 1.05, letterSpacing: '-.05em', fontWeight: 800 }}>
                Keep rooms and walk-ins visible.
              </h2>
              <p style={{ color: 'var(--muted)', lineHeight: 1.6, fontSize: '.88rem' }}>
                Register walk-in patients, assign clinician queues, track room readiness, and monitor centre demand.
              </p>
            </div>
            <Link
              id="open-ops-portal"
              href="/login?role=staff"
              className="btn-secondary mt-auto inline-flex items-center justify-center gap-2 font-extrabold text-sm no-underline"
              style={{ minHeight: '2.8rem', padding: '.76rem 1.1rem', borderRadius: '.65rem', color: 'var(--teal-dark)', background: 'var(--surface)', border: '1px solid var(--line-strong)', boxShadow: '0 2px 8px rgba(15,92,168,.10)', cursor: 'pointer' }}
            >
              Open operations sign-in <ArrowRight size={16} />
            </Link>
          </article>
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
