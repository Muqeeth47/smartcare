'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useSession, useQueue, useAppStore, CARE_TEAM } from '@/lib/store/app-store';
import { WorkspaceShell } from '@/components/layout/Shell';
import { DemoDB } from '@/lib/db/demo-db';
import { cn, getTriageColor } from '@/lib/utils';
import {
  HeartPulse,
  Stethoscope,
  QrCode,
  NotebookPen,
  RefreshCw,
  ArrowRight,
  Check,
  X,
  Clock,
  AlertTriangle,
  Users,
  Building2,
  Save,
  ShieldPlus,
  Pill,
  TriangleAlert,
  ClipboardList,
  Siren,
  BadgeInfo,
  Hospital as HospitalIcon,
  Camera,
  Ban,
  ShieldCheck,
  ExternalLink,
  FileText,
  Activity,
  CheckCheck,
  Thermometer,
} from 'lucide-react';
import type { QueueItem, Prescription, QueueStatus, PatientMedicalHistory } from '@smartcare/types';
import { useAmbulance } from '@/lib/store/app-store';
import { ERxStudioModal } from './ERxStudioModal';
import { LiveQueueTriageVisualizer } from './LiveQueueTriageVisualizer';

export function HospitalWorkspacePage() {
  const { role } = useAuthGuard(['doctor', 'staff']);
  const { hospital, city } = useSession();
  const { queue, metrics, sorted, nextPatient, cancelledQueue } = useQueue();
  const { updateQueueItem, cancelAppointment, showToast } = useAppStore();
  const { activeAmbulance } = useAmbulance();
  const router = useRouter();

  // QR Scanner modal state
  const [showQRModal, setShowQRModal] = useState(false);
  const [manualQRInput, setManualQRInput] = useState('');
  const [passportModalData, setPassportModalData] = useState<{
    passportId: string;
    profile: Record<string, string>;
    history: PatientMedicalHistory;
  } | null>(null);

  // Trauma bay prepped state
  const [traumaBayPrepped, setTraumaBayPrepped] = useState(false);

  // Vitals capture modal state
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [vitalsPatient, setVitalsPatient] = useState<QueueItem | null>(null);
  const [vitalsBp, setVitalsBp] = useState('120/80');
  const [vitalsPulse, setVitalsPulse] = useState('76');
  const [vitalsSpo2, setVitalsSpo2] = useState('99');
  const [vitalsTemp, setVitalsTemp] = useState('98.4');

  // Cancellation modal state
  const [cancellingPatient, setCancellingPatient] = useState<QueueItem | null>(null);
  const [cancelReason, setCancelReason] = useState('Doctor summoned for emergency trauma surgery');

  // Prescription modal state
  const [editingPatient, setEditingPatient] = useState<QueueItem | null>(null);
  const [rxAssessment, setRxAssessment] = useState('');
  const [rxMedName, setRxMedName] = useState('');
  const [rxStrength, setRxStrength] = useState('');
  const [rxDosage, setRxDosage] = useState('');
  const [rxDuration, setRxDuration] = useState('');
  const [rxInstructions, setRxInstructions] = useState('');
  const [rxLabSummary, setRxLabSummary] = useState('');
  const [rxBp, setRxBp] = useState('120/80 mmHg');
  const [rxPulse, setRxPulse] = useState('72 bpm');
  const [rxSpo2, setRxSpo2] = useState('99%');

  const handleOpenVitalsModal = (patient: QueueItem) => {
    setVitalsPatient(patient);
    const existing = DemoDB.getPrescription(patient.id);
    if (existing?.vitals) {
      setVitalsBp(existing.vitals.bp?.replace(' mmHg', '') || '120/80');
      setVitalsPulse(existing.vitals.pulse?.replace(' bpm', '') || '76');
      setVitalsSpo2(existing.vitals.spo2?.replace('%', '') || '99');
      setVitalsTemp(existing.vitals.temp?.replace(' °F', '') || '98.4');
    } else {
      setVitalsBp('120/80');
      setVitalsPulse('76');
      setVitalsSpo2('99');
      setVitalsTemp('98.4');
    }
    setShowVitalsModal(true);
  };

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vitalsPatient) return;
    const existing = DemoDB.getPrescription(vitalsPatient.id) || {
      rxId: `RX-${Date.now().toString().slice(-6)}`,
      visitId: vitalsPatient.id,
      patientName: vitalsPatient.name,
      doctorName: vitalsPatient.doctorName || 'Dr Meera Shah',
      hospital: hospital || 'SmartCare Community Hospital',
      assessment: 'Clinical examination and vitals recorded on arrival.',
      medicines: [],
      issuedAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    };

    DemoDB.savePrescription(vitalsPatient.id, {
      ...existing,
      vitals: {
        bp: `${vitalsBp} mmHg`,
        pulse: `${vitalsPulse} bpm`,
        spo2: `${vitalsSpo2}%`,
        temp: `${vitalsTemp} °F`,
      },
    });

    setRxBp(`${vitalsBp} mmHg`);
    setRxPulse(`${vitalsPulse} bpm`);
    setRxSpo2(`${vitalsSpo2}%`);

    setShowVitalsModal(false);
    showToast(`Vitals saved for ${vitalsPatient.name} (BP: ${vitalsBp}, SpO2: ${vitalsSpo2}%).`, 'success');
  };

  const handleOpenMedicalPassport = (patient: QueueItem) => {
    let passport = DemoDB.getMedicalPassport('SC-PASSPORT-8924', 'doctor');
    if (passport) {
      if (patient.name && patient.name !== 'Asha Rao') {
        passport = {
          ...passport,
          profile: {
            ...passport.profile,
            name: patient.name,
            age: patient.age ? String(patient.age) : '32',
            gender: patient.gender || 'Not specified',
          },
        };
      }
      setPassportModalData(passport);
      showToast(`Medical Passport opened for ${patient.name}`, 'info');
    } else {
      showToast('No verified medical passport on file.', 'info');
    }
  };

  if (!role) return null;

  const current = nextPatient;
  const currentStatus = String(current?.status || 'waiting').toLowerCase();
  const currentPrescription = current ? DemoDB.getPrescription(current.id) : null;

  const currentAction: [QueueStatus | null, string] =
    currentStatus === 'waiting'
      ? ['called', 'Call next']
      : currentStatus === 'called'
      ? ['in_progress', 'Start visit']
      : currentStatus === 'in_progress'
      ? ['completed', 'Complete visit']
      : [null, 'Queue ready'];

  const statusLabel = (value?: string) => {
    const s = String(value || 'waiting').toLowerCase();
    if (s === 'waiting') return 'Waiting';
    if (s === 'called') return 'Called';
    if (s === 'in_progress') return 'In consultation';
    if (s === 'completed') return 'Completed';
    return 'Active';
  };

  const handleAdvanceCurrent = () => {
    if (!current || !currentAction[0]) return;
    updateQueueItem(current.id, { status: currentAction[0] });
    showToast(`Patient status updated: ${currentAction[1]}`, 'success');
  };

  const handleOpenPrescriptionModal = (patient: QueueItem) => {
    const existing = DemoDB.getPrescription(patient.id);
    const med = existing?.medicines?.[0];
    setRxAssessment(existing?.assessment || '');
    setRxMedName(med?.name || '');
    setRxStrength(med?.strength || '');
    setRxDosage(med?.dosage || '');
    setRxDuration(med?.duration || '');
    setRxInstructions(med?.instructions || '');
    setRxLabSummary(existing?.labSummary || '');
    if (existing?.vitals) {
      setRxBp(existing.vitals.bp || '120/80 mmHg');
      setRxPulse(existing.vitals.pulse || '72 bpm');
      setRxSpo2(existing.vitals.spo2 || '99%');
    } else {
      setRxBp('120/80 mmHg');
      setRxPulse('72 bpm');
      setRxSpo2('99%');
    }
    setEditingPatient(patient);
  };

  const handleSavePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;
    const medicines = rxMedName.trim()
      ? [
          {
            name: rxMedName.trim(),
            strength: rxStrength.trim(),
            dosage: rxDosage.trim(),
            duration: rxDuration.trim(),
            instructions: rxInstructions.trim(),
          },
        ]
      : [];

    const rxId = editingPatient.rxId || `RX-2026-${editingPatient.id.slice(-6).toUpperCase()}`;

    DemoDB.savePrescription(editingPatient.id, {
      rxId,
      assessment: rxAssessment.trim(),
      medicines,
      labSummary: rxLabSummary.trim(),
      providerName: 'Dr Meera Shah',
      doctorName: 'Dr Meera Shah',
      doctorRegNo: 'NMC-2018-94821',
      hospital: hospital || 'SmartCare Community Hospital',
      tamperHash: 'SEC-99A82B-VERIFIED',
      vitals: {
        bp: rxBp,
        pulse: rxPulse,
        spo2: rxSpo2,
      },
      issuedAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    });

    showToast(`Prescription ${rxId} issued with tamper-proof QR code.`, 'success');
    setEditingPatient(null);
  };

  const handleOpenQRModal = () => {
    setManualQRInput('');
    setShowQRModal(true);
  };

  const handleProcessQR = (val: string) => {
    const raw = val.trim();
    if (!raw) return;
    if (raw.startsWith('SC-PASSPORT-')) {
      const passport = DemoDB.getMedicalPassport(raw, 'doctor');
      if (passport) {
        setPassportModalData(passport);
        setShowQRModal(false);
        showToast('Medical Passport record opened.', 'success');
      } else {
        showToast('Medical Passport ID not recognized in demo records.', 'error');
      }
      return;
    }

    const found = queue.find((q) => q.id.toLowerCase() === raw.toLowerCase());
    if (found) {
      updateQueueItem(found.id, { status: 'called' });
      setShowQRModal(false);
      showToast(`Patient ${found.name} called into OPD room.`, 'success');
    } else {
      showToast(`Appointment reference ${raw} verified.`, 'info');
      setShowQRModal(false);
    }
  };


  return (
    <WorkspaceShell title="Hospital workspace" subtitle="Hospital portal" backHref="/" backLabel="Back to home">
      <div className="max-w-6xl mx-auto py-6 space-y-6">
        {/* Incoming Emergency Trauma Alert Banner */}
        {activeAmbulance && activeAmbulance.status === 'dispatched' && (
          <div className="emergency-trauma-banner bg-red-50 border-2 border-red-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md animate-pulse">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Siren className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <strong className="text-red-700 text-sm sm:text-base font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                    <Siren className="w-4 h-4 text-red-600 animate-pulse shrink-0" />
                    INCOMING EMERGENCY TRAUMA ALERT ({activeAmbulance.typeLabel})
                  </strong>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                    ICU Bed #03 Held
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 mt-1">
                  Patient: <strong>{activeAmbulance.patientName}</strong> (Age 48 · Severe respiratory distress) · Vehicle: <strong>{activeAmbulance.driver.vehicleNo}</strong> · ETA:{' '}
                  <strong className="text-red-700 font-extrabold">~{activeAmbulance.etaMinutes} mins</strong>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <span className="px-3 py-1.5 rounded-xl bg-white border border-red-200 text-xs font-bold text-red-700 shadow-2xs">
                {traumaBayPrepped ? 'Bay 01 Ready · Team Standby' : 'ICU Bed #03 Held'}
              </span>
              <button
                type="button"
                id="ack-trauma-btn"
                disabled={traumaBayPrepped}
                onClick={() => {
                  setTraumaBayPrepped(true);
                  showToast('Trauma Bay 01 prepped and resuscitation team on immediate standby.', 'success');
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm',
                  traumaBayPrepped
                    ? 'bg-emerald-600 text-white cursor-default'
                    : 'bg-red-600 hover:bg-red-700 text-white cursor-pointer active:scale-95'
                )}
              >
                {traumaBayPrepped ? <CheckCheck size={14} /> : <Check size={14} />}
                <span>{traumaBayPrepped ? 'Trauma Bay 01 Ready' : 'Prep Trauma Bay 01'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Header matching original provider-header */}
        <header className="provider-header flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-[#0a3b69] pb-3 mb-5">
          <div>
            <div className="eyebrow eyebrow-dark mb-1">
              <span className="eyebrow-dot" />
              Hospital workspace
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a3b69]">
              Good care needs a clear queue.
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {hospital || 'SmartCare Community Hospital'} · {city || 'Hyderabad'}
            </p>
          </div>
          <div className="text-left sm:text-right text-xs text-[var(--text-muted)]" suppressHydrationWarning>
            <span suppressHydrationWarning>
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]},{' '}
              {new Date().getDate()}{' '}
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'][new Date().getMonth()]}
            </span>
            <br />
            <strong className="text-[var(--text)]">
              {metrics.waiting} active {metrics.waiting === 1 ? 'visit' : 'visits'}
            </strong>
          </div>
        </header>

        {/* 2-Column Hero & Stats Grid matching original provider-grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Provider Hero on Left (7 cols) */}
          <section className="lg:col-span-7 p-6 sm:p-7 rounded-2xl bg-[#0a3b69] text-white shadow-md flex flex-col justify-between">
            <div>
              <div className="eyebrow mb-2" style={{ color: 'rgba(255,255,255,0.75)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-white/70 inline-block mr-1.5" />
                {currentStatus === 'in_progress' ? 'Current consultation' : 'Next in line'}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {current ? current.name : 'Queue is clear'}
              </h2>
              <p className="text-sm text-[#c9def2] mt-1">
                {current
                  ? `${current.symptoms || 'General consultation'} · ${statusLabel(current.status)}`
                  : 'There are no patients waiting for this care centre right now.'}
              </p>

              {current && (
                <div className="flex items-center gap-3 mt-4 flex-wrap text-xs text-[#c9def2] font-semibold">
                  <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold', getTriageColor(current.triage))}>
                    {current.triage || 'Unassessed'} priority
                  </span>
                  {/* Dynamic Triage Adjuster */}
                  <select
                    id="hero-change-triage"
                    value={current.triage || 'Green'}
                    onChange={async (e) => {
                      const newTriage = e.target.value as 'Red' | 'Yellow' | 'Green';
                      updateQueueItem(current.id, { triage: newTriage });
                      await DemoDB.updatePatient(current.id, { triage: newTriage });
                      showToast(`Triage updated to ${newTriage} priority`, 'info');
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white/15 border border-white/25 text-white font-semibold cursor-pointer focus:outline-none focus:bg-white focus:text-[#0a3b69] transition-all"
                    title="Quick adjust triage priority"
                  >
                    <option value="Green" className="text-slate-900">Green (Standard)</option>
                    <option value="Yellow" className="text-slate-900">Yellow (Urgent)</option>
                    <option value="Red" className="text-slate-900">Red (Emergency)</option>
                  </select>
                  <span className="flex items-center gap-1">
                    <Stethoscope size={14} />
                    {current.doctorName || 'General care'}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5 flex-wrap mt-6 pt-4 border-t border-white/20">
              <button
                id="complete-patient"
                onClick={handleAdvanceCurrent}
                disabled={!currentAction[0]}
                className="btn-primary flex items-center gap-2 h-10 px-5 rounded-xl text-xs font-bold text-[#0a3b69] bg-[#c9def2] hover:bg-white transition-all disabled:opacity-50"
              >
                {currentAction[1]}
                {currentStatus === 'in_progress' ? <Check size={16} /> : <ArrowRight size={16} />}
              </button>

              <button
                id="scan-qr-btn"
                type="button"
                onClick={handleOpenQRModal}
                className="btn-secondary flex items-center gap-1.5 h-10 px-4 rounded-xl text-xs font-bold text-white border border-white/25 bg-transparent hover:bg-white hover:text-[#0a3b69] transition-all"
              >
                <QrCode size={16} /> Scan Patient QR
              </button>

              {current && (
                <>
                  <button
                    id="btn-view-passport"
                    type="button"
                    onClick={() => handleOpenMedicalPassport(current)}
                    title="View Patient Medical Passport & Verified Allergies"
                    className="btn-secondary flex items-center gap-1.5 h-10 px-4 rounded-xl text-xs font-bold text-white border border-white/25 bg-transparent hover:bg-white hover:text-[#0a3b69] transition-all"
                  >
                    <FileText size={15} /> Medical Passport
                  </button>

                  <button
                    id="btn-record-vitals"
                    type="button"
                    onClick={() => handleOpenVitalsModal(current)}
                    title="Record Clinical Vitals"
                    className="btn-secondary flex items-center gap-1.5 h-10 px-4 rounded-xl text-xs font-bold text-white border border-white/25 bg-transparent hover:bg-white hover:text-[#0a3b69] transition-all"
                  >
                    <Activity size={15} /> Record Vitals
                  </button>

                  <button
                    id="issue-prescription"
                    type="button"
                    onClick={() => setEditingPatient(current)}
                    className="btn-secondary flex items-center gap-1.5 h-10 px-4 rounded-xl text-xs font-bold text-white border border-white/25 bg-transparent hover:bg-white hover:text-[#0a3b69] transition-all cursor-pointer"
                  >
                    <Stethoscope size={16} /> {currentPrescription ? 'Edit' : 'Launch'} e-Rx Studio
                  </button>

                  <button
                    id="doctor-cancel-patient"
                    type="button"
                    onClick={() => setCancellingPatient(current)}
                    className="btn-secondary flex items-center gap-1.5 h-10 px-3.5 rounded-xl text-xs font-bold text-rose-200 border border-rose-400/40 bg-rose-950/30 hover:bg-rose-600 hover:text-white transition-all"
                  >
                    <Ban size={15} /> Cancel Slot
                  </button>
                </>
              )}

              <button
                id="refresh-queue"
                type="button"
                onClick={() => showToast('Queue refreshed', 'success')}
                className="btn-secondary flex items-center gap-1.5 h-10 px-3 rounded-xl text-xs font-bold text-white border border-white/25 bg-transparent hover:bg-white hover:text-[#0a3b69] transition-all ml-auto"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </section>

          {/* Provider Stats on Right (5 cols) */}
          <section className="lg:col-span-5 grid grid-cols-2 gap-3" aria-label="Queue summary">
            <div className="p-4 rounded-xl border border-[#cbd5e1] bg-[#f8fafc] flex flex-col justify-between">
              <span className="text-xs text-[var(--text-muted)] font-medium">Waiting now</span>
              <strong className="text-2xl font-extrabold text-[#0a3b69] mt-1">{metrics.waiting}</strong>
              <small className="text-[0.7rem] text-[var(--text-dim)]">Live queue count</small>
            </div>
            <div className="p-4 rounded-xl border border-[#cbd5e1] bg-[#f8fafc] flex flex-col justify-between">
              <span className="text-xs text-[var(--text-muted)] font-medium">Priority cases</span>
              <strong className="text-2xl font-extrabold text-[#0a3b69] mt-1">{metrics.priority}</strong>
              <small className="text-[0.7rem] text-[var(--text-dim)]">Needs attention first</small>
            </div>
            <div className="p-4 rounded-xl border border-[#cbd5e1] bg-[#f8fafc] flex flex-col justify-between">
              <span className="text-xs text-[var(--text-muted)] font-medium">Average wait</span>
              <strong className="text-2xl font-extrabold text-[#0a3b69] mt-1">{metrics.averageWait}m</strong>
              <small className="text-[0.7rem] text-[var(--text-dim)]">Based on arrival time</small>
            </div>
            <div className="p-4 rounded-xl border border-[#cbd5e1] bg-[#f8fafc] flex flex-col justify-between">
              <span className="text-xs text-[var(--text-muted)] font-medium">Room status</span>
              <strong className="text-2xl font-extrabold text-[#0a3b69] mt-1">
                {currentStatus === 'in_progress' ? 'In use' : 'Open'}
              </strong>
              <small className="text-[0.7rem] text-[var(--text-dim)]">Consultation room 01</small>
            </div>
          </section>
        </div>

        {/* Care Team Roster matching care-team-card */}
        <section className="bg-white border border-[var(--line)] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--line)] mb-4">
            <div>
              <h2 className="text-base font-bold text-[#0a3b69]">Hospital care team</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Each clinician has a department, room, availability, and live queue count.
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#e5f1fc] text-[#0f5ca8]">
              {CARE_TEAM.length} clinicians
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {CARE_TEAM.map((member) => {
              const assigned = queue.filter((p) => p.doctorName === member.name).length;
              const initials = member.name
                .split(' ')
                .slice(1)
                .map((part) => part[0])
                .join('')
                .slice(0, 2);

              return (
                <div key={member.name} className="p-3.5 rounded-xl border border-[var(--line)] bg-[#f8fafc] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0a3b69] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {initials || 'MD'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <strong className="text-xs font-bold text-[#0a3b69] truncate block">{member.name}</strong>
                    <span className="text-[0.7rem] text-[var(--text-muted)] truncate block">{member.specialty}</span>
                    <small className="text-[0.65rem] text-[var(--text-dim)] block">
                      {member.room} · {member.availability}
                    </small>
                  </div>
                  <div className="text-right shrink-0">
                    <strong className="text-sm font-bold text-[#0a3b69] block">{assigned}</strong>
                    <small className="text-[0.6rem] text-[var(--text-dim)] uppercase">active</small>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Live Queue & Triage Visualizer Component */}
        <LiveQueueTriageVisualizer
          queue={sorted}
          currentPatient={current}
          onAdvanceCurrent={handleAdvanceCurrent}
          onCallPatient={(p) => {
            updateQueueItem(p.id, { status: 'called' });
            showToast(`Called ${p.name}`, 'success');
          }}
          onStartConsultation={(p) => {
            updateQueueItem(p.id, { status: 'in_progress' });
            showToast(`Started consultation for ${p.name}`, 'success');
          }}
          onOpenERxStudio={(p) => setEditingPatient(p)}
          onOpenVitals={(p) => handleOpenVitalsModal(p)}
          onOpenPassport={(p) => handleOpenMedicalPassport(p)}
        />

        {/* Full Patient Queue Table matching original doctor view */}
        <section className="bg-white dark:bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-5 shadow-sm transition-colors">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--line)] mb-4">
            <div>
              <h2 className="text-base font-bold text-[#0a3b69]">Patient queue</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Priority first, then arrival time. Move one visit through each handoff.
              </p>
            </div>
            <span className="text-xs font-bold text-[var(--text-muted)]">{sorted.length} total entries</span>
          </div>

          {sorted.length === 0 ? (
            <div className="text-center py-10 text-[var(--text-muted)] flex flex-col items-center gap-2">
              <Users size={32} />
              <p className="text-sm">No patients in queue right now.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#f0f6fc] text-[#0a3b69] border-b border-[var(--line)]">
                    <th className="p-3 font-bold">Patient</th>
                    <th className="p-3 font-bold">Reason</th>
                    <th className="p-3 font-bold">Priority</th>
                    <th className="p-3 font-bold">Status</th>
                    <th className="p-3 font-bold">Clinician</th>
                    <th className="p-3 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {sorted.map((patient, index) => {
                    const isCurrent = current?.id === patient.id;
                    const pStatus = String(patient.status || 'waiting').toLowerCase();

                    return (
                      <tr key={patient.id} className={cn('hover:bg-[#fbfdff] transition-colors', isCurrent && 'bg-[#eaf4fd]/60')}>
                        <td className="p-3">
                          <strong className="text-[#0a3b69] block font-bold">
                            {index + 1}. {patient.name}
                          </strong>
                          <small className="text-[var(--text-dim)]">
                            {patient.age ? `${patient.age} yrs` : ''} · {patient.gender || 'Not specified'}
                          </small>
                        </td>
                        <td className="p-3 text-[var(--text-muted)] max-w-xs truncate">
                          {patient.symptoms || 'General consultation'}
                        </td>
                        <td className="p-3">
                          <span className={cn('px-2 py-0.5 rounded-full text-[0.65rem] font-bold', getTriageColor(patient.triage))}>
                            {patient.triage || 'Standard'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wider',
                              pStatus === 'in_progress'
                                ? 'bg-green-100 text-green-800'
                                : pStatus === 'called'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            )}
                          >
                            {statusLabel(patient.status)}
                          </span>
                        </td>
                        <td className="p-3 text-[var(--text-muted)]">{patient.doctorName || 'General care'}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {pStatus === 'waiting' && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateQueueItem(patient.id, { status: 'called' });
                                  showToast(`Called ${patient.name}`, 'success');
                                }}
                                className="h-7 px-2.5 rounded-lg border border-[var(--line)] bg-white text-[0.7rem] font-bold text-[#0f5ca8] hover:bg-[#e5f1fc]"
                              >
                                Call
                              </button>
                            )}
                            {pStatus === 'called' && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateQueueItem(patient.id, { status: 'in_progress' });
                                  showToast(`Started consultation for ${patient.name}`, 'success');
                                }}
                                className="h-7 px-2.5 rounded-lg border border-transparent bg-[#0f5ca8] text-[0.7rem] font-bold text-white hover:brightness-105"
                              >
                                Start
                              </button>
                            )}
                            {pStatus === 'in_progress' && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateQueueItem(patient.id, { status: 'completed' });
                                  showToast(`Completed visit for ${patient.name}`, 'success');
                                }}
                                className="h-7 px-2.5 rounded-lg border border-transparent bg-green-600 text-[0.7rem] font-bold text-white hover:brightness-105"
                              >
                                Complete
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenPrescriptionModal(patient)}
                              title="Prescription"
                              className="h-7 w-7 rounded-lg border border-[var(--line)] bg-white flex items-center justify-center text-[var(--text-muted)] hover:text-[#0f5ca8]"
                            >
                              <NotebookPen size={13} />
                            </button>
                            {['waiting', 'called'].includes(pStatus) && (
                              <button
                                type="button"
                                onClick={() => setCancellingPatient(patient)}
                                title="Cancel visit and release slot"
                                className="h-7 w-7 rounded-lg border border-rose-200 bg-rose-50 flex items-center justify-center text-rose-700 hover:bg-rose-100"
                              >
                                <Ban size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Released / Cancelled Slots Section */}
        {cancelledQueue && cancelledQueue.length > 0 && (
          <section className="bg-white border-t-4 border-slate-400 border-x border-b border-[var(--line)] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)] mb-4">
              <div>
                <h2 className="text-base font-bold text-[#0a3b69] flex items-center gap-2">
                  <Ban size={16} className="text-rose-600" />
                  Released / Cancelled Slots ({cancelledQueue.length})
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Visits released by patients or cancelled by clinicians. Capacity returned to pool.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    <th className="p-3 font-bold">Patient</th>
                    <th className="p-3 font-bold">Cancelled By</th>
                    <th className="p-3 font-bold">Clinical Reason</th>
                    <th className="p-3 font-bold">Time</th>
                    <th className="p-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cancelledQueue.map((item) => (
                    <tr key={item.id} className="opacity-85 hover:opacity-100">
                      <td className="p-3">
                        <strong className="text-slate-900 block font-bold">{item.name}</strong>
                        <small className="text-slate-500">{item.department || 'General'}</small>
                      </td>
                      <td className="p-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[11px] font-bold',
                            item.cancelledBy === 'doctor'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          )}
                        >
                          {item.cancelledBy === 'doctor' ? 'Clinician' : 'Patient'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700 font-medium">
                        {item.cancellationReason || 'Schedule conflict'}
                      </td>
                      <td className="p-3 text-slate-500 font-mono">
                        {item.cancelledAt
                          ? new Date(item.cancelledAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Recently'}
                      </td>
                      <td className="p-3">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600">
                          Slot Released
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {/* ── On-Duty Vitals Capture Modal ── */}
      {showVitalsModal && vitalsPatient && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[88vh] overflow-y-auto animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-teal-600" />
                  Record Clinical Vitals
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Patient: <strong>{vitalsPatient.name}</strong> · {vitalsPatient.age ? `${vitalsPatient.age}Y` : '32Y'} / {vitalsPatient.gender || 'F'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowVitalsModal(false)}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:text-slate-600 active:scale-95 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveVitals} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Blood Pressure (mmHg)
                  </label>
                  <input
                    type="text"
                    required
                    value={vitalsBp}
                    onChange={(e) => setVitalsBp(e.target.value)}
                    placeholder="120/80"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    style={{ fontSize: '16px' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pulse Rate (bpm)
                  </label>
                  <input
                    type="number"
                    required
                    value={vitalsPulse}
                    onChange={(e) => setVitalsPulse(e.target.value)}
                    placeholder="76"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    style={{ fontSize: '16px' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Oxygen SpO2 (%)
                  </label>
                  <input
                    type="number"
                    required
                    value={vitalsSpo2}
                    onChange={(e) => setVitalsSpo2(e.target.value)}
                    placeholder="99"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    style={{ fontSize: '16px' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Body Temp (°F)
                  </label>
                  <input
                    type="text"
                    required
                    value={vitalsTemp}
                    onChange={(e) => setVitalsTemp(e.target.value)}
                    placeholder="98.4"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVitalsModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 min-h-[44px] shadow-sm"
                >
                  <Check size={16} /> Save Vitals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Doctor Cancellation Modal ── */}
      {cancellingPatient && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Ban className="w-5 h-5 text-rose-600" />
                  Cancel / Reschedule Visit
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Patient: <strong>{cancellingPatient.name}</strong> (Ref: {cancellingPatient.id})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCancellingPatient(null)}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:text-slate-600 active:scale-95 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const res = await cancelAppointment(cancellingPatient.id, 'doctor', cancelReason);
                setCancellingPatient(null);
                if (res.success) {
                  showToast('Visit cancelled. Slot released back to department and patient notified.', 'info');
                } else {
                  showToast(res.error || 'Failed to cancel appointment', 'error');
                }
              }}
              className="space-y-4"
            >
              <p className="text-xs text-slate-600 bg-rose-50 border border-rose-200 p-3 rounded-xl">
                Cancelling immediately releases this slot back to the department and notifies the patient with a free reschedule voucher.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Clinical Reason for Cancellation
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  style={{ fontSize: '16px' }}
                >
                  <option value="Doctor summoned for emergency trauma surgery">
                    Doctor summoned for emergency trauma surgery
                  </option>
                  <option value="Urgent Ward Callout">Urgent Ward Callout</option>
                  <option value="Clinician emergency medical leave / Off-duty">
                    Clinician emergency medical leave / Off-duty
                  </option>
                  <option value="OT / Diagnostic lab equipment maintenance">
                    OT / Diagnostic lab equipment maintenance
                  </option>
                  <option value="Patient transferred to specialist ward">
                    Patient transferred to specialist ward
                  </option>
                </select>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setCancellingPatient(null)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 min-h-[44px] active:scale-95 transition-all"
                >
                  Keep Visit
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm min-h-[44px] active:scale-95"
                >
                  <Ban size={15} /> Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Interactive e-Rx Studio with Safety Guards ── */}
      {editingPatient && (
        <ERxStudioModal
          patient={editingPatient}
          hospitalName={hospital}
          onClose={() => setEditingPatient(null)}
          onSuccess={(rx) => {
            setEditingPatient(null);
            showToast(`Prescription ${rx.rxId} digitally signed & issued!`, 'success');
          }}
        />
      )}

      {/* QR Scanner Modal */}
      {showQRModal && (
        <div className="modal-backdrop" onClick={() => setShowQRModal(false)}>
          <div
            className="prescription-modal"
            style={{ maxWidth: '520px' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-scanner-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="prescription-modal-header">
              <h3 id="qr-scanner-title" className="flex items-center gap-2 font-bold text-sm text-[var(--teal-dark)]">
                <QrCode size={18} /> Scan Patient QR Code
              </h3>
              <button
                type="button"
                className="btn-ghost modal-close-button"
                onClick={() => setShowQRModal(false)}
                aria-label="Close scanner"
              >
                <X size={18} />
              </button>
            </div>
            <div className="prescription-modal-body text-center p-5">
              <p className="text-xs text-[var(--muted)] mb-4">
                Scan an appointment ticket to check in, or a Medical History code to open its read-only clinical summary.
              </p>
              <div
                className="relative flex flex-col items-center justify-center mx-auto mb-4 rounded-xl border border-dashed border-[var(--teal)] bg-black text-white"
                style={{ width: '100%', maxWidth: '380px', minHeight: '220px' }}
              >
                <Camera size={36} className="text-gray-400 mb-2 opacity-80" />
                <span className="text-xs font-semibold text-gray-300">Simulated QR Scanner Active</span>
                <small className="text-[11px] text-gray-400 mt-1">Point camera at QR token or use manual entry below</small>
              </div>

              <div className="mt-4 pt-4 border-t border-[var(--line)]">
                <p className="text-xs text-[var(--muted)] mb-2">Or type / paste reference ID manually:</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleProcessQR(manualQRInput);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    placeholder="e.g. SC-DEMO001 or SC-PASSPORT-8924"
                    value={manualQRInput}
                    onChange={(e) => setManualQRInput(e.target.value)}
                    className="flex-1 p-2.5 rounded-lg border border-[var(--line)] text-xs font-bold bg-[var(--surface)] text-[var(--text)]"
                  />
                  <button type="submit" className="btn-primary px-4 py-2 text-xs font-bold">
                    Open code
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shared Medical Passport Modal */}
      {passportModalData && (
        <div className="modal-backdrop" onClick={() => setPassportModalData(null)}>
          <div
            className="prescription-modal passport-review-modal"
            style={{ maxWidth: '720px' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="passport-review-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="prescription-modal-header">
              <h3 id="passport-review-title" className="flex items-center gap-2 font-bold text-sm text-[var(--teal-dark)]">
                <ShieldPlus size={18} /> Shared Medical History
              </h3>
              <button
                type="button"
                className="btn-ghost modal-close-button"
                onClick={() => setPassportModalData(null)}
                aria-label="Close Medical History"
              >
                <X size={18} />
              </button>
            </div>
            <div className="prescription-modal-body p-5 space-y-4">
              <div className="passport-review-banner grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-[#eef7ff] border border-[#bce0fd] rounded-xl text-xs">
                <div>
                  <small className="block text-[10px] text-[var(--muted)] uppercase font-bold">Patient</small>
                  <strong>{passportModalData.profile.name || 'Patient'}</strong>
                </div>
                <div>
                  <small className="block text-[10px] text-[var(--muted)] uppercase font-bold">Age / Gender</small>
                  <strong>{passportModalData.profile.age} / {passportModalData.profile.gender}</strong>
                </div>
                <div>
                  <small className="block text-[10px] text-[var(--muted)] uppercase font-bold">Share ID</small>
                  <strong>{passportModalData.passportId}</strong>
                </div>
                <div>
                  <small className="block text-[10px] text-[var(--muted)] uppercase font-bold">Last updated</small>
                  <strong>{passportModalData.history.lastUpdated || 'Recent'}</strong>
                </div>
              </div>

              {passportModalData.history.previousProvider && (
                <section className="passport-provider-summary flex items-start gap-3 p-3 bg-gray-50 border border-[var(--line)] rounded-xl text-xs">
                  <HospitalIcon size={18} className="text-[var(--teal)] shrink-0 mt-0.5" />
                  <div>
                    <small className="block text-[10px] text-[var(--muted)] uppercase font-bold">Previous primary provider</small>
                    <strong className="text-[var(--text)]">{passportModalData.history.previousProvider.doctorName}</strong>
                    <p className="text-[var(--muted)] text-xs mt-0.5">
                      {passportModalData.history.previousProvider.hospitalName} · {passportModalData.history.previousProvider.city}
                    </p>
                  </div>
                </section>
              )}

              <div className="passport-review-grid grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <section className="p-3 bg-white border border-[var(--line)] rounded-xl">
                  <h4 className="flex items-center gap-1.5 font-bold text-[#0a3b69] mb-2">
                    <Pill size={14} /> Effective medications
                  </h4>
                  {passportModalData.history.effectiveMedications?.length ? (
                    <ul className="space-y-1.5">
                      {passportModalData.history.effectiveMedications.map((m, i) => (
                        <li key={i} className="text-gray-700">
                          <strong>{m.medicineName}</strong> · {m.dosage} <small className="text-gray-500">({m.conditionTreated})</small>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-xs">No medications recorded.</p>
                  )}
                </section>

                <section className="passport-alert-card p-3 bg-red-50/60 border border-red-200 rounded-xl">
                  <h4 className="flex items-center gap-1.5 font-bold text-red-700 mb-2">
                    <TriangleAlert size={14} /> Allergies &amp; avoid
                  </h4>
                  {passportModalData.history.allergiesAndAvoid?.length ? (
                    <ul className="space-y-1.5">
                      {passportModalData.history.allergiesAndAvoid.map((a, i) => (
                        <li key={i} className="text-red-900">
                          <strong>{a.substance}</strong> · {a.severity} <small className="text-red-700">({a.reactionDescription})</small>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-xs">No allergies recorded.</p>
                  )}
                </section>

                <section className="p-3 bg-white border border-[var(--line)] rounded-xl">
                  <h4 className="flex items-center gap-1.5 font-bold text-[#0a3b69] mb-2">
                    <ClipboardList size={14} /> Care conditions
                  </h4>
                  {passportModalData.history.careConditions?.length ? (
                    <ul className="space-y-1.5">
                      {passportModalData.history.careConditions.map((c, i) => (
                        <li key={i} className="text-gray-700">
                          <strong>{c.category}:</strong> {c.instruction}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-xs">No care conditions recorded.</p>
                  )}
                </section>

                <section className="passport-emergency-card p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                  <h4 className="flex items-center gap-1.5 font-bold text-amber-800 mb-2">
                    <Siren size={14} /> Emergency protocols
                  </h4>
                  {passportModalData.history.emergencyProtocols?.length ? (
                    <ul className="space-y-1.5">
                      {passportModalData.history.emergencyProtocols.map((e, i) => (
                        <li key={i} className="text-amber-950">
                          <strong>{e.triggerCondition}:</strong> {e.actionSteps}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-xs">No emergency protocols recorded.</p>
                  )}
                </section>
              </div>

              <div className="provider-notice flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-[11px]">
                <BadgeInfo size={15} className="shrink-0 text-blue-700" />
                <span>Demo handoff only. Confirm the patient's identity, current medicines, allergies, and emergency instructions before making clinical decisions.</span>
              </div>
            </div>

            <div className="prescription-modal-actions flex items-center justify-between p-4 border-t border-[var(--line)] bg-[var(--surface-sunken)]">
              <span className="status-note text-xs text-[var(--muted)]">Read-only clinical view</span>
              <button
                type="button"
                className="btn-primary px-5 py-2 rounded-lg text-xs font-bold"
                onClick={() => setPassportModalData(null)}
              >
                Done reviewing
              </button>
            </div>
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
}
