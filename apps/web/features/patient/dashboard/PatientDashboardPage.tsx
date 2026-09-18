'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useSession, usePatient, useAppStore, sortQueue, queueStatus, getAppointmentSlots } from '@/lib/store/app-store';
import { PatientShell } from '@/components/layout/Shell';
import { DemoDB } from '@/lib/db/demo-db';
import { cn, estimatedWait } from '@/lib/utils';
import { PatientProfileSection } from './PatientProfileSection';
import {
  CalendarClock,
  CalendarPlus,
  CalendarCog,
  ClipboardCheck,
  ClipboardX,
  FileText,
  FileQuestion,
  ArrowRight,
  ArrowUpRight,
  QrCode,
  ShieldCheck,
  X,
  Printer,
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  Ban,
  Clock,
  Check,
  Siren,
  Pill,
  Droplets,
  Sparkles,
} from 'lucide-react';
import type { Prescription, PatientVisit } from '@smartcare/types';
import { EmptyState } from '@/components/ui/EmptyState';


export function PatientDashboardPage({ initialTab }: { initialTab?: string } = {}) {
  const { role } = useAuthGuard(['patient']);
  const { email } = useSession();
  const { patientData, patientVisits } = usePatient();
  const queue = useAppStore((s) => s.queue);
  const { cancelAppointment, claimRefund, showToast, recordPatientVisit, updateQueueItem } = useAppStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = initialTab || searchParams?.get('tab') || 'overview';

  // Selected visit for Prescription modal
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [prescription, setPrescription] = useState<Prescription | null>(null);

  // Appointment manager & cancellation state
  const [managingVisit, setManagingVisit] = useState<PatientVisit | null>(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [patientCancelReason, setPatientCancelReason] = useState('Schedule conflict or travel');
  const [refundReceipt, setRefundReceipt] = useState<PatientVisit | null>(null);

  if (!role) return null;

  const patientName = patientData.name || (email === 'patient@smartcare.demo' ? 'Asha Rao' : email.split('@')[0].replace(/[._-]/g, ' '));
  const latestVisit = patientVisits[0];

  // Active visit (not finished)
  const activeVisit = patientVisits.find((v) =>
    !['completed', 'cancelled', 'withdrawn', 'no-show'].includes(String(v.status || '').toLowerCase())
  );

  // Doctor or recently cancelled visit
  const recentlyCancelledVisit = patientVisits.find(
    (visit) =>
      ['cancelled', 'withdrawn'].includes(String(visit.status || '').toLowerCase()) &&
      (visit.cancelledBy === 'doctor' ||
        Date.now() - new Date(visit.cancelledAt || visit.date || Date.now()).getTime() < 48 * 3600 * 1000)
  );

  const availableSlots = getAppointmentSlots();


  const activeQueue = sortQueue(queue);
  const liveQueueEntry = activeVisit
    ? activeQueue.find((entry) => String(entry.id) === String(activeVisit.id))
    : null;
  const liveQueueIndex = liveQueueEntry
    ? activeQueue.findIndex((entry) => String(entry.id) === String(liveQueueEntry.id))
    : -1;
  const patientsAhead = liveQueueIndex >= 0 ? liveQueueIndex : null;
  const liveStatus = String(liveQueueEntry?.status || activeVisit?.status || 'booked').toLowerCase();

  const queuePosition = !liveQueueEntry
    ? 'Sync pending'
    : liveStatus === 'waiting'
    ? `#${liveQueueIndex + 1}`
    : liveStatus === 'called'
    ? 'Called'
    : liveStatus === 'in_progress'
    ? 'In room'
    : 'Updated';

  const queueEstimate = !liveQueueEntry
    ? 'Check again shortly'
    : liveStatus === 'waiting'
    ? `About ${Math.max(5, (patientsAhead || 0) * 12 + 10)} min`
    : liveStatus === 'called'
    ? 'Proceed now'
    : liveStatus === 'in_progress'
    ? 'Visit underway'
    : 'Status updated';

  const visitStatusLabel = (val: string) => {
    const s = String(val || 'booked').toLowerCase();
    const map: Record<string, string> = {
      booked: 'Booked',
      waiting: 'Waiting for the centre',
      called: 'Please proceed to reception',
      in_progress: 'In consultation',
      completed: 'Completed',
      cancelled: 'Cancelled',
      withdrawn: 'Withdrawn from queue',
    };
    return map[s] || 'Booked';
  };

  const handleOpenPrescription = (visitId: string) => {
    const rx = DemoDB.getPrescription(visitId);
    setPrescription(rx);
    setSelectedVisitId(visitId);
  };

  // Dedicated Patient Profile Tab View
  if (currentTab === 'profile') {
    return (
      <PatientShell subtitle="Patient portal" backHref="/dashboard/patient" backLabel="Back to overview">
        <div className="max-w-4xl mx-auto py-6 space-y-6">
          <header className="provider-header flex items-end justify-between gap-4 border-b-2 border-[#0a3b69] pb-3 mb-5">
            <div>
              <div className="eyebrow eyebrow-dark mb-1">
                <span className="eyebrow-dot" />
                Account &amp; Health Profile
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a3b69]">
                My Profile &amp; Preferences
              </h1>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Update personal particulars, emergency contacts, and clinical preferences.
              </p>
            </div>
            <Link
              href="/dashboard/patient"
              className="btn-secondary btn-compact flex items-center gap-1.5 text-xs no-underline"
            >
              ← Back to Overview
            </Link>
          </header>

          <PatientProfileSection />
        </div>
      </PatientShell>
    );
  }

  return (
    <PatientShell subtitle="Patient portal" backHref="/" backLabel="Back to home">
      <div className="max-w-4xl mx-auto py-6 space-y-6">
        {/* Header matching original provider-header */}
        <header className="provider-header flex items-end justify-between gap-4 border-b-2 border-[#0a3b69] pb-3 mb-5">
          <div>
            <div className="eyebrow eyebrow-dark mb-1">
              <span className="eyebrow-dot" />
              Patient dashboard
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a3b69]">
              Good to see you, {patientName}.
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Keep your care plans, previous visits, and prescription records in one place.
            </p>
          </div>
          <div className="text-right text-xs text-[var(--text-muted)] hidden sm:block">
            {patientVisits.length} saved records
            <br />
            <strong className="text-[var(--text)]">Private demo history</strong>
          </div>
        </header>

        {/* Next step banner matching patient-next-action */}
        <section
          className="patient-next-action flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-[#b8d6f1] bg-[#eaf4fd]"
          aria-label="Next patient action"
        >
          <div>
            <span className="eyebrow eyebrow-dark mb-1">
              <span className="eyebrow-dot" />
              Next step
            </span>
            <h2 className="text-xl font-bold text-[#0a3b69]">Need care today?</h2>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              Search nearby centres, compare queues, and reserve a visit when it suits you.
            </p>
          </div>
          <Link
            href="/dashboard/patient/apply/1"
            className="btn-primary flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold text-white shadow-sm shrink-0 no-underline transition-all hover:brightness-105"
            style={{ background: 'var(--teal)' }}
          >
            Book an appointment <ArrowRight size={16} />
          </Link>
        </section>

        {/* ── Emergency Cancellation Banner ── */}
        {recentlyCancelledVisit && (
          <section
        className={cn(
          'p-5 rounded-2xl border-l-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all animate-slide-down',
          recentlyCancelledVisit.cancelledBy === 'doctor'
            ? 'border-l-red-600 border-t border-r border-b border-red-200 bg-red-50/40'
            : 'border-l-amber-500 border-t border-r border-b border-amber-200 bg-amber-50/40'
        )}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={cn(
                  'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold',
                  recentlyCancelledVisit.cancelledBy === 'doctor'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-amber-100 text-amber-700'
                )}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-1',
                    recentlyCancelledVisit.cancelledBy === 'doctor'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  )}
                >
                  {recentlyCancelledVisit.cancelledBy === 'doctor' ? (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      Appointment Cancelled by Hospital
                    </>
                  ) : (
                    'Appointment Cancelled'
                  )}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  {recentlyCancelledVisit.cancelledBy === 'doctor'
                    ? `Dr. ${recentlyCancelledVisit.doctorName || 'Clinician'} had an unexpected clinical emergency`
                    : 'You cancelled this consultation'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-700 mt-1">
                  <strong>Clinician's Note:</strong>{' '}
                  {recentlyCancelledVisit.cancellationReason ||
                    (recentlyCancelledVisit.cancelledBy === 'doctor'
                      ? 'Doctor summoned for emergency trauma surgery duty'
                      : 'Schedule conflict')}
                </p>
                <small className="text-xs text-slate-500 mt-0.5 block">
                  Centre: {recentlyCancelledVisit.hospital} · Ref:{' '}
                  <strong className="text-slate-800 font-mono">{recentlyCancelledVisit.id}</strong>
                </small>
              </div>
            </div>

            {/* Actions: Reschedule Free of Charge or Claim ₹125 Refund */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  setManagingVisit(recentlyCancelledVisit);
                  setSelectedSlot(availableSlots[0]?.value || '');
                  setShowCancelConfirmation(false);
                }}
                className="btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition shadow-sm min-h-[44px]"
              >
                <CalendarClock size={14} /> Reschedule free of charge
              </button>

              {recentlyCancelledVisit.refundStatus === 'claimed' || recentlyCancelledVisit.refundStatus === 'processed' ? (
                <button
                  type="button"
                  onClick={() => setRefundReceipt(recentlyCancelledVisit)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold min-h-[44px]"
                >
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  Refund Claimed ({recentlyCancelledVisit.refundRef || 'REF-OK'})
                </button>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    const res = await claimRefund(recentlyCancelledVisit.id);
                    if (res.success) {
                      showToast(`Full fee refund ₹125 initiated. Reference: ${res.ref}`, 'success');
                      setRefundReceipt({
                        ...recentlyCancelledVisit,
                        refundStatus: 'claimed',
                        refundRef: res.ref,
                      });
                    } else {
                      showToast(res.error || 'Refund request failed', 'error');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition min-h-[44px]"
                >
                  <Receipt size={14} className="text-teal-700" />
                  Claim ₹125 refund
                </button>
              )}
            </div>
          </section>
        )}

        {/* 4 Summary Stats — theme-aware via CSS classes */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-label="Patient summary">
          <div className="patient-stat-card stat-card">
            <span className="patient-stat-label">Previous visits</span>
            <strong className="patient-stat-value">{patientVisits.length}</strong>
            <small className="patient-stat-sub">Stored on this device</small>
          </div>
          <div className="patient-stat-card stat-card">
            <span className="patient-stat-label">Last visit</span>
            <strong className="patient-stat-value truncate">
              {latestVisit ? latestVisit.date.replace(' 2026', '') : '—'}
            </strong>
            <small className="patient-stat-sub truncate block">
              {latestVisit ? latestVisit.hospital : 'No history yet'}
            </small>
          </div>
          <div className="patient-stat-card stat-card">
            <span className="patient-stat-label">Care preference</span>
            <strong className="patient-stat-value">
              {patientData.doctorPref || 'General'}
            </strong>
            <small className="patient-stat-sub">Can change during booking</small>
          </div>
          <div className="patient-stat-card stat-card">
            <span className="patient-stat-label">Location</span>
            <strong className="patient-stat-value">
              {patientData.city || 'Hyderabad'}
            </strong>
            <small className="patient-stat-sub">Used only for care search</small>
          </div>
        </div>

        {/* Next appointment card matching patient-appointment-card */}
        {activeVisit ? (
          <section
            className="p-5 rounded-2xl border border-[#8bbbe2] bg-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
            aria-label="Next appointment and live queue status"
          >
            <div className="flex items-start gap-4">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
            liveStatus === 'called' ? 'bg-green-100 text-green-700 queue-badge-called' :
            liveStatus === 'in_progress' ? 'bg-[var(--teal-10)] text-[var(--teal)]' :
            'bg-[var(--mint)] text-[var(--teal)]'
          )}>
                <CalendarClock size={24} />
              </div>
              <div>
                <span className="eyebrow eyebrow-dark mb-1">
                  <span className="eyebrow-dot" />
                  Next appointment
                </span>
                <h2 className="text-lg font-bold text-[#0a3b69]">{activeVisit.hospital || 'SmartCare centre'}</h2>
                <p className="text-sm text-[var(--text-muted)] mt-0.5">
                  {activeVisit.department || 'General medicine'} · {activeVisit.doctorName || 'Next available clinician'}
                </p>
                <p className="text-xs text-[var(--text-dim)] mt-1">
                  {activeVisit.consultationType || 'In-person consultation'} | {activeVisit.appointmentDate || activeVisit.date || 'Today'} at {activeVisit.appointmentSlot || 'Next available'} · Ref:{' '}
                  <strong className="text-[#0a3b69]">{activeVisit.id || 'SC-DEMO'}</strong>
                </p>

                {/* Telemetry */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-3 text-center sm:text-left" aria-live="polite">
                  <div className="p-1.5 sm:p-2 border border-[#c5ddf1] bg-[#f4f9fd] rounded-lg min-w-0">
                    <small className="text-[0.56rem] sm:text-[0.6rem] uppercase tracking-wider font-extrabold text-[var(--text-muted)] block truncate">Live pos</small>
                    <strong className="text-xs sm:text-sm font-bold text-[#0a3b69] truncate block">{queuePosition}</strong>
                  </div>
                  <div className="p-1.5 sm:p-2 border border-[#c5ddf1] bg-[#f4f9fd] rounded-lg min-w-0">
                    <small className="text-[0.56rem] sm:text-[0.6rem] uppercase tracking-wider font-extrabold text-[var(--text-muted)] block truncate">Ahead</small>
                    <strong className="text-xs sm:text-sm font-bold text-[#0a3b69] truncate block">{patientsAhead === null ? '—' : patientsAhead}</strong>
                  </div>
                  <div className="p-1.5 sm:p-2 border border-[#c5ddf1] bg-[#f4f9fd] rounded-lg min-w-0">
                    <small className="text-[0.56rem] sm:text-[0.6rem] uppercase tracking-wider font-extrabold text-[var(--text-muted)] block truncate">Est. wait</small>
                    <strong className="text-xs sm:text-sm font-bold text-[#0a3b69] truncate block">{queueEstimate}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-2 shrink-0 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-[var(--line)]">
              <strong className="text-xs uppercase tracking-wider text-[#0a3b69] font-extrabold">
                {visitStatusLabel(liveStatus)}
              </strong>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleOpenPrescription(activeVisit.id)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--line)] bg-white text-xs font-semibold text-[var(--text)] hover:bg-[var(--mint)] transition-colors"
                >
                  <FileText size={14} /> Clinical slip
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setManagingVisit(activeVisit);
                    setSelectedSlot(availableSlots[0]?.value || '');
                    setShowCancelConfirmation(false);
                  }}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--line)] bg-white text-xs font-semibold text-[var(--text)] hover:bg-[var(--mint)] transition-colors"
                >
                  <CalendarCog size={14} /> Manage
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section
            className="p-5 rounded-2xl border border-[var(--line)] bg-[#e5f1fc] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            aria-label="Next appointment"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white text-[#0f5ca8] flex items-center justify-center shrink-0">
                <CalendarPlus size={24} />
              </div>
              <div>
                <span className="eyebrow eyebrow-dark mb-1">
                  <span className="eyebrow-dot" />
                  No upcoming appointment
                </span>
                <h2 className="text-base font-bold text-[#0a3b69]">Keep your care plan moving.</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Choose a nearby centre and reserve a visit when you are ready.</p>
              </div>
            </div>
            <Link
              href="/dashboard/patient/apply/1"
              className="flex items-center gap-1.5 text-xs font-bold text-[#0f5ca8] hover:underline no-underline shrink-0"
            >
              Book a visit <ArrowRight size={14} />
            </Link>
          </section>
        )}

        {/* ── Quick Health Services Grid ── */}
        <section aria-label="Quick health services">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[#0a3b69] flex items-center gap-1.5">
              <Sparkles size={16} className="text-[#0f5ca8]" />
              Quick Health Services &amp; Emergency Access
            </h2>
            <span className="text-[11px] text-[var(--text-muted)] font-medium">National Health Stack (ABDM)</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Link
              href="/ambulance"
              className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100/70 transition-all group flex flex-col justify-between no-underline shadow-xs hover:shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
                  <Siren size={18} />
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full bg-rose-200/80 text-rose-800">
                  24/7 SOS
                </span>
              </div>
              <div>
                <strong className="text-sm font-bold text-rose-950 block group-hover:text-rose-700 transition-colors">
                  Ambulance 108
                </strong>
                <p className="text-[11px] text-rose-800/80 mt-0.5 line-clamp-2">
                  Live GPS tracking, emergency triage &amp; dispatch to nearest PHC.
                </p>
              </div>
              <span className="text-[11px] font-bold text-rose-700 flex items-center gap-1 mt-3">
                Request SOS <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>

            <Link
              href="/pharmacy"
              className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 transition-all group flex flex-col justify-between no-underline shadow-xs hover:shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
                  <Pill size={18} />
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-800">
                  Affordable
                </span>
              </div>
              <div>
                <strong className="text-sm font-bold text-emerald-950 block group-hover:text-emerald-700 transition-colors">
                  Jan Aushadhi Kendra
                </strong>
                <p className="text-[11px] text-emerald-800/80 mt-0.5 line-clamp-2">
                  Generic medicines at 50-90% subsidized rates with live PHC stock check.
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 mt-3">
                Find Medicines <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>

            <Link
              href="/dashboard/patient/history"
              className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 transition-all group flex flex-col justify-between no-underline shadow-xs hover:shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-9 h-9 rounded-lg bg-[#0a3b69] text-white flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
                  <QrCode size={18} />
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-200/80 text-blue-800">
                  ABHA Verified
                </span>
              </div>
              <div>
                <strong className="text-sm font-bold text-[#0a3b69] block group-hover:text-blue-700 transition-colors">
                  Digital Health Passport
                </strong>
                <p className="text-[11px] text-blue-900/80 mt-0.5 line-clamp-2">
                  ABDM health records, allergies, clinical lab reports &amp; QR access.
                </p>
              </div>
              <span className="text-[11px] font-bold text-[#0f5ca8] flex items-center gap-1 mt-3">
                View Records <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>

            <Link
              href="/donations"
              className="p-4 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/70 transition-all group flex flex-col justify-between no-underline shadow-xs hover:shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
                  <Droplets size={18} />
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full bg-purple-200/80 text-purple-800">
                  Life Saving
                </span>
              </div>
              <div>
                <strong className="text-sm font-bold text-purple-950 block group-hover:text-purple-700 transition-colors">
                  Blood &amp; Organ Network
                </strong>
                <p className="text-[11px] text-purple-900/80 mt-0.5 line-clamp-2">
                  Regional blood bank inventory &amp; donor registration registry.
                </p>
              </div>
              <span className="text-[11px] font-bold text-purple-700 flex items-center gap-1 mt-3">
                Donate / Search <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          </div>
        </section>


        {/* Previous visits & clinical records */}
        <section className="bg-white border border-[var(--line)] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--line)] mb-4">
            <div>
              <h2 className="text-base font-bold text-[#0a3b69]">Previous visits &amp; clinical records</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Review clinician-authored demo notes stored for each visit on this device.
              </p>
            </div>
            <Link
              href="/dashboard/patient/apply/1"
              className="text-xs font-bold text-[#0f5ca8] hover:underline no-underline flex items-center gap-1"
            >
              Book again <ArrowUpRight size={13} />
            </Link>
          </div>

          {patientVisits.length === 0 ? (
            <EmptyState
              icon={ClipboardX}
              title="No clinical visits yet"
              description="Your consultation notes and prescriptions will appear here after your first appointment."
              action={{
                label: "Book an Appointment",
                href: "/dashboard/patient/apply/1",
              }}
              compact
            />
          ) : (
            <div className="divide-y divide-[var(--line)]">
              {patientVisits.map((visit) => {
                const hasRx = Boolean(DemoDB.getPrescription(visit.id));
                return (
                  <div key={visit.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#e5f1fc] text-[#0f5ca8] flex items-center justify-center shrink-0 mt-0.5">
                        <ClipboardCheck size={18} />
                      </div>
                      <div>
                        <strong className="text-sm text-[#0a3b69] font-bold block">{visit.hospital || 'SmartCare centre'}</strong>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {visit.reason || 'General consultation'} · Ref: {visit.reference || visit.id || 'SC-DEMO'}
                        </p>
                        <small className="text-[0.7rem] text-[var(--text-dim)]">
                          {visit.date || 'Recent date'} · Status:{' '}
                          <span className="text-[#0f5ca8] font-bold uppercase tracking-wider">{visitStatusLabel(visit.status)}</span>
                        </small>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenPrescription(visit.id)}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--line)] bg-[#f8fafc] text-xs font-semibold text-[var(--text)] hover:bg-[var(--mint)] transition-colors"
                      >
                        {hasRx ? <FileText size={13} className="text-[#0f5ca8]" /> : <FileQuestion size={13} className="text-[var(--text-muted)]" />}
                        <span>{hasRx ? 'View demo record' : 'No record yet'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Medical Passport quick banner */}
        <section className="p-5 rounded-2xl border border-[var(--line)] bg-[#f8fafc] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#e5f1fc] text-[#0f5ca8] flex items-center justify-center shrink-0">
              <QrCode size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#0a3b69]">Patient Medical Passport</h3>
                <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full bg-[#e5f1fc] text-[#0f5ca8] border border-[#0f5ca8]/20">
                  <ShieldCheck size={11} className="inline mr-0.5" /> Verified
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Portable clinical history, allergies, and emergency protocols accessible anywhere.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/patient/history"
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-[#0f5ca8]/30 bg-white text-xs font-bold text-[#0f5ca8] hover:bg-[#e5f1fc] transition-colors no-underline shrink-0"
          >
            Open Passport <ArrowRight size={14} />
          </Link>
        </section>
      </div>

      {/* ── Prescription / Clinical Slip Modal ── */}
      {selectedVisitId && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedVisitId(null)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--line)] shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-[#0a3b69] text-white flex items-center justify-center shrink-0">
                  <HeartPulse size={19} />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#0a3b69]">Clinical note &amp; e-prescription</h3>
                  <p className="text-[11px] sm:text-xs text-[var(--text-muted)]">Saved locally for the SmartCare prototype.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVisitId(null)}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] active:scale-95 transition-all"
                aria-label="Close prescription"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-5">
              {prescription ? (
                <div className="prescription-paper border border-[var(--line)] rounded-xl p-5 bg-white">
                  <div className="rx-header flex justify-between items-start border-b-2 border-[#0f5ca8] pb-3 mb-4">
                    <div className="rx-brand">
                      <h2 className="text-lg font-bold text-[#0a3b69]">SmartCare Health Network</h2>
                      <p className="text-xs text-[var(--text-muted)]">Verified digital outpatient summary</p>
                    </div>
                    <div className="rx-meta text-right text-xs text-[var(--text-muted)]">
                      <div>Issued: <strong className="text-[var(--text)]">{prescription.issuedAt || 'Recent'}</strong></div>
                      <div>Clinician: <strong className="text-[#0a3b69]">{prescription.providerName || 'Care provider'}</strong></div>
                    </div>
                  </div>

                  <div className="rx-patient-info grid grid-cols-3 gap-3 p-3 bg-[#f4f8fc] rounded-lg mb-4 text-xs">
                    <div>
                      <span className="text-[var(--text-muted)] block">Patient</span>
                      <strong className="text-[var(--text)]">{patientName}</strong>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block">Visit ID</span>
                      <strong className="text-[var(--text)]">{selectedVisitId}</strong>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block">Centre</span>
                      <strong className="text-[var(--text)]">{activeVisit?.hospital || 'SmartCare Community Hospital'}</strong>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0f5ca8] mb-1.5 border-b border-[#e0ecf7] pb-1">
                      Clinical Assessment
                    </h4>
                    <p className="text-sm text-[var(--text)] leading-relaxed bg-[#fbfdff] p-3 rounded-lg border border-[#e0ecf7]">
                      {prescription.assessment || 'General consultation completed. Vitals stable.'}
                    </p>
                  </div>

                  {prescription.medicines && prescription.medicines.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0f5ca8] mb-1.5 border-b border-[#e0ecf7] pb-1">
                        Prescribed Medication
                      </h4>
                      <div className="overflow-x-auto w-full border border-[var(--line)] rounded-lg">
                        <table className="w-full min-w-[420px] text-xs border-collapse">
                          <thead>
                            <tr className="bg-[#f0f6fc] text-left text-[#0a3b69]">
                              <th className="p-2 border-b border-[var(--line)] font-bold">Medicine</th>
                              <th className="p-2 border-b border-[var(--line)] font-bold">Strength</th>
                              <th className="p-2 border-b border-[var(--line)] font-bold">Dosage</th>
                              <th className="p-2 border-b border-[var(--line)] font-bold">Duration</th>
                              <th className="p-2 border-b border-[var(--line)] font-bold">Instructions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {prescription.medicines.map((m, idx) => (
                              <tr key={idx} className="border-b border-[var(--line)] last:border-b-0">
                                <td className="p-2 font-bold text-[#0a3b69]">{m.name}</td>
                                <td className="p-2 text-[var(--text-muted)]">{m.strength || '—'}</td>
                                <td className="p-2 text-[var(--text)]">{m.dosage || '—'}</td>
                                <td className="p-2 text-[var(--text-muted)]">{m.duration || '—'}</td>
                                <td className="p-2 text-[var(--text)]">{m.instructions || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {prescription.labSummary && (
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0f5ca8] mb-1.5 border-b border-[#e0ecf7] pb-1">
                        Lab &amp; Follow-Up Notes
                      </h4>
                      <p className="text-xs text-[var(--text-muted)] bg-[#fbfdff] p-3 rounded-lg border border-[#e0ecf7]">
                        {prescription.labSummary}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  <FileQuestion size={36} className="mx-auto mb-2 text-[var(--text-dim)]" />
                  <p className="text-sm font-semibold">No prescription recorded for this visit yet.</p>
                  <p className="text-xs text-[var(--text-dim)] mt-1">Prescription notes are added by the consulting doctor during or after your appointment.</p>
                </div>
              )}
            </div>

            {/* Modal actions */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-4 border-t border-[var(--line)] bg-[var(--surface-sunken)] shrink-0">
              <button
                type="button"
                onClick={() => setSelectedVisitId(null)}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl border border-[var(--line)] text-xs font-semibold hover:bg-white active:scale-95 transition-all"
              >
                Close
              </button>
              {prescription && (
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm active:scale-95 transition-all"
                  style={{ background: 'var(--teal)' }}
                >
                  <Printer size={15} /> Print slip
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Appointment Manager Modal ── */}
      {managingVisit && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CalendarCog className="w-5 h-5 text-teal-600" />
                  Manage Appointment
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {managingVisit.hospital || 'SmartCare centre'} ·{' '}
                  {managingVisit.doctorName || 'General care clinician'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManagingVisit(null)}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] text-slate-400 hover:text-slate-600 active:scale-95 transition-all rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            {/* Reschedule Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const slotObj = availableSlots.find((s) => s.value === selectedSlot) || availableSlots[0];
                try {
                  const updated = {
                    ...managingVisit,
                    appointmentDate: slotObj.date,
                    appointmentSlot: slotObj.slot,
                    status: 'waiting' as const,
                    cancelledBy: undefined,
                    cancellationReason: undefined,
                  };
                  recordPatientVisit(updated);
                  updateQueueItem(managingVisit.id, {
                    status: 'waiting',
                    appointmentDate: slotObj.date,
                    appointmentSlot: slotObj.slot,
                  });
                  showToast('Appointment rescheduled free of charge! Slot synced.', 'success');
                  setManagingVisit(null);
                  window.location.reload();
                } catch (err) {
                  showToast('Failed to reschedule appointment', 'error');
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Choose New Consultation Slot (Free of charge)
                </label>
                <select
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                  style={{ fontSize: '16px' }}
                >
                  {availableSlots.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Rescheduling releases your old slot and updates the hospital queue in real-time.
                </span>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-sm min-h-[44px]"
                >
                  <CalendarClock size={15} /> Save New Time
                </button>
              </div>
            </form>

            {/* Danger Zone: Patient Cancellation */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <strong className="text-xs font-bold text-rose-700 uppercase tracking-wider block">
                    Cancel Appointment
                  </strong>
                  <p className="text-xs text-slate-500">
                    Releases this consultation slot back to other patients in need.
                  </p>
                </div>
                {!showCancelConfirmation && (
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirmation(true)}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition"
                  >
                    Cancel Consultation
                  </button>
                )}
              </div>

              {showCancelConfirmation && (
                <div className="mt-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 animate-in fade-in">
                  <label className="block text-xs font-bold text-rose-900 mb-1">
                    Select reason for cancellation:
                  </label>
                  <select
                    value={patientCancelReason}
                    onChange={(e) => setPatientCancelReason(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-rose-200 bg-white text-xs text-slate-800 focus:outline-none mb-3"
                    style={{ fontSize: '16px' }}
                  >
                    <option value="Schedule conflict or travel">Schedule conflict or travel</option>
                    <option value="Health improved / Emergency resolved">
                      Health improved / Emergency resolved
                    </option>
                    <option value="Visiting alternate clinic / Chose alternative hospital">
                      Visiting alternate clinic / Chose alternative hospital
                    </option>
                    <option value="Wait time too long">Wait time too long</option>
                    <option value="Personal circumstances">Personal circumstances</option>
                  </select>

                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirmation(false)}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold bg-white hover:bg-slate-50 min-h-[44px]"
                    >
                      Keep Appointment
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await cancelAppointment(
                          managingVisit.id,
                          'patient',
                          patientCancelReason
                        );
                        if (res.success) {
                          showToast('Appointment cancelled and doctor slot released.', 'info');
                          setManagingVisit(null);
                        } else {
                          showToast(res.error || 'Failed to cancel appointment', 'error');
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition min-h-[44px]"
                    >
                      Confirm Cancellation
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Refund Receipt Modal ── */}
      {refundReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto animate-in fade-in">
            <div className="text-center pb-4 border-b border-slate-100 mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2 font-bold">
                <CheckCircle2 size={26} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">₹125 Full Refund Initiated</h3>
              <p className="text-xs text-slate-500 mt-0.5">Official SmartCare Compensation Voucher</p>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Refund Amount:</span>
                <strong className="text-emerald-700 text-sm font-bold">₹125.00</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Transaction Ref:</span>
                <span className="font-bold text-slate-800">{refundReceipt.refundRef || 'REF-OK'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Consultation Ref:</span>
                <span className="text-slate-800">{refundReceipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Hospital / Centre:</span>
                <span className="text-slate-800">{refundReceipt.hospital}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Payout Target:</span>
                <span className="text-slate-800">Original UPI / Bank Account</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Settlement Window:</span>
                <span className="text-slate-800">Instant (Within 15 mins)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setRefundReceipt(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition min-h-[44px]"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </PatientShell>
  );
}

